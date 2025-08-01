import React, { useEffect, useState } from "react";
import "../../../styles/signuppage.css";
import ReturnButton from "./ReturnButton";
import { RootState } from "../../../redux/store";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { setError } from "../../../redux/errorSlice";
import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers
} from "obscenity";
import { motion } from "framer-motion";

const SignupPage: React.FC = () => {
  const matcher = new RegExpMatcher({
    ...englishDataset.build(),
    ...englishRecommendedTransformers
  });
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [passwordConfirmation, setPasswordConfirmation] = useState<string>("");
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isLoggedIn = useSelector(
    (state: RootState) => state.user.isAuthenticated
  );

  useEffect(() => {
    if (isLoggedIn) {
      navigate("/");
    }
  }, [isLoggedIn, navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (matcher.hasMatch(username)) {
      setErrorMessages(["Username contains profanities."]);
      return;
    }

    if (password !== passwordConfirmation) {
      setErrorMessages(["Passwords do not match"]);
      return;
    }

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/auth/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, username, password })
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
        setErrorMessages(errorMessages);
      } else {
        dispatch(
          setError({
            errorMessage: data.error || "Registration failed",
            success: false
          })
        );
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="signup-form-container">
        <form onSubmit={handleRegister}>
          {errorMessages.length > 0 && (
            <div className="error-message">
              {errorMessages.map((error, index) => (
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
            Have an account? <Link to="/auth/login">Log in here!</Link>
          </p>
          <div className="buttons-container">
            <ReturnButton />
            <button type="submit" className="register-button">
              Register
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default SignupPage;
