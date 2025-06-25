import React, { useState, useEffect } from "react";
import { RootState } from "../../redux/store";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import defaultAvatar from "../../assets/default-avatar.jpg";
import "../../styles/Profile.css";

interface Friend {
  username: string;
  profilePicture: string;
}

interface UserProfile {
  username: string;
  winRate: number;
  correctRate: number;
  correctAnswer: number;
  totalAnswer: number;
  currency: number;
  profilePicture: string;
  role: string;
  friends: Friend[];
  message?: string;
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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

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
      setUser(data);
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
        alert(data.message);
      } else {
        alert("Failed to add friend: " + (data.message || "Unknown error."));
      }
    } catch (error) {
      console.error("Error adding friend:", error);
      alert("An error occurred while adding the friend.");
    }
    window.location.reload();
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
        alert(data.message);
      } else {
        alert("Failed to remove friend: " + (data.message || "Unknown error."));
      }
    } catch (error) {
      console.error("Error removing friend:", error);
      alert("An error occurred while removing the friend.");
    }
    window.location.reload();
  };

  const handleSeeMatchHistory = () => {
    navigate(`/profile/${username}/matchhistory`);
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
        </div>

        <div className="friend-buttons-container">
          {user.username !== usernameFromRedux && (
            <>
              {!isFriend && (
                <button className="add-friend-button" onClick={handleAddFriend}>
                  Add Friend
                </button>
              )}

              {isFriend && (
                <button
                  className="remove-friend-button"
                  onClick={handleDeleteFriend}
                >
                  Remove Friend
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
                          alert(
                            data.message || `User role updated to ${newRole}`
                          );
                          fetchProfile();
                        } else {
                          alert(data.message || "Failed to update role.");
                        }
                      } catch (err) {
                        console.error("Error updating user role:", err);
                        alert("Server error while updating role.");
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

      <div className="profile-details-container">
        <div className="profile-details">
          <h3>Game Stats:</h3>
          <p>
            <strong>Win Rate:</strong> {user.winRate}%
          </p>
          <p>
            <strong>Correct Rate:</strong> {user.correctRate}%
          </p>
          <p>
            <strong>Correct Answers:</strong> {user.correctAnswer}
          </p>
          <p>
            <strong>Total Answered:</strong> {user.totalAnswer}
          </p>
          <p className="see-match-history" onClick={handleSeeMatchHistory}>
            See Game History...
          </p>
        </div>
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
  );
};

export default Profile;
