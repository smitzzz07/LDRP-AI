import React, { useCallback, useEffect, useRef, useState } from "react";
import "../Auth.css";
import logoImg from "../assets/logo.webp";
import AuthVisualPanel from "../components/AuthVisualPanel";
import {
  EnvelopeSimple as Mail,
  LockSimple as Lock,
  ArrowClockwise as RefreshCw,
  Eye,
  EyeSlash as EyeOff,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Check,
} from "@phosphor-icons/react";

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

export default function Login({ onLogin, onShowSignup, onNavigateLanding }) {
  // Read saved user name and email from previous login/session
  const [savedUserName] = useState(() => {
    try {
      const saved = localStorage.getItem("user") || sessionStorage.getItem("user");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.name && typeof parsed.name === "string" && parsed.name.trim()) {
          return parsed.name.trim();
        }
      }
    } catch {
      // ignore
    }
    return "";
  });

  const [email, setEmail] = useState(() => {
    try {
      const saved = localStorage.getItem("user") || sessionStorage.getItem("user");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.email && typeof parsed.email === "string") {
          return parsed.email.trim();
        }
      }
    } catch {
      // ignore
    }
    return "";
  });

  const [password, setPassword] = useState("");

  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [captchaLoading, setCaptchaLoading] = useState(true);
  const [captchaError, setCaptchaError] = useState("");

  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const captchaRequestId = useRef(0);

  const handleBackToLanding = () => {
    if (onNavigateLanding) {
      onNavigateLanding();
    } else {
      window.location.href = "/";
    }
  };

  // loadCaptcha accepting clearLoginError flag so a failed login attempt doesn't wipe the error
  const loadCaptcha = useCallback(async (clearLoginError = true) => {
    const requestId = ++captchaRequestId.current;

    setCaptchaLoading(true);
    setCaptchaError("");
    setCaptchaAnswer("");
    setCaptchaToken("");
    setCaptchaQuestion("");
    if (clearLoginError) {
      setError("");
    }

    try {
      const data = await fetchJsonWithTimeout(`${AUTH_API}/captcha`);

      // Ignore older request if user clicked refresh repeatedly
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
    loadCaptcha(false);
    return () => {
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
      setError(err.message || "Invalid email or password. Please try again.");
      // Pass false so loadCaptcha preserves the error message
      loadCaptcha(false);
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

  // -------------------------------------------------------------
  // Render Forgot Password View (Split Screen with Dark Blue Shader)
  // -------------------------------------------------------------
  if (showForgotPassword) {
    return (
      <div className="auth-page">
        <div className="auth-split-wrapper">
          {/* Left Panel: Form */}
          <div className="auth-form-column">
            <div className="auth-form-content">
              {/* Back to Home / Navigation */}
              <div className="auth-top-nav-bar">
                <button
                  type="button"
                  onClick={handleBackToLanding}
                  className="auth-back-nav-btn"
                  title="Back to Landing Page"
                  aria-label="Back to Landing Page"
                >
                  <ArrowLeft size={16} />
                  <span>Back to Home</span>
                </button>
              </div>

              {/* Header Logo & Wordmark (No Wrapper Box) */}
              <div className="auth-header-bar">
                <img src={logoImg} alt="LDRP Logo" className="auth-logo-img" />
                <div className="auth-brand-text">
                  <h1>LDRP AI</h1>
                  <span>AI Academic Assistant</span>
                </div>
              </div>

              {/* Heading */}
              <div className="auth-intro">
                <h2>Forgot Password</h2>
                <p>Enter your registered email address to receive password reset instructions.</p>
              </div>

              {/* Form */}
              <form onSubmit={handleForgotPassword} className="auth-form">
                <div className="auth-field-box">
                  <input
                    id="forgot-email"
                    type="email"
                    placeholder="Enter your registered email"
                    value={forgotEmail}
                    onChange={(event) => setForgotEmail(event.target.value)}
                    autoComplete="email"
                    className="auth-input-native"
                    required
                  />
                  <span className="auth-field-tag">
                    <Mail size={16} />
                    Email
                  </span>
                </div>

                {forgotMessage && (
                  <div
                    className={`auth-alert-box ${forgotSuccess ? "auth-alert-success" : "auth-alert-error"}`}
                    role="status"
                  >
                    {forgotMessage}
                  </div>
                )}

                <button
                  type="submit"
                  className="auth-primary-submit-btn"
                  disabled={forgotLoading}
                >
                  {forgotLoading ? (
                    <>
                      <span className="auth-loading-spinner" />
                      Sending Request...
                    </>
                  ) : (
                    <>
                      Send Reset Instructions
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </form>

              {/* Back to Login Action */}
              <div className="auth-switch-section">
                <button
                  type="button"
                  onClick={backToLogin}
                  className="auth-switch-highlight-btn"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <ArrowLeft size={15} />
                  Back to Sign In
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel: Dark Blue Shader Visual */}
          <AuthVisualPanel
            titleTop="Secure,"
            titleBottom="Seamless access"
          />
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Render Sign In View (Split Screen with Dark Blue Shader)
  // -------------------------------------------------------------
  return (
    <div className="auth-page">
      <div className="auth-split-wrapper">
        {/* Left Panel: Form */}
        <div className="auth-form-column">
          <div className="auth-form-content">
            {/* Back to Home / Navigation */}
            <div className="auth-top-nav-bar">
              <button
                type="button"
                onClick={handleBackToLanding}
                className="auth-back-nav-btn"
                title="Back to Landing Page"
                aria-label="Back to Landing Page"
              >
                <ArrowLeft size={16} />
                <span>Back to Home</span>
              </button>
            </div>

            {/* Header Logo & Wordmark (No Wrapper Box) */}
            <div className="auth-header-bar">
              <img src={logoImg} alt="LDRP Logo" className="auth-logo-img" />
              <div className="auth-brand-text">
                <h1>LDRP AI</h1>
                <span>Academic Assistant</span>
              </div>
            </div>

            {/* Intro Heading with profile name if saved */}
            <div className="auth-intro">
              <h2>
                Welcome back{savedUserName ? `, ${savedUserName}` : ""}
              </h2>
              <p>Sign in to continue to your LDRP AI academic workspace.</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="auth-form">
              {/* Email Field Box */}
              <div className="auth-field-box">
                <input
                  id="login-email"
                  type="email"
                  placeholder="name@ldrp.ac.in"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  className="auth-input-native"
                  required
                />
                <span className="auth-field-tag">
                  <Mail size={16} />
                  Email
                </span>
              </div>

              {/* Password Field Box */}
              <div className="auth-field-box">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  className="auth-input-native"
                  required
                />
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    type="button"
                    className="auth-password-toggle-btn"
                    onClick={() => setShowPassword((prev) => !prev)}
                    title={showPassword ? "Hide password" : "Show password"}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <span className="auth-field-tag">
                    <Lock size={15} />
                  </span>
                </div>
              </div>

              {/* Security Verification / CAPTCHA */}
              <div className="auth-captcha-wrapper">
                <div className="auth-captcha-header">
                  <span className="auth-captcha-label">
                    <ShieldCheck size={14} />
                    Verify You're Human
                  </span>
                </div>

                <div className="auth-captcha-display-row">
                  <div className="auth-captcha-badge" aria-live="polite">
                    {captchaLoading
                      ? "Loading..."
                      : captchaError
                        ? "CAPTCHA unavailable"
                        : captchaQuestion || "Click Refresh"}
                  </div>

                  <button
                    type="button"
                    onClick={() => loadCaptcha(true)}
                    disabled={captchaLoading}
                    className="auth-captcha-refresh-btn"
                    title="Refresh CAPTCHA challenge"
                    aria-label="Refresh CAPTCHA challenge"
                  >
                    <RefreshCw size={17} className={captchaLoading ? "auth-loading-spinner" : ""} />
                  </button>
                </div>

                {captchaError && (
                  <div className="auth-alert-box auth-alert-error" role="alert">
                    {captchaError}
                  </div>
                )}

                <div className="auth-field-box" style={{ height: "50px" }}>
                  <input
                    type="text"
                    placeholder="Enter CAPTCHA answer"
                    value={captchaAnswer}
                    onChange={(event) => setCaptchaAnswer(event.target.value)}
                    autoComplete="off"
                    disabled={!captchaToken || captchaLoading}
                    className="auth-input-native"
                    required
                  />
                  <span className="auth-field-tag">Answer</span>
                </div>
              </div>

              {/* Error Message Box - placed right below CAPTCHA as requested */}
              {error && (
                <div className="auth-alert-box auth-alert-error" role="alert">
                          <span>{error}</span>
                </div>
              )}

              {/* Remember Me & Forgot Password Options */}
              <div className="auth-options-row">
                <label className="auth-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                  />
                  <span className="auth-checkbox-box">
                    {rememberMe && <Check size={13} color="#ffffff" strokeWidth={3} />}
                  </span>
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  className="auth-link-btn"
                  onClick={openForgotPassword}
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="auth-primary-submit-btn"
                disabled={loading || captchaLoading || !captchaToken}
              >
                {loading ? (
                  <>
                    <span className="auth-loading-spinner" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            {/* Switch to Signup */}
            <div className="auth-switch-section">
              <span>Don't have an account?</span>
              <button
                type="button"
                className="auth-switch-highlight-btn"
                onClick={onShowSignup}
              >
                Create account
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Visual Dark Blue Grain Shader Showcase */}
        <AuthVisualPanel
          titleTop="Think fast,"
          titleBottom="Learn faster"
        />
      </div>
    </div>
  );
}
