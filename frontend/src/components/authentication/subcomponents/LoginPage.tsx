import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "../../../redux/userSlice";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../../../styles/loginpage.css";
import ReturnButton from "./ReturnButton";
import ErrorPopup from "./ErrorPopup";
import { RootState } from "../../../redux/store";

const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const errorPopupParam = searchParams.get("error") || "";
  const ErrorPopupMessages = {
    login_required: "You must be logged in to view this page."
  };
  const [errorPopup, setErrorPopup] = useState<string>(
    ErrorPopupMessages[errorPopupParam] || ""
  );

  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

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
          role: data.role
        })
      );
      // navigate('/');
    } else {
      setError(data.error || "Login failed");
    }
  };

  return (
    <div className="login-page">
      {errorPopup && (
        <ErrorPopup message={errorPopup} setMessage={setErrorPopup} />
      )}
      <div className="form-container">
        <form onSubmit={handleLogin}>
          {error && <div className="error">{error}</div>}
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
          <a className="forgot-password" href="/auth/forgotpassword">
            Forgot Password?
          </a>
          <div className="buttons-container">
            <ReturnButton />
            <button type="submit" className="submit-button">
              Login
            </button>
          </div>
          <p className="register-message">
            Don't have an account? <a href="/auth/signup">Sign up here!</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
