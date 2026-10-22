import React, { useState } from "react";
import "../Auth.css";
import logoImg from "../assets/logo.webp";

const AUTH_API = "http://127.0.0.1:8000/api/auth";

export default function ResetPassword({
  resetToken,
  onBackToLogin,
}) {
  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  const handleResetPassword = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!resetToken) {
      setError(
        "Invalid password reset link."
      );
      return;
    }

    if (newPassword.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${AUTH_API}/reset-password`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            token: resetToken,
            new_password: newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to reset password."
        );
      }

      setSuccess(
        data.message ||
          "Password reset successfully."
      );

      setNewPassword("");
      setConfirmPassword("");

      // Remove token from browser URL
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );

    } catch (error) {
      setError(
        error.message ||
          "Unable to reset password."
      );
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="auth-page">

      <div className="auth-background">
        <div className="auth-glow auth-glow-one" />
        <div className="auth-glow auth-glow-two" />
      </div>

      <div className="auth-card">

        <div className="auth-logo">
          <img src={logoImg} alt="LDRP Logo" className="auth-logo-img" />

          <div>
            <h1>LDRP AI</h1>
            <span>Academic Assistant</span>
          </div>

        </div>


        <div className="auth-heading">

          <h2>
            Reset Password
          </h2>

          <p>
            Create a new password for your
            LDRP AI account.
          </p>

        </div>


        {!success ? (

          <form
            onSubmit={handleResetPassword}
            className="auth-form"
          >

            <div className="form-group">

              <label>
                New Password
              </label>

              <div className="auth-input-wrapper">

                <span className="auth-input-icon">
                  ⌑
                </span>

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(
                      e.target.value
                    )
                  }
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                >
                  {showPassword
                    ? "Hide"
                    : "Show"}
                </button>

              </div>

            </div>


            <div className="form-group">

              <label>
                Confirm Password
              </label>

              <div className="auth-input-wrapper">

                <span className="auth-input-icon">
                  ⌑
                </span>

                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                >
                  {showConfirmPassword
                    ? "Hide"
                    : "Show"}
                </button>

              </div>

            </div>


            <div
              style={{
                fontSize: "12px",
                opacity: 0.7,
              }}
            >
              Password must contain at least
              6 characters.
            </div>


            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}


            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading
                ? "Resetting Password..."
                : "Reset Password"}

              {!loading && (
                <span>→</span>
              )}
            </button>

          </form>

        ) : (

          <div>

            <div
              style={{
                padding: "16px",
                borderRadius: "12px",
                background:
                  "rgba(34,197,94,0.10)",
                border:
                  "1px solid rgba(34,197,94,0.30)",
                color: "#86efac",
                lineHeight: "1.5",
              }}
            >
              {success}
            </div>

          </div>

        )}


        {error && success && (
          <div className="auth-error">
            {error}
          </div>
        )}


        <div className="auth-switch">

          <button
            type="button"
            onClick={onBackToLogin}
          >
            ← Back to Login
          </button>

        </div>


        <div className="auth-footer">

          <span>
            Powered by
          </span>

          <strong>
            LDRP RAG
          </strong>

        </div>

      </div>

    </div>
  );
}