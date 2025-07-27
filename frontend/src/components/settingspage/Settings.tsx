import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import defaultAvatar from "../../assets/default-avatar.jpg";
import "../../styles/Settings.css";
import { useCooldown } from "../../hooks/useCooldown";
import { motion } from "motion/react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { setError } from "../../redux/errorSlice";

interface UserProfile {
  username: string;
  profilePicture: string;
  message?: string;
  email: string;
  verified: boolean;
  chatBan: boolean;
  gameBan: boolean;
}

const isValidImageUrl = (url: string): boolean => {
  return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(url);
};

const Settings: React.FC = () => {
  const stateUser = useSelector((state: RootState) => state.user);
  const username = stateUser.username || "";
  const dispatch = useDispatch();

  const [user, setUserLocal] = useState<UserProfile | null>(null);
  const count = useRef(0);

  const [sendingVerification, setSendingVerification] =
    useState<boolean>(false);
  const [sendingPassword, setSendingPassword] = useState<boolean>(false);
  const [sendingEmail, setSendingEmail] = useState<boolean>(false);
  const [sendingDelete, setSendingDelete] = useState<boolean>(false);
  const {
    remaining: verificationCooldown,
    triggerCooldown: triggerVerificationCooldown
  } = useCooldown("lastVerificationEmail", 60000);
  const {
    remaining: passwordResetCooldown,
    triggerCooldown: triggerPasswordResetCooldown
  } = useCooldown("lastPasswordReset", 60000);
  const {
    remaining: emailChangeCooldown,
    triggerCooldown: triggerEmailChangeCooldown
  } = useCooldown("lastEmailChange", 60000);
  const { remaining: deleteCooldown, triggerCooldown: triggerDeleteCooldown } =
    useCooldown("lastAccountDeletion", 60000);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/profile/${username}`,
          {
            credentials: "include"
          }
        );
        const data: UserProfile = await response.json();
        setUserLocal(data);
      } catch (error) {
        console.error("Error fetching profile data", error);
        dispatch(
          setError({
            errorMessage: "Error fetching profile data" + String(error),
            success: false
          })
        );
      }
    };

    if (username) {
      fetchProfile();
    }
  }, [username]);

  const [newProfilePictureUrl, setNewProfilePictureUrl] = useState<string>("");
  const [newEmail, setNewEmail] = useState<string>("");

  // Handle profile picture change
  const handleProfilePictureChange = async () => {
    if (!isValidImageUrl(newProfilePictureUrl)) {
      dispatch(
        setError({
          errorMessage: "Please enter a valid image URL",
          success: false
        })
      );
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/settings/update-profile-picture`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({
            username,
            profilePictureUrl: newProfilePictureUrl
          })
        }
      );

      if (!response.ok) {
        throw new Error("Error updating profile picture");
      }

      await response.json();

      setUserLocal({ ...user, profilePicture: newProfilePictureUrl });
      dispatch(
        setError({
          errorMessage: "Profile picture updated successfully!",
          success: true
        })
      );
      setNewProfilePictureUrl("");
    } catch (err) {
      dispatch(
        setError({
          errorMessage: err.message || "Error updating profile picture",
          success: false
        })
      );
    }
  };

  // Handle password reset request
  const handlePasswordResetRequest = async () => {
    setSendingPassword(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/settings/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({ username })
        }
      );

      if (!response.ok) {
        throw new Error("Error sending password reset request");
      }

      triggerPasswordResetCooldown();
      dispatch(
        setError({
          errorMessage:
            "Password reset request sent! Please check your email for further instructions.",
          success: true
        })
      );
    } catch (err) {
      dispatch(
        setError({
          errorMessage: err.message || "Error sending password reset request",
          success: false
        })
      );
    }

    setSendingPassword(false);
  };

  // Handle email change request
  const handleEmailChangeRequest = async () => {
    try {
      setSendingEmail(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/settings/change-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({ username, newEmail })
        }
      );

      if (!response.ok) {
        throw new Error("Error changing email");
      }

      triggerEmailChangeCooldown();
      dispatch(
        setError({
          errorMessage:
            "Email change request sent! Please check your new email to verify the change.",
          success: true
        })
      );
    } catch (err) {
      dispatch(
        setError({
          errorMessage: err.message || "Error changing email",
          success: false
        })
      );
    }

    setSendingEmail(false);
  };

  // Handle account deletion
  const handleAccountDeletion = async () => {
    try {
      setSendingDelete(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/settings/delete-account`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({ username })
        }
      );

      await response.json();

      if (!response.ok) {
        throw new Error();
        return;
      }

      triggerDeleteCooldown();
      dispatch(
        setError({
          errorMessage: "Please check your email to confirm account deletion.",
          success: true
        })
      );
    } catch (err) {
      dispatch(
        setError({
          errorMessage: err.message || "Error deleting account",
          success: false
        })
      );
    }

    setSendingDelete(false);
  };

  // Handle send verification email
  const handleVerificationEmail = async () => {
    try {
      setSendingVerification(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/send-verification-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({ username })
        }
      );

      if (!response.ok) {
        throw new Error("Error sending verification email");
      }

      triggerVerificationCooldown();
      dispatch(
        setError({
          errorMessage:
            "Verification email sent! Please check your email to verify your account.",
          success: true
        })
      );
    } catch (err) {
      dispatch(
        setError({
          errorMessage: err.message || "Error sending verification email",
          success: false
        })
      );
    }

    setSendingVerification(false);
  };

  useEffect(() => {
    if (user?.verified === false && count.current === 0) {
      count.current += 1;
      dispatch(
        setError({
          errorMessage:
            "Your account is not verified. Please check your email to verify your account.",
          success: false
        })
      );
    }
  }, [user]);

  return !user ? (
    <></>
  ) : (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="settings-container">
        <h1>Profile Settings</h1>
        <div className="user-info">
          <img
            src={user?.profilePicture || defaultAvatar}
            alt={username}
            className="profile-picture"
          />
          <div className="user-info-details">
            <p>
              <strong>Username:</strong> {username}
            </p>
            <p>
              <strong>Email:</strong> {user.email ?? "Unknown"}
            </p>
            <p>
              <strong>Status: </strong>
              <span
                className={`verification-status ${
                  user.gameBan
                    ? "banned"
                    : user.verified
                      ? "verified"
                      : "not-verified"
                }`}
              >
                {user.gameBan
                  ? "Banned"
                  : user.verified
                    ? "Verified"
                    : "Not Verified"}
              </span>
            </p>
          </div>
          <div className="verification-email">
            {!user.verified && (
              <button
                onClick={handleVerificationEmail}
                disabled={verificationCooldown > 0 || sendingVerification}
                style={{ alignItems: "center", height: "auto" }}
              >
                {verificationCooldown > 0 ? (
                  `Wait ${Math.ceil(verificationCooldown / 1000)}s for Resend`
                ) : (
                  <>
                    Verify
                    {sendingVerification && (
                      <>
                        &nbsp;
                        <motion.div
                          className="loading-icon-container"
                          animate={{ rotate: 360 }}
                          transition={{
                            repeat: Infinity,
                            duration: 2,
                            ease: "linear"
                          }}
                          style={{
                            alignItems: "center",
                            display: "flex",
                            justifyContent: "center"
                          }}
                        >
                          <AiOutlineLoading3Quarters
                            className="loading-icon"
                            style={{
                              fontSize: "1.2rem",
                              marginLeft: "5px",
                              marginRight: "5px"
                            }}
                          />
                        </motion.div>
                      </>
                    )}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="settings-actions">
          <div className="profile-picture-change">
            <label>New Profile Picture URL:</label>
            <input
              type="text"
              value={newProfilePictureUrl}
              onChange={(e) => setNewProfilePictureUrl(e.target.value)}
              placeholder="Enter new profile picture URL"
            />
            <button onClick={handleProfilePictureChange}>
              Update Profile Picture
            </button>
            {newProfilePictureUrl && isValidImageUrl(newProfilePictureUrl) ? (
              <div className="image-preview">
                <img
                  src={newProfilePictureUrl}
                  alt="Preview"
                  style={{ maxWidth: "300px", marginTop: "10px" }}
                />
              </div>
            ) : newProfilePictureUrl ? (
              <p style={{ color: "red" }}>
                ⚠️ Must be a valid image URL ending in .jpg, .png, etc.
              </p>
            ) : null}
          </div>

          <div className="email-change">
            <label>New Email:</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter new email"
            />
            <button
              onClick={handleEmailChangeRequest}
              disabled={sendingEmail || emailChangeCooldown > 0}
            >
              {emailChangeCooldown > 0 ? (
                `Wait ${Math.ceil(emailChangeCooldown / 1000)}s to Change Email Again`
              ) : (
                <>
                  Request Email Change
                  {sendingEmail && (
                    <>
                      &nbsp;
                      <motion.div
                        className="loading-icon-container"
                        animate={{ rotate: 360 }}
                        transition={{
                          repeat: Infinity,
                          duration: 2,
                          ease: "linear"
                        }}
                      >
                        <AiOutlineLoading3Quarters
                          className="loading-icon"
                          style={{
                            fontSize: "1.2rem",
                            marginLeft: "5px",
                            marginRight: "5px"
                          }}
                        />
                      </motion.div>
                    </>
                  )}
                </>
              )}
            </button>
          </div>

          <div className="password-reset">
            <button
              onClick={handlePasswordResetRequest}
              disabled={sendingPassword || passwordResetCooldown > 0}
            >
              {passwordResetCooldown > 0 ? (
                `Wait ${Math.ceil(passwordResetCooldown / 1000)}s to Change Password Again`
              ) : (
                <>
                  Request Password Reset
                  {sendingPassword && (
                    <>
                      &nbsp;
                      <motion.div
                        className="loading-icon-container"
                        animate={{ rotate: 360 }}
                        transition={{
                          repeat: Infinity,
                          duration: 2,
                          ease: "linear"
                        }}
                      >
                        <AiOutlineLoading3Quarters
                          className="loading-icon"
                          style={{
                            fontSize: "1.2rem",
                            marginLeft: "5px",
                            marginRight: "5px"
                          }}
                        />
                      </motion.div>
                    </>
                  )}
                </>
              )}
            </button>
          </div>

          <div className="delete-account">
            <button
              onClick={handleAccountDeletion}
              disabled={sendingDelete || deleteCooldown > 0}
            >
              {deleteCooldown > 0 ? (
                `Wait ${Math.ceil(deleteCooldown / 1000)}s to Request Deletions Again`
              ) : (
                <>
                  Delete Account
                  {sendingDelete && (
                    <>
                      &nbsp;
                      <motion.div
                        className="loading-icon-container"
                        animate={{ rotate: 360 }}
                        transition={{
                          repeat: Infinity,
                          duration: 2,
                          ease: "linear"
                        }}
                      >
                        <AiOutlineLoading3Quarters
                          className="loading-icon"
                          style={{
                            fontSize: "1.2rem",
                            marginLeft: "5px",
                            marginRight: "5px"
                          }}
                        />
                      </motion.div>
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Settings;
