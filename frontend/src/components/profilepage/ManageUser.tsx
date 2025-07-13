import React, { useEffect, useState } from "react";
import "../../styles/manageuser.css";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { setError } from "../../redux/errorSlice";
import defaultAvatar from "../../assets/default-avatar.jpg";
import { motion } from "framer-motion";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

interface ManageUserProfile {
  username: string;
  role: string;
  profilePicture: string;
  verified: boolean;
  chatBan: boolean;
  gameBan: boolean;
}

const ManageUser: React.FC = () => {
  // User to manage
  const { username: paramUsername } = useParams<{ username: string }>();
  const [user, setUser] = useState<ManageUserProfile>(null);

  // Expected admin user
  const userFromRedux = useSelector((state: RootState) => state.user);
  const usernameFromRedux = userFromRedux.username;
  const currUserRole = userFromRedux.role;

  const dispatch = useDispatch();
  const navigate = useNavigate();
  if (currUserRole === "user") {
    dispatch(
      setError({ errorMessage: "Unauthorised attempt.", success: false })
    );
    navigate(`/profile/${paramUsername}`);
  } else if (usernameFromRedux === paramUsername) {
    dispatch(
      setError({
        errorMessage: "You cannot manage your own account's status",
        success: false
      })
    );
    navigate(`/profile/${paramUsername}`);
  }

  // Fetch user info
  const fetchUser = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/profile/manage/${paramUsername}`,
        {
          credentials: "include"
        }
      );
      const data = await response.json();
      if (response.ok) {
        setUser(data);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error(error);
      dispatch(
        setError({
          errorMessage: `Error fetching user data: ${error.message}`,
          success: false
        })
      );
      navigate("/profile");
    }
  };

  useEffect(() => {
    if (paramUsername) {
      fetchUser();
    }
  }, [paramUsername]);

  // Admin actions
  const [chatBanReason, setChatBanReason] = useState<string>("");
  const [gameBanReason, setGameBanReason] = useState<string>("");

  const [chatBanSending, setChatBanSending] = useState<boolean>(false);
  const [gameBanSending, setGameBanSending] = useState<boolean>(false);

  const handleChatBan = async () => {
    try {
      setChatBanSending(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/profile/chatban`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            bannedUser: user.username,
            reason: chatBanReason,
            unban: user.chatBan
          })
        }
      );
      const data = await response.json();
      if (response.ok) {
        setChatBanReason("");
        dispatch(
          setError({
            errorMessage: `User successfully ${user.chatBan ? "un" : ""}banned`,
            success: true
          })
        );
        fetchUser();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error("Error chat banning user:", err);
      dispatch(
        setError({
          errorMessage: "Error chat banning user:" + String(err),
          success: false
        })
      );
    }

    setChatBanSending(false);
  };

  const handleGameBan = async () => {
    try {
      setGameBanSending(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/profile/ban`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            bannedUser: user.username,
            reason: gameBanReason,
            unban: user.gameBan
          })
        }
      );
      const data = await response.json();
      if (response.ok) {
        setGameBanReason("");
        dispatch(
          setError({
            errorMessage: `User successfully ${user.gameBan ? "un" : ""}banned`,
            success: true
          })
        );
        fetchUser();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error("Error banning user:", err);
      dispatch(
        setError({
          errorMessage: "Error banning user:" + String(err),
          success: false
        })
      );
    }

    setGameBanSending(false);
  };

  // Loading state
  useEffect(() => {
    if (user) setLoading(false);
  }, [user]);

  const [loading, setLoading] = useState<boolean>(true);

  return loading ? (
    <></>
  ) : (
    <div className="manage-container">
      <div className="profile-header">
        <button
          className="back-button"
          onClick={() => navigate(`/profile/${paramUsername}`)}
        >
          ← Back
        </button>
        <h1 className="profile-name">Manage {user.username}&apos;s Profile</h1>
      </div>
      <div className="user-info-container">
        <div className="user-info">
          <img
            src={user?.profilePicture || defaultAvatar}
            alt={user.username}
            className="profile-picture"
          />
          <div className="user-info-details">
            <p>
              <strong>Username:</strong> {user.username}
            </p>
            <p>
              <strong>Role:</strong>{" "}
              <span className="profile-role">
                {user.role === "superadmin"
                  ? "👑 Superadmin"
                  : user.role === "admin"
                    ? "🛡️ Admin"
                    : "👤 User"}
              </span>
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
        </div>
        <div className="role-update-actions">
          {(() => {
            const roleActions: {
              label: string;
              newRole: string;
              type: "promote" | "demote";
            }[] = [];

            if (currUserRole === "superadmin") {
              if (user.role === "superadmin") {
                roleActions.push({
                  label: "Demote to Admin",
                  newRole: "admin",
                  type: "demote"
                });
              } else if (user.role === "admin") {
                roleActions.push(
                  {
                    label: "Demote to User",
                    newRole: "user",
                    type: "demote"
                  },
                  {
                    label: "Promote to Superadmin",
                    newRole: "superadmin",
                    type: "promote"
                  }
                );
              } else if (user.role === "user") {
                roleActions.push({
                  label: "Promote to Admin",
                  newRole: "admin",
                  type: "promote"
                });
              }
            } else if (currUserRole === "admin") {
              if (user.role === "user") {
                roleActions.push({
                  label: "Promote to Admin",
                  newRole: "admin",
                  type: "promote"
                });
              }
            }

            return roleActions.map(({ label, newRole, type }) => (
              <button
                key={label}
                className={
                  type === "promote"
                    ? "add-friend-button"
                    : "remove-friend-button"
                }
                onClick={async () => {
                  try {
                    const response = await fetch(
                      `${import.meta.env.VITE_API_URL}/api/profile/updaterole/${user.username}`,
                      {
                        method: "PUT",
                        headers: {
                          "Content-Type": "application/json"
                        },
                        credentials: "include",
                        body: JSON.stringify({ role: newRole })
                      }
                    );

                    const data = await response.json();

                    if (response.ok) {
                      dispatch(
                        setError({
                          errorMessage:
                            data.message || `User role updated to ${newRole}`,
                          success: true
                        })
                      );
                      fetchUser();
                    } else {
                      dispatch(
                        setError({
                          errorMessage:
                            data.message || "Failed to update role.",
                          success: false
                        })
                      );
                    }
                  } catch (err) {
                    console.error("Error updating user role:", err);
                    dispatch(
                      setError({
                        errorMessage: "Server error while updating role.",
                        success: false
                      })
                    );
                  }
                }}
              >
                {label}
              </button>
            ));
          })()}
        </div>
      </div>

      <div className="admin-actions">
        <h2>Manage User Status</h2>
        <div className="ban-info-details">
          <p>
            <strong>Chat Access Status:</strong>{" "}
            <span className={user.chatBan ? "banned" : "not-banned"}>
              {user.chatBan ? "Banned" : "Allowed"}
            </span>
          </p>
          <p>
            <strong>Game Access Status: </strong>{" "}
            <span className={user.gameBan ? "banned" : "not-banned"}>
              {user.gameBan ? "Banned" : "Allowed"}
            </span>
          </p>
        </div>

        {(currUserRole === "superadmin" || // Superadmin can ban anyone
          (currUserRole === "admin" && user.role === "user")) && ( // Admin can ban only users
          <>
            <div className="chat-ban-change">
              <label>Reason:</label>
              <input
                type="text"
                value={chatBanReason}
                onChange={(e) => setChatBanReason(e.target.value)}
                placeholder={`Enter a reason for ${user.chatBan ? "un" : ""}banning ${user.username}`}
              />
              <button
                className={`${user.chatBan ? "unban-button" : "ban-button"} ${chatBanSending && "disabled"}`}
                onClick={handleChatBan}
              >
                Chat {user.chatBan ? "Unb" : "B"}an {user.username}
                {chatBanSending && (
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
              </button>
            </div>

            <div className="game-ban-change">
              <label>Reason:</label>
              <input
                type="text"
                value={gameBanReason}
                onChange={(e) => setGameBanReason(e.target.value)}
                placeholder={`Enter a reason for ${user.gameBan ? "un" : ""}banning ${user.username}`}
              />
              <button
                className={`${user.gameBan ? "unban-button" : "ban-button"} ${gameBanSending && "disabled"}`}
                onClick={handleGameBan}
              >
                Game {user.gameBan ? "Unb" : "B"}an {user.username}
                {gameBanSending && (
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
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ManageUser;
