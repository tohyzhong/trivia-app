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
  currency: number;
  profilePicture: string;
  message?: string;
}

interface Friend {
  username: string;
  profilePicture: string;
}

interface ProfileProps {
  user1?: string;
}

const Profile: React.FC<ProfileProps> = ({ user1 }) => {
  const { username: paramUsername } = useParams<{ username: string }>();
  const usernameFromRedux = useSelector((state: RootState) => state.user.username);
  const username = paramUsername || user1 || usernameFromRedux;
  const [user, setUser] = useState<UserProfile | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Retrieve profile details
  const fetchProfile = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/profile/${username}`,
        {
          credentials: 'include',
        });
      const data: UserProfile = await response.json();
      setUser(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching profile data", error);
    }
  };

  // Retrieve friend details
  const fetchFriends = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/friends/${username}/all`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ mutual: true, incoming: false }),
        });
      if (!response.ok) throw new Error('Failed to fetch friends');

      const data = await response.json();
      setFriends(data.mutual);
    } catch (error) {
      console.error("Error fetching profile data", error);
    }
  }

  useEffect(() => {
    if (username) {
      fetchProfile();
      fetchFriends();
    }
  }, [username]);

  const handleFriendClick = (friendUsername: string) => {
    navigate(`/profile/${friendUsername}`);
  };

  const handleFriendsClick = () => {
    navigate(`/profile/${user.username}/friends`);
  }

  const isFriend = (friends?.map(friend => friend.username)).includes(usernameFromRedux) || false;

  const handleAddFriend = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/friends/${usernameFromRedux}/add`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/friends/${usernameFromRedux}/remove`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
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

  if (!user || user.message === "Profile not found" || user.message === "Not authenticated") {
    return <div className="not-found">Profile not found</div>;
  }

  return (
    <div className="profile-container">
      <div className="header-buttons">
        <div className="profile-header-container">
          <div className="profile-header">
            <h1>{user.username}'s Profile</h1>
            <img
              src={user.profilePicture || defaultAvatar}
              alt={`${user.username}'s profile`}
              className="profile-image"
            />
          </div>
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
                <button className="remove-friend-button" onClick={handleDeleteFriend}>
                  Remove Friend
                </button>
              )}
            </>
          )}
        </div>
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
            {friends.map((friend, index) => (
              <li key={friend.username} onClick={() => handleFriendClick(friend.username)}>
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