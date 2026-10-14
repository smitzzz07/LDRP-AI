import React, { useCallback, useEffect, useRef, useState } from "react";
import "../Auth.css";

const AUTH_API = "http://127.0.0.1:8000/api/auth";
const REQUEST_TIMEOUT_MS = 10000;

async function fetchJsonWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    let data = {};
    try {
      data = await response.json();
    } catch {
      // Keep an empty object if the server returns an empty/non-JSON response.
    }

    if (!response.ok) {
      const detail =
        typeof data.detail === "string"
          ? data.detail
          : typeof data.message === "string"
            ? data.message
            : `Request failed (${response.status}).`;
      throw new Error(detail);
    }

    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("The server took too long to respond. Please try again.");
    }

    if (error instanceof TypeError) {
      throw new Error(
        "Cannot connect to the server. Make sure the LDRP backend is running."
      );
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export default function Login({ onLogin, onShowSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [captchaLoading, setCaptchaLoading] = useState(true);
  const [captchaError, setCaptchaError] = useState("");

  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const captchaRequestId = useRef(0);

  const loadCaptcha = useCallback(async () => {
    const requestId = ++captchaRequestId.current;

    setCaptchaLoading(true);
    setCaptchaError("");
    setCaptchaAnswer("");
    setCaptchaToken("");
    setCaptchaQuestion("");
    setError("");

    try {
      const data = await fetchJsonWithTimeout(`${AUTH_API}/captcha`);

      // Ignore an older request if the user refreshed the CAPTCHA again.
      if (requestId !== captchaRequestId.current) return;

      if (!data.question || !data.captcha_token) {
        throw new Error("The server returned an invalid CAPTCHA. Please refresh.");
      }

      setCaptchaQuestion(String(data.question));
      setCaptchaToken(String(data.captcha_token));
    } catch (err) {
      if (requestId !== captchaRequestId.current) return;
      setCaptchaError(err.message || "Unable to load CAPTCHA. Please refresh.");
    } finally {
      if (requestId === captchaRequestId.current) {
        setCaptchaLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadCaptcha();
    return () => {
      // Invalidate pending CAPTCHA responses when this screen unmounts.
      captchaRequestId.current += 1;
    };
  }, [loadCaptcha]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (!captchaToken || captchaLoading) {
      setError("CAPTCHA is not ready. Please refresh it and try again.");
      return;
    }

    if (!captchaAnswer.trim()) {
      setError("Please enter the CAPTCHA answer.");
      return;
    }

    setLoading(true);

    try {
      const data = await fetchJsonWithTimeout(`${AUTH_API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          captcha_token: captchaToken,
          captcha_answer: captchaAnswer.trim(),
          remember_me: rememberMe,
        }),
      });

      if (!data.access_token) {
        throw new Error("Login response did not include an access token.");
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
      setError(err.message || "Unable to sign in. Please try again.");
      // CAPTCHA challenges are commonly single-use, so load a fresh one.
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
      const data = await fetchJsonWithTimeout(`${AUTH_API}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });

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
            <p>Enter your registered email address to reset your password.</p>
          </div>

          <form onSubmit={handleForgotPassword} className="auth-form">
            <div className="form-group">
              <label htmlFor="forgot-email">Email Address</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon" aria-hidden="true">✉</span>
                <input
                  id="forgot-email"
                  type="email"
                  placeholder="you@example.com"
                  value={forgotEmail}
                  onChange={(event) => setForgotEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {forgotMessage && (
              <div className={forgotSuccess ? "auth-success" : "auth-error"} role="status">
                {forgotMessage}
              </div>
            )}

            <button type="submit" className="auth-submit" disabled={forgotLoading}>
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
            <label htmlFor="login-email">Email Address</label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon" aria-hidden="true">✉</span>
              <input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon" aria-hidden="true">⌑</span>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Security Verification</label>

            <div style={{ display: "flex", gap: "10px", alignItems: "stretch" }}>
              <div
                aria-live="polite"
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
                  padding: "10px",
                  textAlign: "center",
                }}
              >
                {captchaLoading
                  ? "Loading..."
                  : captchaError
                    ? "CAPTCHA unavailable"
                    : captchaQuestion || "Refresh CAPTCHA"}
              </div>

              <button
                type="button"
                onClick={loadCaptcha}
                disabled={captchaLoading}
                style={{
                  minHeight: "48px",
                  width: "60px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.05)",
                  color: "inherit",
                  cursor: captchaLoading ? "not-allowed" : "pointer",
                  fontSize: "20px",
                  opacity: captchaLoading ? 0.6 : 1,
                }}
                title="Refresh CAPTCHA"
                aria-label="Refresh CAPTCHA"
              >
                ↻
              </button>
            </div>

            {captchaError && (
              <div className="auth-error" role="alert" style={{ marginTop: "8px" }}>
                {captchaError}
              </div>
            )}

            <div className="auth-input-wrapper" style={{ marginTop: "10px" }}>
              <span className="auth-input-icon" aria-hidden="true">#</span>
              <input
                type="text"
                placeholder="Enter CAPTCHA answer"
                value={captchaAnswer}
                onChange={(event) => setCaptchaAnswer(event.target.value)}
                autoComplete="off"
                disabled={!captchaToken || captchaLoading}
                required
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

            <button type="button" className="forgot-password" onClick={openForgotPassword}>
              Forgot password?
            </button>
          </div>

          {error && <div className="auth-error" role="alert">{error}</div>}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading || captchaLoading || !captchaToken}
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
