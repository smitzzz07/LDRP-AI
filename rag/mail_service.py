import os
import smtplib

from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from dotenv import load_dotenv


load_dotenv()


SMTP_HOST = os.getenv(
    "SMTP_HOST",
    "smtp.gmail.com",
)

SMTP_PORT = int(
    os.getenv(
        "SMTP_PORT",
        "587",
    )
)

SMTP_USERNAME = os.getenv(
    "SMTP_USERNAME"
)

SMTP_PASSWORD = os.getenv(
    "SMTP_PASSWORD"
)

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173",
)


def send_password_reset_email(
    recipient_email: str,
    recipient_name: str,
    reset_token: str,
):

    if not SMTP_USERNAME:
        raise RuntimeError(
            "SMTP_USERNAME is not configured."
        )

    if not SMTP_PASSWORD:
        raise RuntimeError(
            "SMTP_PASSWORD is not configured."
        )


    reset_url = (
        f"{FRONTEND_URL}"
        f"/?reset_token={reset_token}"
    )


    subject = "LDRP AI - Reset Your Password"


    text_body = f"""
Hello {recipient_name},

We received a request to reset your LDRP AI password.

Use the following link to create a new password:

{reset_url}

This link will expire in 15 minutes.

If you did not request a password reset,
you can safely ignore this email.

Regards,
LDRP AI
LDRP-ITR Academic Assistant
"""


    html_body = f"""
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>
LDRP AI Password Reset
</title>

</head>

<body
style="
margin:0;
padding:0;
background:#0f0b1c;
font-family:Arial,sans-serif;
"
>

<table
width="100%"
cellpadding="0"
cellspacing="0"
>

<tr>

<td
align="center"
style="padding:40px 20px;"
>

<table
width="600"
cellpadding="0"
cellspacing="0"
style="
max-width:600px;
background:#181426;
border:1px solid #30294a;
border-radius:18px;
overflow:hidden;
"
>

<tr>

<td
style="
padding:35px;
text-align:center;
"
>

<div
style="
width:60px;
height:60px;
margin:auto;
border-radius:16px;
background:linear-gradient(
135deg,
#7c3aed,
#4f46e5
);
color:white;
font-size:30px;
line-height:60px;
"
>
*
</div>

<h1
style="
color:#ffffff;
margin:20px 0 8px;
"
>
LDRP AI
</h1>

<p
style="
color:#aaa3bb;
margin:0;
"
>
Academic Assistant
</p>

</td>

</tr>


<tr>

<td
style="
padding:0 35px 35px;
"
>

<h2
style="
color:#ffffff;
"
>
Reset Your Password
</h2>

<p
style="
color:#c5c0d0;
font-size:15px;
line-height:1.6;
"
>
Hello {recipient_name},
</p>

<p
style="
color:#c5c0d0;
font-size:15px;
line-height:1.6;
"
>
We received a request to reset your
LDRP AI account password.
</p>

<div
style="
text-align:center;
margin:30px 0;
"
>

<a
href="{reset_url}"
style="
display:inline-block;
padding:15px 30px;
background:linear-gradient(
135deg,
#7c3aed,
#6366f1
);
color:#ffffff;
text-decoration:none;
border-radius:10px;
font-weight:bold;
"
>
Reset Password
</a>

</div>

<p
style="
color:#9f99ad;
font-size:13px;
line-height:1.6;
"
>
This password reset link will expire
in <strong>15 minutes</strong>.
</p>

<p
style="
color:#9f99ad;
font-size:13px;
line-height:1.6;
"
>
If you did not request this password reset,
you can safely ignore this email.
</p>

<hr
style="
border:0;
border-top:1px solid #30294a;
margin:30px 0;
"
/>

<p
style="
color:#777181;
font-size:12px;
text-align:center;
"
>
LDRP-ITR AI Academic Assistant
</p>

</td>

</tr>

</table>

</td>

</tr>

</table>

</body>

</html>
"""


    message = MIMEMultipart(
        "alternative"
    )

    message["Subject"] = subject

    message["From"] = SMTP_USERNAME

    message["To"] = recipient_email


    message.attach(
        MIMEText(
            text_body,
            "plain",
            "utf-8",
        )
    )


    message.attach(
        MIMEText(
            html_body,
            "html",
            "utf-8",
        )
    )


    with smtplib.SMTP(
        SMTP_HOST,
        SMTP_PORT,
    ) as server:

        server.ehlo()

        server.starttls()

        server.ehlo()

        server.login(
            SMTP_USERNAME,
            SMTP_PASSWORD,
        )

        server.sendmail(
            SMTP_USERNAME,
            recipient_email,
            message.as_string(),
        )