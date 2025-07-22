import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "../../../redux/userSlice";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "../../../styles/loginpage.css";
import ReturnButton from "./ReturnButton";
import { RootState } from "../../../redux/store";
import { setError } from "../../../redux/errorSlice";
import { motion } from "framer-motion";

const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const errorPopupParam = searchParams.get("error") || "";
  const ErrorPopupMessages = {
    login_required: "You must be logged in to view this page."
  };

  useEffect(() => {
    dispatch(
      setError({
        errorMessage: ErrorPopupMessages[errorPopupParam],
        success: false
      })
    );
  }, [errorPopupParam]);

  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isLoggedIn = useSelector(
    (state: RootState) => state.user.isAuthenticated
  );

  useEffect(() => {
    if (isLoggedIn) {
      window.location.href = "/";
    }
  }, [isLoggedIn, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (res.ok) {
      // window.location.reload();
      dispatch(
        setUser({
          username: username,
          email: data.email,
          verified: data.verified,
          chatBan: data.chatBan,
          gameBan: data.gameBan,
          role: data.role
        })
      );
      // navigate('/');
    } else {
      setLoginError(data.error || "Login failed");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="login-page">
        <div className="form-container">
          <form onSubmit={handleLogin}>
            {loginError && <div className="error">{loginError}</div>}
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
            <Link className="forgot-password" to="/auth/forgotpassword">
              Forgot Password?
            </Link>
            <div className="buttons-container">
              <ReturnButton />
              <button type="submit" className="submit-button">
                Login
              </button>
            </div>
            <p className="register-message">
              Don&apos;t have an account?{" "}
              <Link to="/auth/signup">Sign up here!</Link>
            </p>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginPage;
