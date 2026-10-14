import hashlib
import os
import secrets

import bcrypt

from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)

from jose import JWTError, jwt

from sqlalchemy.orm import Session

from rag.database import get_db

from rag.models import (
    PasswordResetToken,
    User,
)

from rag.email_service import (
    send_password_reset_email,
)

from rag.schemas import (
    AuthResponse,
    CaptchaResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    ResetPasswordRequest,
    SignupRequest,
    UserResponse,
)


load_dotenv()


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


SECRET_KEY = os.getenv(
    "AUTH_SECRET_KEY"
)


if not SECRET_KEY:

    raise RuntimeError(
        "AUTH_SECRET_KEY was not found. "
        "Add AUTH_SECRET_KEY to .env."
    )


ALGORITHM = "HS256"


NORMAL_TOKEN_EXPIRE_MINUTES = 60 * 24

REMEMBER_TOKEN_EXPIRE_MINUTES = (
    60 * 24 * 30
)

CAPTCHA_EXPIRE_MINUTES = 5

RESET_TOKEN_EXPIRE_MINUTES = 15


security = HTTPBearer()


# ============================================================
# PASSWORD
# ============================================================

def hash_password(
    password: str,
) -> str:

    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")


def verify_password(
    password: str,
    password_hash: str,
) -> bool:

    try:

        return bcrypt.checkpw(
            password.encode("utf-8"),
            password_hash.encode("utf-8"),
        )

    except (
        ValueError,
        TypeError,
    ):

        return False


# ============================================================
# CAPTCHA
# ============================================================

def create_captcha():

    number1 = secrets.randbelow(41) + 10

    number2 = secrets.randbelow(20) + 1

    answer = number1 + number2

    question = (
        f"{number1} + {number2} = ?"
    )

    expire = (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=CAPTCHA_EXPIRE_MINUTES
        )
    )

    payload = {
        "captcha_answer": str(answer),
        "purpose": "login_captcha",
        "exp": expire,
    }

    token = jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return question, token


def verify_captcha(
    captcha_token: str,
    captcha_answer: str,
):

    try:

        payload = jwt.decode(
            captcha_token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        if payload.get(
            "purpose"
        ) != "login_captcha":

            return False

        correct_answer = payload.get(
            "captcha_answer"
        )

        if correct_answer is None:
            return False

        return (
            str(captcha_answer).strip()
            == str(correct_answer).strip()
        )

    except JWTError:

        return False


@router.get(
    "/captcha",
    response_model=CaptchaResponse,
)
def get_captcha():
    import time

    start = time.perf_counter()
    print("[CAPTCHA] Request received", flush=True)

    try:
        question, token = create_captcha()
        print(
            f"[CAPTCHA] Token generated in "
            f"{time.perf_counter() - start:.4f}s",
            flush=True,
        )

        result = CaptchaResponse(
            question=question,
            captcha_token=token,
        )

        print(
            f"[CAPTCHA] Completed in "
            f"{time.perf_counter() - start:.4f}s",
            flush=True,
        )

        return result

    except Exception:
        import traceback
        traceback.print_exc()
        raise

# ============================================================
# ACCESS TOKEN
# ============================================================

def create_access_token(
    user_id: int,
    remember_me: bool = False,
):

    expire_minutes = (
        REMEMBER_TOKEN_EXPIRE_MINUTES
        if remember_me
        else NORMAL_TOKEN_EXPIRE_MINUTES
    )

    expire = (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=expire_minutes
        )
    )

    payload = {
        "sub": str(user_id),
        "exp": expire,
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


# ============================================================
# REGISTER
# ============================================================

@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    request: SignupRequest,
    db: Session = Depends(get_db),
):

    name = request.name.strip()

    email = (
        request.email
        .lower()
        .strip()
    )

    password = request.password


    if not name:

        raise HTTPException(
            status_code=400,
            detail="Name is required.",
        )


    if len(password) < 6:

        raise HTTPException(
            status_code=400,
            detail=(
                "Password must contain "
                "at least 6 characters."
            ),
        )


    if len(
        password.encode("utf-8")
    ) > 72:

        raise HTTPException(
            status_code=400,
            detail=(
                "Password is too long. "
                "Maximum is 72 bytes."
            ),
        )


    existing_user = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )


    if existing_user:

        raise HTTPException(
            status_code=409,
            detail=(
                "An account with this "
                "email already exists."
            ),
        )


    user = User(
        name=name,
        email=email,
        password_hash=hash_password(
            password
        ),
    )


    db.add(user)

    db.commit()

    db.refresh(user)


    return AuthResponse(
        message=(
            "Account created successfully."
        ),
        access_token=create_access_token(
            user.id
        ),
        user_id=user.id,
        name=user.name,
        email=user.email,
    )


# ============================================================
# LOGIN
# ============================================================

@router.post(
    "/login",
    response_model=AuthResponse,
)
def login(
    request: LoginRequest,
    db: Session = Depends(get_db),
):

    if not verify_captcha(
        request.captcha_token,
        request.captcha_answer,
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid or expired CAPTCHA."
            ),
        )


    email = (
        request.email
        .lower()
        .strip()
    )


    user = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )


    if not user or not verify_password(
        request.password,
        user.password_hash,
    ):

        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid email or password."
            ),
        )


    token = create_access_token(
        user.id,
        request.remember_me,
    )


    return AuthResponse(
        message="Login successful.",
        access_token=token,
        user_id=user.id,
        name=user.name,
        email=user.email,
    )


# ============================================================
# FORGOT PASSWORD
# ============================================================

@router.post(
    "/forgot-password",
    response_model=ForgotPasswordResponse,
)
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):

    email = (
        request.email
        .lower()
        .strip()
    )


    user = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )


    generic_message = (
        "If an account exists with this email, "
        "a password reset link has been sent."
    )


    # Do not reveal whether email exists.
    if not user:

        return ForgotPasswordResponse(
            message=generic_message
        )


    # --------------------------------------------------------
    # Remove previous unused reset tokens
    # --------------------------------------------------------

    old_tokens = (
        db.query(
            PasswordResetToken
        )
        .filter(
            PasswordResetToken.user_id
            == user.id,
            PasswordResetToken.used_at
            == None,
        )
        .all()
    )


    for old_token in old_tokens:

        old_token.used_at = (
            datetime.utcnow()
        )


    # --------------------------------------------------------
    # Create secure random token
    # --------------------------------------------------------

    raw_token = secrets.token_urlsafe(
        32
    )


    token_hash = hashlib.sha256(
        raw_token.encode("utf-8")
    ).hexdigest()


    expires_at = (
        datetime.utcnow()
        + timedelta(
            minutes=RESET_TOKEN_EXPIRE_MINUTES
        )
    )


    reset_record = PasswordResetToken(

        user_id=user.id,

        token_hash=token_hash,

        expires_at=expires_at,

    )


    db.add(reset_record)

    db.commit()


    # --------------------------------------------------------
    # Send email
    # --------------------------------------------------------

    try:

        send_password_reset_email(
            recipient_email=user.email,
            recipient_name=user.name,
            reset_token=raw_token,
        )

    except Exception as exc:

        db.delete(reset_record)

        db.commit()

        print(
            "Password reset email error:",
            exc,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to send password reset "
                "email. Check SMTP configuration."
            ),
        )


    return ForgotPasswordResponse(
        message=generic_message
    )


# ============================================================
# RESET PASSWORD
# ============================================================

@router.post(
    "/reset-password",
)
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db),
):

    if not request.token:

        raise HTTPException(
            status_code=400,
            detail="Reset token is required.",
        )


    if len(request.new_password) < 6:

        raise HTTPException(
            status_code=400,
            detail=(
                "Password must contain "
                "at least 6 characters."
            ),
        )


    if len(
        request.new_password.encode("utf-8")
    ) > 72:

        raise HTTPException(
            status_code=400,
            detail=(
                "Password is too long. "
                "Maximum is 72 bytes."
            ),
        )


    token_hash = hashlib.sha256(
        request.token.encode("utf-8")
    ).hexdigest()


    reset_record = (
        db.query(
            PasswordResetToken
        )
        .filter(
            PasswordResetToken.token_hash
            == token_hash
        )
        .first()
    )


    if not reset_record:

        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid or expired "
                "password reset link."
            ),
        )


    if reset_record.used_at:

        raise HTTPException(
            status_code=400,
            detail=(
                "This password reset link "
                "has already been used."
            ),
        )


    if (
        datetime.utcnow()
        > reset_record.expires_at
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "This password reset link "
                "has expired."
            ),
        )


    user = (
        db.query(User)
        .filter(
            User.id
            == reset_record.user_id
        )
        .first()
    )


    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )


    # --------------------------------------------------------
    # Update password
    # --------------------------------------------------------

    user.password_hash = hash_password(
        request.new_password
    )


    # --------------------------------------------------------
    # Make token one-time-use
    # --------------------------------------------------------

    reset_record.used_at = (
        datetime.utcnow()
    )


    # Invalidate other unused reset links
    other_tokens = (
        db.query(
            PasswordResetToken
        )
        .filter(
            PasswordResetToken.user_id
            == user.id,
            PasswordResetToken.used_at
            == None,
            PasswordResetToken.id
            != reset_record.id,
        )
        .all()
    )


    for token in other_tokens:

        token.used_at = (
            datetime.utcnow()
        )


    db.commit()


    return {
        "message": (
            "Password reset successfully. "
            "You can now login with your new password."
        )
    }


# ============================================================
# CURRENT USER
# ============================================================

def get_current_user(
    credentials:
        HTTPAuthorizationCredentials = Depends(
            security
        ),
    db: Session = Depends(get_db),
):

    try:

        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )


        user_id = payload.get("sub")


        if not user_id:

            raise HTTPException(
                status_code=401,
                detail=(
                    "Invalid authentication token."
                ),
            )


        user_id = int(user_id)


    except (
        JWTError,
        ValueError,
    ):

        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid or expired "
                "authentication token."
            ),
        )


    user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )


    if not user:

        raise HTTPException(
            status_code=401,
            detail=(
                "User no longer exists."
            ),
        )


    return user


# ============================================================
# ME
# ============================================================

@router.get(
    "/me",
    response_model=UserResponse,
)
def get_me(
    user: User = Depends(
        get_current_user
    ),
):

    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
    )