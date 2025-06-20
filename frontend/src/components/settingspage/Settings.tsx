import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import defaultAvatar from "../../assets/default-avatar.jpg";
import "../../styles/Settings.css";

interface UserProfile {
  username: string;
  profilePicture: string;
  message?: string;
}

const Settings: React.FC = () => {
  const stateUser = useSelector((state: RootState) => state.user);
  const username = stateUser.username || "";
  const currentEmail = stateUser.email || "";
  const verified = stateUser.verified || false;
  const [user, setUser] = useState<UserProfile | null>(null);
  const count = useRef(0);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/profile/${username}`,
          {
            credentials: "include",
          }
        );
        const data: UserProfile = await response.json();
        setUser(data);
      } catch (error) {
        console.error("Error fetching profile data", error);
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
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            username,
            profilePictureUrl: newProfilePictureUrl,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Error updating profile picture");
      }

      await response.json();
      alert("Profile picture updated!");
      window.location.reload();
    } catch (err) {
      alert(err.message || "Error updating profile picture");
    }
  };

  // Handle password reset request
  const handlePasswordResetRequest = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/settings/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ username }),
        }
      );

      if (!response.ok) {
        throw new Error("Error sending password reset request");
      }

      alert(
        "Password reset request sent! Please check your email for further instructions."
      );
    } catch (err) {
      alert(err.message || "Error sending password reset request");
    }
  };

  // Handle email change request
  const handleEmailChangeRequest = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/settings/change-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ username, newEmail }),
        }
      );

      if (!response.ok) {
        throw new Error("Error changing email");
      }

      alert(
        "Email change request sent! Please check your new email to verify the change."
      );
    } catch (err) {
      alert(err.message || "Error changing email");
    }
  };

  // Handle account deletion
  const handleAccountDeletion = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/settings/delete-account`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ username }),
        }
      );

      const data = await response.json();

      alert("Please check your email to confirm account deletion.");
    } catch (err) {
      alert(err.message || "Error deleting account");
    }
  };

  // Handle send verification email
  const handleVerificationEmail = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/send-verification-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ username }),
        }
      );

      if (!response.ok) {
        throw new Error("Error sending verification email");
      }

      alert(
        "Verification email sent! Please check your inbox to verify your account."
      );
    } catch (err) {
      alert(err.message || "Error sending verification email");
    }
  };

  useEffect(() => {
    if (stateUser.verified === false && count.current === 0) {
      count.current += 1;
      alert(
        "Your account is not verified. Please check your email to verify your account."
      );
    }
  }, [user, verified]);

  return (
    <div className="settings-container">
      <h1>Settings</h1>
      <div className="user-info">
        <img
          src={user?.profilePicture || defaultAvatar}
          alt={username}
          className="profile-picture"
        />
        <div>
          <p>
            <strong>Username:</strong> {username}
          </p>
          <p>
            <strong>Email:</strong> {currentEmail}
          </p>
          <p>
            <strong>Status: </strong>
            <span
              className={`verification-status ${
                verified ? "verified" : "not-verified"
              }`}
            >
              {verified ? "Verified" : "Not Verified"}
            </span>
          </p>
        </div>
        <div className="verification-email">
          {!verified && (
            <button onClick={handleVerificationEmail}>
              Send Verification Email
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
          <button onClick={handleEmailChangeRequest}>
            Request Email Change
          </button>
        </div>

        <div className="password-reset">
          <button onClick={handlePasswordResetRequest}>
            Request Password Reset
          </button>
        </div>

        <div className="delete-account">
          <button onClick={handleAccountDeletion}>Delete Account</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
