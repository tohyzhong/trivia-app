import React, { useState, useEffect } from 'react';
import { RootState } from '../../redux/store';
import { useSelector } from "react-redux";
import { useNavigate, useParams } from 'react-router-dom';
import defaultAvatar from '../../assets/default-avatar.jpg';
import '../../styles/Profile.css';

interface UserProfile {
  username: string;
  winRate: number;
  correctRate: number;
  correctNumber: number;
  friends: string[];
  currency: number;
  profilePicture: string;
  message?: string;
}

interface ProfileProps {
  user1?: string;
}

const Profile: React.FC<ProfileProps> = ({ user1 }) => {
  const { username: paramUsername } = useParams<{ username: string }>();
  const usernameFromRedux = useSelector((state: RootState) => state.user.username);
  const username = paramUsername || user1 || usernameFromRedux;
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/profile/${username}`);
        const data: UserProfile = await response.json();
        setUser(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching profile data", error);
        setLoading(false);
      }
    };

    if (username) {
      fetchProfile();
    }
  }, [username]);

  const handleFriendClick = (friendUsername: string) => {
    navigate(`/profile/${friendUsername}`);
  };

  const handleFriendsClick = () => {
    navigate(`/profile/${user.username}/friends`);
  }

  const isFriend = user?.friends?.includes(usernameFromRedux) || false;

  const handleAddFriend = async () => {
    try {
      const response = await fetch(`/api/profile/${usernameFromRedux}/friends/add`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          friendUsername: user.username,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
      } else {
        alert('Failed to add friend: ' + (data.message || 'Unknown error.'));
      }
    } catch (error) {
      console.error('Error adding friend:', error);
      alert('An error occurred while adding the friend.');
    }
    window.location.reload();
  };

  const handleDeleteFriend = async () => {
    try {
      const response = await fetch(`/api/profile/${usernameFromRedux}/friends/remove`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          friendUsername: user.username,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
      } else {
        alert('Failed to remove friend: ' + (data.message || 'Unknown error.'));
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      alert('An error occurred while removing the friend.');
    }
    window.location.reload();
  };

  if (!user || user.message === "Profile not found") {
    return <div className="not-found">Profile not found</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>{user.username}'s Profile</h1>
        <img
          src={user.profilePicture || defaultAvatar}
          alt={`${user.username}'s profile`}
          className="profile-image"
        />
      </div>

      <div className="profile-details-container">
        <div className="profile-details">
          <p><strong>Win Rate:</strong> {user.winRate}%</p>
          <p><strong>Correct Rate:</strong> {user.correctRate}%</p>
          <p><strong>Correct Answers:</strong> {user.correctNumber}</p>
          <p><strong>Currency:</strong> {user.currency}</p>

        </div>
        <div className="friends-list">
          <h3 onClick={() => handleFriendsClick()}>Friends:</h3>
          <ul>
            {user.friends.map((friend, index) => (
              <li key={friend} onClick={() => handleFriendClick(friend)}>
                <span>{index + 1}. </span>
                {friend}
              </li>
            ))}
          </ul>
        </div>

        {user.username !== usernameFromRedux && (
          <>
            {!isFriend && (
              <button className="add-friend-button" onClick={handleAddFriend}>
                Add Friend
              </button>
            )}

            {isFriend && (
              <button className="remove-friend-button" onClick={handleDeleteFriend}>
                Remove Friend
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;