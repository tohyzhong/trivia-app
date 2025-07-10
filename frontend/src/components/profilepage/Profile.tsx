import React, { useState, useEffect } from "react";
import { RootState } from "../../redux/store";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import defaultAvatar from "../../assets/default-avatar.jpg";
import "../../styles/Profile.css";
import { setUser } from "../../redux/userSlice";
import { setError } from "../../redux/errorSlice";

interface Friend {
  username: string;
  profilePicture: string;
}

interface UserProfile {
  username: string;
  currency: number;
  profilePicture: string;
  role: string;
  friends: Friend[];
  message?: string;
  addedFriend: Boolean;
  receivedFriendRequest: Boolean;
  classicStats: { [key: string]: number };
  knowledgeStats: { [key: string]: number };
}

interface ProfileProps {
  user1?: string;
}

const Profile: React.FC<ProfileProps> = ({ user1 }) => {
  const { username: paramUsername } = useParams<{ username: string }>();
  const userFromRedux = useSelector((state: RootState) => state.user);
  const usernameFromRedux = userFromRedux.username;
  const currUserRole = userFromRedux.role;
  const username = paramUsername || user1 || usernameFromRedux;
  const [user, setUserProfile] = useState<UserProfile | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Retrieve profile details
  const fetchProfile = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/profile/${username}`,
        {
          credentials: "include"
        }
      );
      const data: UserProfile = await response.json();
      if (username === usernameFromRedux && data.role !== currUserRole) {
        await fetch(`${import.meta.env.VITE_API_URL}/api/auth/refresh-token`, {
          method: "POST",
          credentials: "include"
        });

        dispatch(setUser({ ...userFromRedux, role: data.role }));
      }
      setUserProfile(data);
      console.log(data);
      setFriends(data.friends || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching profile data", error);
    }
  };

  useEffect(() => {
    if (username) {
      fetchProfile();
    }
  }, [username]);

  const handleFriendClick = (friendUsername: string) => {
    navigate(`/profile/${friendUsername}`);
  };

  const handleFriendsClick = () => {
    navigate(`/profile/${user.username}/friends`);
  };

  const isFriend =
    friends?.map((friend) => friend.username).includes(usernameFromRedux) ||
    false;

  const handleAddFriend = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/friends/${usernameFromRedux}/add`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({
            friendUsername: user.username
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        dispatch(setError({ errorMessage: data.message, success: true }));
        fetchProfile();
      } else {
        dispatch(
          setError({
            errorMessage:
              "Failed to add friend: " + (data.message || "Unknown error."),
            success: false
          })
        );
      }
    } catch (error) {
      dispatch(
        setError({
          errorMessage: "An error occurred while adding the friend.",
          success: false
        })
      );
    }
  };

  const handleDeleteFriend = async () => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/friends/${usernameFromRedux}/remove`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({
            friendUsername: user.username
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        dispatch(setError({ errorMessage: data.message, success: true }));
        fetchProfile();
      } else {
        dispatch(
          setError({
            errorMessage:
              "Failed to remove friend: " + (data.message || "Unknown error."),
            success: false
          })
        );
      }
    } catch (error) {
      console.error("Error removing friend:", error);
      dispatch(
        setError({
          errorMessage: "An error occurred while removing the friend.",
          success: false
        })
      );
    }
  };

  const handleSeeMatchHistory = () => {
    navigate(`/profile/${username}/matchhistory`);
  };

  const handleReport = async (usernameToReport: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/profile/report`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            reported: usernameToReport,
            source: "profile",
            lobbyId: null
          })
        }
      );

      const data = await response.json();
      if (response.ok) {
        dispatch(
          setError({
            errorMessage: "User reported successfully.",
            success: true
          })
        );
      } else {
        dispatch(
          setError({
            errorMessage: "Failed to report user: " + data.message,
            success: false
          })
        );
      }
    } catch (err) {
      console.error("Error reporting user:", err);
      dispatch(
        setError({
          errorMessage: "Error reporting user:" + String(err),
          success: false
        })
      );
    }
  };

  if (
    !user ||
    user.message === "Profile not found" ||
    user.message === "Not authenticated"
  ) {
    return <div className="not-found">Profile not found</div>;
  }

  return (
    <div className="profile-container">
      <div className="header-buttons">
        <div className="profile-header-container">
          <div className="profile-header">
            <h1 className="profile-name">{user.username}'s Profile</h1>
            <img
              src={user.profilePicture || defaultAvatar}
              alt={`${user.username}'s profile`}
              className="profile-image"
            />
          </div>
        </div>

        <div className="role-container">
          <p className="profile-role">
            {user.role === "superadmin"
              ? "👑 Superadmin"
              : user.role === "admin"
                ? "🛡️ Admin"
                : ""}
          </p>

          {user.username !== usernameFromRedux && (
            <button
              className="report-button"
              onClick={() => handleReport(user.username)}
            >
              Report User
            </button>
          )}
        </div>

        <div className="friend-buttons-container">
          {user.username !== usernameFromRedux && (
            <>
              {isFriend && (
                <button
                  className="remove-friend-button"
                  onClick={handleDeleteFriend}
                >
                  Remove Friend
                </button>
              )}

              {!isFriend && user.receivedFriendRequest && (
                <button className="add-friend-button" onClick={handleAddFriend}>
                  Confirm Friend Request
                </button>
              )}

              {!isFriend &&
                !user.receivedFriendRequest &&
                !user.addedFriend && (
                  <button
                    className="add-friend-button"
                    onClick={handleAddFriend}
                  >
                    Add Friend
                  </button>
                )}

              {!isFriend && !user.receivedFriendRequest && user.addedFriend && (
                <button
                  className="remove-friend-button"
                  onClick={handleDeleteFriend}
                >
                  Delete Friend Request
                </button>
              )}

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
                                data.message ||
                                `User role updated to ${newRole}`,
                              success: true
                            })
                          );
                          fetchProfile();
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
            </>
          )}
        </div>
      </div>

      <button className="see-match-history" onClick={handleSeeMatchHistory}>
        Match History
      </button>

      <div className="profile-details-container">
        <div className="stats-container">
          <div className="profile-details">
            <h3>Classic Stats:</h3>
            <p>
              <strong>Overall Score:</strong> {user.classicStats.score}
            </p>
            <p>
              <strong>Win Rate:</strong> {user.classicStats.winRate}
            </p>
            <p>
              <strong>Matches Won:</strong> {user.classicStats.wonMatches}
            </p>
            <p>
              <strong>Total Matches:</strong> {user.classicStats.totalMatches}
            </p>
            <p>
              <strong>Correct Rate:</strong> {user.classicStats.correctRate}
            </p>
            <p>
              <strong>Correct Answers:</strong>{" "}
              {user.classicStats.correctAnswer}
            </p>
            <p>
              <strong>Total Answered:</strong> {user.classicStats.totalAnswer}
            </p>
          </div>
          <div className="profile-details">
            <h3>Knowledge Stats:</h3>
            <p>
              <strong>Overall Score:</strong> {user.knowledgeStats.score}
            </p>
            <p>
              <strong>Win Rate:</strong> {user.knowledgeStats.winRate}
            </p>
            <p>
              <strong>Matches Won:</strong> {user.knowledgeStats.wonMatches}
            </p>
            <p>
              <strong>Total Matches:</strong> {user.knowledgeStats.totalMatches}
            </p>
            <p>
              <strong>Correct Rate:</strong> {user.knowledgeStats.correctRate}
            </p>
            <p>
              <strong>Correct Answers:</strong>{" "}
              {user.knowledgeStats.correctAnswer}
            </p>
            <p>
              <strong>Total Answered:</strong> {user.knowledgeStats.totalAnswer}
            </p>
          </div>
        </div>

        <div className="friends-list-container">
          <div className="friends-list">
            <h3 onClick={() => handleFriendsClick()}>Friends:</h3>
            <ul>
              {friends.map((friend, index) => (
                <li
                  key={friend.username}
                  onClick={() => handleFriendClick(friend.username)}
                >
                  <span>{index + 1}. </span>
                  {friend.username}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
