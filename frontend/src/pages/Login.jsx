import React, { useEffect, useState } from "react";
import "../Auth.css";

const AUTH_API = "http://127.0.0.1:8000/api/auth";

export default function Login({ onLogin, onShowSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaQuestion, setCaptchaQuestion] = useState("");

  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [error, setError] = useState("");

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const loadCaptcha = async () => {
    setCaptchaLoading(true);
    setCaptchaAnswer("");
    setError("");

    try {
      const response = await fetch(`${AUTH_API}/captcha`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to load CAPTCHA.");
      }

      setCaptchaQuestion(data.question);
      setCaptchaToken(data.captcha_token);
    } catch (err) {
      setError(err.message || "Unable to load CAPTCHA. Please try again.");
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => {
    loadCaptcha();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (!captchaAnswer.trim()) {
      setError("Please enter the CAPTCHA answer.");
      return;
    }

    if (!captchaToken) {
      setError("CAPTCHA is not ready. Please refresh it.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${AUTH_API}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          captcha_token: captchaToken,
          captcha_answer: captchaAnswer.trim(),
          remember_me: rememberMe,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Invalid email or password.");
      }

      const user = {
        id: data.user_id,
        name: data.name,
        email: data.email,
      };

      if (rememberMe) {
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("user", JSON.stringify(user));
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("user");
      } else {
        sessionStorage.setItem("access_token", data.access_token);
        sessionStorage.setItem("user", JSON.stringify(user));
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
      }

      onLogin?.(user);
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
      loadCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    setForgotMessage("");
    setForgotSuccess(false);

    if (!forgotEmail.trim()) {
      setForgotMessage("Please enter your email address.");
      return;
    }

    setForgotLoading(true);

    try {
      const response = await fetch(`${AUTH_API}/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: forgotEmail.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to process password reset request."
        );
      }

      setForgotMessage(
        data.message ||
          "If an account exists with this email, a password reset link has been sent."
      );
      setForgotSuccess(true);
    } catch (err) {
      setForgotMessage(err.message || "Unable to process request.");
      setForgotSuccess(false);
    } finally {
      setForgotLoading(false);
    }
  };

  const openForgotPassword = () => {
    setShowForgotPassword(true);
    setForgotEmail(email);
    setForgotMessage("");
    setForgotSuccess(false);
    setError("");
  };

  const backToLogin = () => {
    setShowForgotPassword(false);
    setForgotEmail("");
    setForgotMessage("");
    setForgotSuccess(false);
    setError("");
  };

  if (showForgotPassword) {
    return (
      <div className="auth-page">
        <div className="auth-background">
          <div className="auth-glow auth-glow-one" />
          <div className="auth-glow auth-glow-two" />
        </div>

        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-orb">◈</div>
            <div>
              <h1>LDRP AI</h1>
              <span>Academic Assistant</span>
            </div>
          </div>

          <div className="auth-heading">
            <h2>Forgot Password</h2>
            <p>
              Enter your registered email address to reset your password.
            </p>
          </div>

          <form onSubmit={handleForgotPassword} className="auth-form">
            <div className="form-group">
              <label>Email Address</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">✉</span>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={forgotEmail}
                  onChange={(event) => setForgotEmail(event.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            {forgotMessage && (
              <div
                className={forgotSuccess ? "auth-success" : "auth-error"}
              >
                {forgotMessage}
              </div>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={forgotLoading}
            >
              {forgotLoading ? "Sending..." : "Send Reset Request"}
            </button>
          </form>

          <div className="auth-switch">
            <button type="button" onClick={backToLogin}>
              ← Back to Login
            </button>
          </div>

          <div className="auth-footer">
            <span>Powered by</span>
            <strong>LDRP RAG</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-background">
        <div className="auth-glow auth-glow-one" />
        <div className="auth-glow auth-glow-two" />
      </div>

      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-orb">◈</div>
          <div>
            <h1>LDRP AI</h1>
            <span>Academic Assistant</span>
          </div>
        </div>

        <div className="auth-heading">
          <h2>Welcome Back</h2>
          <p>Sign in to continue to your LDRP AI assistant.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email Address</label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">✉</span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">⌑</span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Security Verification</label>

            <div
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  flex: 1,
                  minHeight: "48px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.05)",
                  fontWeight: "700",
                  fontSize: "18px",
                  letterSpacing: "2px",
                }}
              >
                {captchaLoading ? "Loading..." : captchaQuestion}
              </div>

              <button
                type="button"
                onClick={loadCaptcha}
                disabled={captchaLoading}
                style={{
                  height: "48px",
                  width: "48px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.05)",
                  color: "inherit",
                  cursor: captchaLoading ? "not-allowed" : "pointer",
                  fontSize: "20px",
                }}
                title="Refresh CAPTCHA"
              >
                ↻
              </button>
            </div>

            <div
              className="auth-input-wrapper"
              style={{ marginTop: "10px" }}
            >
              <span className="auth-input-icon">#</span>
              <input
                type="text"
                placeholder="Enter CAPTCHA answer"
                value={captchaAnswer}
                onChange={(event) => setCaptchaAnswer(event.target.value)}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="auth-options">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span>Remember me</span>
            </label>

            <button
              type="button"
              className="forgot-password"
              onClick={openForgotPassword}
            >
              Forgot password?
            </button>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading || captchaLoading}
          >
            {loading ? (
              <>
                <span className="auth-spinner" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <span>→</span>
              </>
            )}
          </button>
        </form>

        <div className="auth-switch">
          <span>Don't have an account?</span>
          <button type="button" onClick={onShowSignup}>
            Create account
          </button>
        </div>

        <div className="auth-footer">
          <span>Powered by</span>
          <strong>LDRP RAG</strong>
        </div>
      </div>
    </div>
  );
}
