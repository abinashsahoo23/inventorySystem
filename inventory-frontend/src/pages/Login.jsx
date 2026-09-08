import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import AuthShell from "../components/auth/AuthShell";
import { api } from "../api";
import {
  setCurrentUser,
} from "../components/auth/session";

function generateOtp() {
  return String(
    Math.floor(
      1000 +
        Math.random() * 9000
    )
  );
}

export default function Login() {
  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [otp, setOtp] =
    useState("");

  const [generatedOtp, setGeneratedOtp] =
    useState("");

  const [otpVerified, setOtpVerified] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const navigate =
    useNavigate();

  function handleGenerateOtp() {
    setError("");
    setMessage("");

    if (
      !email.trim() ||
      !password
    ) {
      setError(
        "Please enter your email and password first."
      );
      return;
    }

    const newOtp =
      generateOtp();

    setGeneratedOtp(
      newOtp
    );

    setOtp("");

    setOtpVerified(false);

    window.alert(
      `Your OTP is: ${newOtp}`
    );
  }

  function handleVerifyOtp() {
    setError("");
    setMessage("");

    if (!generatedOtp) {
      setError(
        "Please generate OTP first."
      );
      return;
    }

    if (
      !/^\d{4}$/.test(
        otp
      )
    ) {
      setError(
        "OTP must be exactly 4 digits."
      );
      return;
    }

    if (
      otp !== generatedOtp
    ) {
      setOtpVerified(false);

      setError(
        "Incorrect OTP."
      );

      return;
    }

    setOtpVerified(
      true
    );

    setMessage(
      "OTP verified successfully."
    );
  }

  async function handleLogin(
    event
  ) {
    event.preventDefault();

    setError("");

    if (!otpVerified) {
      setError(
        "Please generate and verify the OTP first."
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const user =
        await api.login(
          email.trim(),
          password
        );

      setCurrentUser(
        user
      );

      navigate(
        user.role ===
          "SuperAdmin"
          ? "/admin"
          : "/dashboard",
        {
          replace: true,
        }
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in."
      );
    } finally {
      setIsSubmitting(
        false
      );
    }
  }

  function resetOtp() {
    setGeneratedOtp("");
    setOtp("");
    setOtpVerified(false);
    setMessage("");
    setError("");
  }

  return (
    <AuthShell
      mode="login"
      title="Welcome back."
      subtitle="Sign in to continue managing your inventory operation."
    >
      <form
        className="auth-form"
        onSubmit={
          handleLogin
        }
        noValidate
      >
        {/* =================================================
            EMAIL
        ================================================== */}

        <div className="auth-field">
          <label htmlFor="login-email">
            Email address
          </label>

          <input
            id="login-email"
            className="auth-input"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(
                event.target.value
              );

              setOtpVerified(
                false
              );
            }}
            disabled={
              isSubmitting
            }
          />
        </div>

        {/* =================================================
            PASSWORD
        ================================================== */}

        <div className="auth-field">
          <label htmlFor="login-password">
            Password
          </label>

          <div className="auth-input-wrap">
            <input
              id="login-password"
              className="auth-input"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(
                  event.target.value
                );

                setOtpVerified(
                  false
                );
              }}
              disabled={
                isSubmitting
              }
            />

            <button
              type="button"
              className="auth-password-toggle"
              onClick={() =>
                setShowPassword(
                  (value) =>
                    !value
                )
              }
              disabled={
                isSubmitting
              }
            >
              {showPassword
                ? "Hide"
                : "Show"}
            </button>
          </div>
        </div>

        {/* =================================================
            OTP
        ================================================== */}

        <div className="auth-field">
          <label htmlFor="login-otp">
            OTP
          </label>

          <input
            id="login-otp"
            className="auth-input"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={4}
            placeholder="Enter 4-digit OTP"
            value={otp}
            onChange={(event) => {
              const value =
                event.target.value
                  .replace(
                    /\D/g,
                    ""
                  )
                  .slice(
                    0,
                    4
                  );

              setOtp(value);
              setOtpVerified(
                false
              );
              setError("");
            }}
            disabled={
              isSubmitting
            }
          />
        </div>

        {/* =================================================
            OTP BUTTONS
        ================================================== */}

        <div className="d-flex gap-2 mb-3">
          <button
            type="button"
            className="btn btn-outline-primary flex-grow-1"
            onClick={
              handleGenerateOtp
            }
            disabled={
              isSubmitting
            }
          >
            Generate OTP
          </button>

          <button
            type="button"
            className="btn btn-outline-success flex-grow-1"
            onClick={
              handleVerifyOtp
            }
            disabled={
              isSubmitting
            }
          >
            Verify OTP
          </button>
        </div>

        {/* =================================================
            ERROR
        ================================================== */}

        {error && (
          <div
            className="auth-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* =================================================
            SUCCESS
        ================================================== */}

        {message && (
          <div
            className="text-success small mb-3"
            role="alert"
          >
            {message}
          </div>
        )}

        {/* =================================================
            LOGIN
        ================================================== */}

        <button
          type="submit"
          className="auth-submit"
          disabled={
            isSubmitting ||
            !otpVerified
          }
        >
          {isSubmitting
            ? "Signing in..."
            : "Sign in"}
        </button>

        <p className="auth-switch">
          Don&apos;t have an account?{" "}
          <Link to="/register">
            Create one
          </Link>
        </p>

        {generatedOtp && (
          <button
            type="button"
            className="btn btn-link w-100"
            onClick={
              resetOtp
            }
            disabled={
              isSubmitting
            }
          >
            Generate new OTP
          </button>
        )}
      </form>
    </AuthShell>
  );
}