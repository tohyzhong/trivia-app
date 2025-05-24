import React, { useState, useEffect } from 'react';
import { RootState } from '../../redux/store';
import { useSelector } from "react-redux";
import { useParams } from 'react-router-dom';
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

  if (loading) {
    return null;
  }

  if (!user) {
    return <div>Profile not found</div>;
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

      <div className="profile-details">
        <p><strong>Win Rate:</strong> {user.winRate}%</p>
        <p><strong>Correct Rate:</strong> {user.correctRate}%</p>
        <p><strong>Correct Answers:</strong> {user.correctNumber}</p>
        <p><strong>Currency:</strong> {user.currency}</p>

        <div className="friends-list">
          <h3>Friends:</h3>
          <ul>
            {user.friends.map((friend, index) => (
              <li key={friend}>
                <span>{index + 1}. </span>
                {friend}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Profile;