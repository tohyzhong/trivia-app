import React, { useState } from "react";
import "../../../styles/signuppage.css";
import ReturnButton from "./ReturnButton";

const SignupPage: React.FC = () => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [passwordConfirmation, setPasswordConfirmation] = useState<string>("");
  const [errors, setErrors] = useState<string[]>([]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== passwordConfirmation) {
      setErrors(["Passwords do not match"]);
      return;
    }

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/auth/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, username, password }),
      }
    );

    const data = await res.json();

    if (res.ok) {
      alert("Registered successfully. Redirecting...");
      window.location.href = "/auth/login";
    } else {
      if (data.errors) {
        const errorMessages = data.errors.map(
          (error: { msg: string }) => error.msg
        );
        setErrors(errorMessages);
      } else {
        alert(data.error || "Registration failed");
      }
    }
  };

  return (
    <div className="signup-form-container">
      <form onSubmit={handleRegister}>
        {errors.length > 0 && (
          <div className="error-message">
            {errors.map((error, index) => (
              <p key={index}>{error}</p>
            ))}
          </div>
        )}
        <div>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
        </div>
        <div>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
          />
        </div>
        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
        </div>
        <div>
          <input
            type="password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            placeholder="Confirm Password"
            required
          />
        </div>
        <p className="register-message">
          Have an account? <a href="/auth/login">Log in here!</a>
        </p>
        <div className="buttons-container">
          <ReturnButton />
          <button type="submit" className="register-button">
            Register
          </button>
        </div>
      </form>
    </div>
  );
};

export default SignupPage;
