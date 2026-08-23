import { useState } from "react";
import { Link } from "react-router-dom";
import { FaEnvelope, FaKey, FaLock } from "react-icons/fa";
import api from "../services/api";
import "../styles/login.css";

function ForgotPassword() {
  const [step, setStep] = useState("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const requestCode = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/forgot-password/request-code", { email });
      setMessage(response.data.message);
      setStep("reset");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to request a reset code.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/forgot-password/reset", {
        email,
        code,
        password,
        password_confirmation: passwordConfirmation,
      });
      setMessage(response.data.message);
      setStep("complete");
    } catch (requestError) {
      const validation = requestError.response?.data?.errors;
      setError(
        validation ? Object.values(validation).flat()[0] :
          requestError.response?.data?.message || "Unable to reset your password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-orb login-orb-one" />
      <div className="login-orb login-orb-two" />
      <main className="login-shell">
        <section className="login-intro">
          <div className="login-brand">
            <img className="login-brand-mark" src="/smartdesk-logo.svg" alt="SmartDesk" />
            <div><strong>SmartDesk</strong><small>IT service workspace</small></div>
          </div>
          <div className="login-intro-copy">
            <span className="login-eyebrow">Secure recovery</span>
            <h1>Regain access safely.</h1>
            <p>A short-lived verification code will be sent to your account email.</p>
          </div>
        </section>

        <section className="login-form-panel">
          <div className="login-form-heading">
            <span className="login-form-kicker">Password recovery</span>
            <h2>{step === "request" ? "Request a reset code" : step === "reset" ? "Create a new password" : "Password updated"}</h2>
            <p>{step === "request" ? "Enter the email linked to your SmartDesk account." : step === "reset" ? "The code expires in 10 minutes and can only be used once." : "You can now sign in with your new password."}</p>
          </div>

          {step === "request" && (
            <form className="login-form" onSubmit={requestCode}>
              <label>
                <span>Email address</span>
                <div className="login-input-wrap">
                  <FaEnvelope />
                  <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
                </div>
              </label>
              {error && <div className="login-error">{error}</div>}
              <button className="login-submit" type="submit" disabled={loading}>{loading ? "Sending..." : "Send secure code"}</button>
            </form>
          )}

          {step === "reset" && (
            <form className="login-form" onSubmit={resetPassword}>
              {message && <div className="login-notice">{message}</div>}
              <label>
                <span>6-digit code</span>
                <div className="login-input-wrap"><FaKey /><input className="reset-code-input" inputMode="numeric" pattern="[0-9]{6}" maxLength="6" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} autoComplete="one-time-code" required /></div>
              </label>
              <label>
                <span>New password</span>
                <div className="login-input-wrap"><FaLock /><input type="password" minLength="8" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required /></div>
              </label>
              <label>
                <span>Confirm new password</span>
                <div className="login-input-wrap"><FaLock /><input type="password" minLength="8" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} autoComplete="new-password" required /></div>
              </label>
              {error && <div className="login-error">{error}</div>}
              <button className="login-submit" type="submit" disabled={loading}>{loading ? "Updating..." : "Reset password"}</button>
            </form>
          )}

          {step === "complete" && <div className="login-notice" style={{ marginTop: 28 }}>{message}</div>}
          <Link className="login-back-link" to="/">Back to sign in</Link>
        </section>
      </main>
    </div>
  );
}

export default ForgotPassword;
