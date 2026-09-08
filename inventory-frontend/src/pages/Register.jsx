import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../components/auth/AuthShell";
import { api } from "../api";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\d{10}$/;

function passwordError(password) {
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (!/[A-Za-z]/.test(password)) {
    return "Password must include at least one letter.";
  }
  if (!/\d/.test(password)) {
    return "Password must include at least one number.";
  }
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\/;']/.test(password)) {
    return "Password must include at least one special character.";
  }
  return null;
}

function generateOtp() {
  return String(
    Math.floor(
      1000 +
        Math.random() * 9000
    )
  );
}

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  function handleGenerateOtp() {
    setError("");
    setMessage("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password first.");
      return;
    }

    const newOtp = generateOtp();

    setGeneratedOtp(newOtp);
    setOtp("");
    setOtpVerified(false);

    window.alert(`Your OTP is: ${newOtp}`);
  }

  function handleVerifyOtp() {
    setError("");
    setMessage("");

    if (!generatedOtp) {
      setError("Please generate OTP first.");
      return;
    }

    if (!/^\d{4}$/.test(otp)) {
      setError("OTP must be exactly 4 digits.");
      return;
    }

    if (otp !== generatedOtp) {
      setOtpVerified(false);
      setError("Incorrect OTP.");
      return;
    }

    setOtpVerified(true);
    setMessage("OTP verified successfully.");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!phoneRegex.test(phone)) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }

    const pwError = passwordError(password);
    if (pwError) {
      setError(pwError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!otpVerified) {
      setError("Please generate and verify the OTP first.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await api.register(
        name.trim(),
        email.trim(),
        phone,
        password,
      );

      setMessage(response.message);

      window.setTimeout(() => {
        navigate("/login", {
          replace: true,
        });
      }, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create your account.");
    } finally {
      setIsSubmitting(false);
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
      mode="register"
      title="Create your account."
      subtitle="Register your account and wait for admin approval before signing in."
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="register-name">Full name</label>
          <input
            id="register-name"
            className="auth-input"
            type="text"
            name="name"
            placeholder="Your full name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="register-email">Email address</label>
          <input
            id="register-email"
            className="auth-input"
            type="email"
            name="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setOtpVerified(false);
            }}
            disabled={isSubmitting}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="register-phone">Phone number</label>
          <input
            id="register-phone"
            className="auth-input"
            type="tel"
            name="phone"
            inputMode="numeric"
            placeholder="10-digit phone number"
            autoComplete="tel"
            maxLength={10}
            value={phone}
            onChange={(event) => setPhone(event.target.value.replace(/\D/g, ""))}
            disabled={isSubmitting}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="register-password">Enter password</label>
          <div className="auth-input-wrap">
            <input
              id="register-password"
              className="auth-input"
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="8+ chars, letter, number, special character"
              autoComplete="new-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setOtpVerified(false);
              }}
              disabled={isSubmitting}
            />
            <button
              type="button"
              className="auth-password-toggle"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((visible) => !visible)}
              disabled={isSubmitting}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="register-confirm-password">Retype password</label>
          <div className="auth-input-wrap">
            <input
              id="register-confirm-password"
              className="auth-input"
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Retype your password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setOtpVerified(false);
              }}
              disabled={isSubmitting}
            />
            <button
              type="button"
              className="auth-password-toggle"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              onClick={() => setShowConfirmPassword((visible) => !visible)}
              disabled={isSubmitting}
            >
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="register-otp">OTP</label>
          <input
            id="register-otp"
            className="auth-input"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={4}
            placeholder="Enter 4-digit OTP"
            value={otp}
            onChange={(event) => {
              const value = event.target.value
                .replace(/\D/g, "")
                .slice(0, 4);

              setOtp(value);
              setOtpVerified(false);
              setError("");
            }}
            disabled={isSubmitting}
          />
        </div>

        <div className="d-flex gap-2 mb-3">
          <button
            type="button"
            className="btn btn-outline-primary flex-grow-1"
            onClick={handleGenerateOtp}
            disabled={isSubmitting}
          >
            Generate OTP
          </button>

          <button
            type="button"
            className="btn btn-outline-success flex-grow-1"
            onClick={handleVerifyOtp}
            disabled={isSubmitting}
          >
            Verify OTP
          </button>
        </div>

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        {message && (
          <div className="text-success small mb-3" role="alert">
            {message}
          </div>
        )}

        <button
          type="submit"
          className="auth-submit"
          disabled={isSubmitting || !otpVerified}
        >
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="auth-switch">
        Already registered? <Link to="/login">Sign in</Link>
      </p>

      {generatedOtp && (
        <button
          type="button"
          className="btn btn-link w-100"
          onClick={resetOtp}
          disabled={isSubmitting}
        >
          Generate new OTP
        </button>
      )}
    </AuthShell>
  );
}

export default Register;
