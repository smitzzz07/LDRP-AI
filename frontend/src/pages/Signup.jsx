import React, { useState } from "react";
import "../Auth.css";
import logoImg from "../assets/logo.webp";
import AuthVisualPanel from "../components/AuthVisualPanel";
import {
  User,
  EnvelopeSimple as Mail,
  LockSimple as Lock,
  Eye,
  EyeSlash as EyeOff,
  ArrowRight,
  ArrowLeft,
  Check,
} from "@phosphor-icons/react";

const AUTH_API = "http://127.0.0.1:8000/api/auth";

export default function Signup({ onSignup, onShowLogin, onNavigateLanding }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleBackToLanding = () => {
    if (onNavigateLanding) {
      onNavigateLanding();
    } else {
      window.location.href = "/";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!agreedToTerms) {
      setError("Please accept the terms and conditions to continue.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${AUTH_API}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to create account.");
      }

      // Save JWT token
      localStorage.setItem("access_token", data.access_token);

      // Save user information
      const user = {
        id: data.user_id,
        name: data.name,
        email: data.email,
      };
      localStorage.setItem("user", JSON.stringify(user));

      onSignup?.(user);
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-split-wrapper">
        {/* Left Panel: Signup Form */}
        <div className="auth-form-column">
          <div className="auth-form-content">
            {/* Back to Home Navigation */}
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

            {/* Header Logo */}
            <div className="auth-header-bar">
              <img src={logoImg} alt="LDRP Logo" className="auth-logo-img" />
              <div className="auth-brand-text">
                <h1>LDRP AI</h1>
                <span>Academic Assistant</span>
              </div>
            </div>

            {/* Intro Heading */}
            <div className="auth-intro">
              <h2>Create an account</h2>
              <p>Brainstorm in chat, learn and build with AI assistance.</p>
            </div>

            {/* Signup Form */}
            <form onSubmit={handleSubmit} className="auth-form">
              {/* Full Name */}
              <div className="auth-field-box">
                <input
                  type="text"
                  placeholder="e.g. Harshit Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  className="auth-input-native"
                  required
                />
                <span className="auth-field-tag">
                  <User size={16} />
                  Full Name
                </span>
              </div>

              {/* Email */}
              <div className="auth-field-box">
                <input
                  type="email"
                  placeholder="name@ldrp.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="auth-input-native"
                  required
                />
                <span className="auth-field-tag">
                  <Mail size={16} />
                  Email
                </span>
              </div>

              {/* Password & Confirm Password in 2-column or stacked */}
              <div className="auth-field-box">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password (min 6 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="auth-input-native"
                  required
                />
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    type="button"
                    className="auth-password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
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

              <div className="auth-field-box">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className="auth-input-native"
                  required
                />
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    type="button"
                    className="auth-password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <span className="auth-field-tag">
                    <Lock size={15} />
                  </span>
                </div>
              </div>

              {/* Terms and conditions line */}
              <div className="auth-options-row" style={{ marginTop: "4px" }}>
                <label className="auth-checkbox-label">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                  />
                  <span className="auth-checkbox-box">
                    {agreedToTerms && <Check size={13} color="#ffffff" strokeWidth={3} />}
                  </span>
                  <span style={{ fontSize: "12.5px" }}>
                    I agree to the LDRP AI Academic Terms and Privacy Policy
                  </span>
                </label>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="auth-alert-box auth-alert-error" role="alert">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="auth-primary-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="auth-loading-spinner" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            {/* Switch to Login */}
            <div className="auth-switch-section">
              <span>Already have an account?</span>
              <button
                type="button"
                className="auth-switch-highlight-btn"
                onClick={onShowLogin}
              >
                Sign in
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Visual Dark Blue Grain Shader Showcase */}
        <AuthVisualPanel
          titleTop="Build fast,"
          titleBottom="Learn faster"
        />
      </div>
    </div>
  );
}