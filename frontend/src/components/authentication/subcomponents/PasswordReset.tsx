import React, { FormEvent, useEffect } from "react";
import "../../../styles/forgotpassword.css";
import ReturnButton from "./ReturnButton";
import { useNavigate, useSearchParams } from "react-router-dom";
import ErrorPopup from "./ErrorPopup";

const PasswordReset: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [messageEmail, setMessageEmail] = React.useState("");

  // Check if password request email has been sent
  const [emailSent, setEmailSent] = React.useState(false);
  const [countdown, setCountdown] = React.useState(30);

  // Post-verification
  const [errorPopupMessage, setErrorPopupMessage] = React.useState("");
  const [errorMessages, setErrorMessages] = React.useState<string[]>([]);
  const [verified, setVerified] = React.useState(false);
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  // Verification of unique token
  const verifyToken = async (token) => {
    if (token) {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/verifyreset`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ token }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        setVerified(true);
        setEmail(data.email);
      } else {
        setErrorPopupMessage(data.error || "Invalid or expired token");
      }
    }
  };

  useEffect(() => {
    verifyToken(token);
  }, [token]);

  // Email sending handler
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/auth/forgotpassword`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: messageEmail }),
      }
    );

    const data = await res.json();

    if (res.ok) {
      setEmailSent(true);
      setCountdown(60);
    } else {
      alert(data.error || "Failed to send OTP");
    }
  };

  // Handle countdown for resending email
  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  // Disable button if countdown is active
  useEffect(() => {
    if (emailSent) {
      const button = document.querySelector(".send-email-button");
      button.textContent = "Resend Email";
      if (countdown <= 0) {
        button.classList.remove("disabled-button");
      } else {
        button.classList.add("disabled-button");
        button.textContent = `Resend Email (${countdown})`;
      }
    }
  }, [countdown, emailSent]);

  // Password reset handler
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const newPassword = (form.elements[0] as HTMLInputElement).value;
    const confirmPassword = (form.elements[1] as HTMLInputElement).value;

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/auth/resetpassword`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, password: newPassword }),
      }
    );

    const data = await res.json();

    if (res.ok) {
      alert("Password reset successfully. Redirecting to Login Page...");
      navigate("/auth/login");
    } else {
      alert(data.error || "Failed to reset password");
      const errorMessages = data.errors.map(
        (error: { msg: string }) => error.msg
      );
      setErrorMessages(errorMessages);
    }
  };

  return verified ? (
    <div className="password-reset-page">
      <div className="form-container">
        <form onSubmit={handlePasswordReset}>
          <h3>Password Reset ({email})</h3>
          <p>Request verified successfully!</p>
          <input type="password" placeholder="New Password" required />
          <input type="password" placeholder="Confirm New Password" required />
          {errorMessages.length > 0 && (
            <div className="error-message">
              {errorMessages.map((error, index) => (
                <p key={index}>{error}</p>
              ))}
            </div>
          )}
          <div className="buttons-container">
            <ReturnButton />
            <button type="submit" className="submit-button">
              Reset Password
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : (
    <>
      {errorPopupMessage !== "" && (
        <ErrorPopup
          message={errorPopupMessage}
          setMessage={setErrorPopupMessage}
        />
      )}
      <div className="password-reset-page">
        <div className="form-container">
          <form onSubmit={handleSendEmail}>
            <input
              type="text"
              value={messageEmail}
              onChange={(e) => setMessageEmail(e.target.value)}
              placeholder="Email"
              required
            />
            {emailSent && (
              <div className="email-sent-container">
                <p className="email-sent-message">
                  An email containing the password reset request has been sent
                  to {messageEmail}
                </p>
                {countdown > 0 && (
                  <p className="email-resend-message">
                    Didn't receive it?{" "}
                    <a className="email-resend-button">Send again </a>in{" "}
                    {countdown} seconds
                  </p>
                )}
              </div>
            )}
            <div className="buttons-container">
              <ReturnButton />
              <button type="submit" className="submit-button send-email-button">
                Send Email
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default PasswordReset;
