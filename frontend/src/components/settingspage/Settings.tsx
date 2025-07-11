import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import defaultAvatar from "../../assets/default-avatar.jpg";
import "../../styles/Settings.css";
import ErrorPopup from "../authentication/subcomponents/ErrorPopup";
import { useCooldown } from "../../hooks/useCooldown";
import { motion } from "motion/react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { setUser } from "../../redux/userSlice";

interface UserProfile {
  username: string;
  profilePicture: string;
  message?: string;
  email: string;
  verified: boolean;
}

const Settings: React.FC = () => {
  const dispatch = useDispatch();
  const stateUser = useSelector((state: RootState) => state.user);
  const username = stateUser.username || "";

  const [user, setUserLocal] = useState<UserProfile | null>(null);
  const count = useRef(0);
  const [errorPopupMessage, setErrorPopupMessage] = useState("");
  const [isResponseSuccess, setIsResponseSuccess] = useState(false);

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
        dispatch(
          setUser({
            username: data.username,
            email: data.email,
            verified: data.verified,
            role: stateUser.role
          })
        );
      } catch (error) {
        console.error("Error fetching profile data", error);
        setErrorPopupMessage("Error fetching profile data: " + String(error));
        setIsResponseSuccess(false);
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
      setErrorPopupMessage("Profile picture updated!");
      setIsResponseSuccess(true);

      window.location.reload();
    } catch (err) {
      setErrorPopupMessage(err.message || "Error updating profile picture");
      setIsResponseSuccess(false);
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
      setErrorPopupMessage(
        "Password reset request sent! Please check your email for further instructions."
      );
      setIsResponseSuccess(true);
    } catch (err) {
      setErrorPopupMessage(
        err.message || "Error sending password reset request"
      );
      setIsResponseSuccess(false);
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
      setErrorPopupMessage(
        "Email change request sent! Please check your new email to verify the change."
      );
      setIsResponseSuccess(true);
    } catch (err) {
      setErrorPopupMessage(err.message || "Error changing email");
      setIsResponseSuccess(false);
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

      triggerDeleteCooldown();
      setErrorPopupMessage(
        "Please check your email to confirm account deletion."
      );
      setIsResponseSuccess(true);
    } catch (err) {
      setErrorPopupMessage(err.message || "Error deleting account");
      setIsResponseSuccess(false);
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
      setErrorPopupMessage(
        "Verification email sent! Please check your inbox to verify your account."
      );
      setIsResponseSuccess(true);
    } catch (err) {
      setErrorPopupMessage(err.message || "Error sending verification email");
      setIsResponseSuccess(false);
    }

    setSendingVerification(false);
  };

  useEffect(() => {
    if (user?.verified === false && count.current === 0) {
      count.current += 1;
      setIsResponseSuccess(false);
      setErrorPopupMessage(
        "Your account is not verified. Please check your email to verify your account."
      );
    }
  }, [user]);

  return !user ? (
    <></>
  ) : (
    <div className="settings-container">
      <ErrorPopup
        message={errorPopupMessage}
        setMessage={setErrorPopupMessage}
        success={isResponseSuccess}
      />
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
                user.verified ? "verified" : "not-verified"
              }`}
            >
              {user.verified ? "Verified" : "Not Verified"}
            </span>
          </p>
        </div>
        <div className="verification-email">
          {!user.verified && (
            <button
              onClick={handleVerificationEmail}
              disabled={verificationCooldown > 0 || sendingVerification}
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
                      >
                        <AiOutlineLoading3Quarters className="loading-icon" />
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
                      <AiOutlineLoading3Quarters className="loading-icon" />
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
                      <AiOutlineLoading3Quarters className="loading-icon" />
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
                      <AiOutlineLoading3Quarters className="loading-icon" />
                    </motion.div>
                  </>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
