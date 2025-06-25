import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import "../../styles/SettingsActions.css";
import { logout } from "../../redux/userSlice";
import { useDispatch } from "react-redux";

const SettingsActions: React.FC = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const [message, setMessage] = useState<string | string[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [action, setAction] = useState<string>("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const apiCalled = useRef(false);
  const error = useRef(false);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get("token");
    const action = queryParams.get("action") || "";
    setAction(action);
    setToken(token);

    if (
      token &&
      !apiCalled.current &&
      action !== "change-password" &&
      action !== "verify"
    ) {
      apiCalled.current = true;
      const verifyAction = async () => {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/api/settings/verify-action`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              credentials: "include",
              body: JSON.stringify({ token })
            }
          );

          const result = await response.json();
          setMessage(
            result.message ||
              result.error ||
              result.errors.map((error) => error.msg).join("\n")
          );
          if (result.error || result.errors) {
            error.current = true;
          }

          if (action === "delete-account") {
            try {
              const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/auth/logout`,
                {
                  method: "POST",
                  credentials: "include"
                }
              );

              if (res.ok) {
                dispatch(logout());
                window.location.href = "/";
              } else {
                const data = await res.json();
                console.error(
                  "Logout failed:",
                  data.message || "An error occurred"
                );
              }
            } catch (err) {
              console.error("Error logging out:", err);
            }
          }
        } catch (err) {
          setMessage(err.message || "Error verifying action");
          error.current = true;
        }
      };

      verifyAction();
    }
  }, [location.search]);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match");
      error.current = true;
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/settings/verify-action`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({ token, newPassword })
        }
      );

      const data = await response.json();
      if (response.ok) {
        alert("Password changed successfully. Redirecting to login page...");
        setMessage("Password changed successfully");
        error.current = false;
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/api/auth/logout`,
            {
              method: "POST",
              credentials: "include"
            }
          );

          if (res.ok) {
            dispatch(logout());
            window.location.href = "/auth/login";
          } else {
            const data = await res.json();
            console.error(
              "Logout failed:",
              data.message || "An error occurred"
            );
          }
        } catch (err) {
          console.error("Error logging out:", err);
        }
      } else {
        if (data.errors) {
          const errorMessages = data.errors.map(
            (error: { msg: string }) => error.msg
          );
          setMessage(errorMessages);
          error.current = true;
        } else {
          setMessage(data.error || "Password change failed");
          error.current = true;
        }
      }
    } catch (err) {
      setMessage(err.message || "Error changing password");
      error.current = true;
    }
  };

  useEffect(() => {
    if (action === "verify" && token && !apiCalled.current) {
      apiCalled.current = true;

      const verifyAction = async () => {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/api/auth/verify?token=${token}`,
            {
              credentials: "include"
            }
          );

          const result = await response.json();
          setMessage(result.message || result.error);
          if (!response.ok) {
            error.current = true;
          }
        } catch (err) {
          setMessage(err.message || "Error verifying action");
          error.current = true;
        }
      };

      verifyAction();
    }
  }, [action, token]);

  return (
    <div className="settings-actions-container">
      <h1>Action Verification</h1>
      <p className={error.current ? "error" : "success"}>
        {Array.isArray(message)
          ? message.map((msg, index) => (
              <p className={error.current ? "error" : "success"} key={index}>
                {msg}
              </p>
            ))
          : message}
      </p>

      {action === "change-password" && (
        <div className="password-change-form">
          <h3>Change Your Password</h3>
          <label>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
          />
          <label>Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
          />
          <button onClick={handleChangePassword}>Submit New Password</button>
        </div>
      )}
    </div>
  );
};

export default SettingsActions;
