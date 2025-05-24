import React, { useState, useEffect } from 'react';
import { RootState } from '../../redux/store';
import { useSelector } from "react-redux";

interface UserProfile {
  username: string;
  winRate: number;
  correctRate: number;
  correctNumber: number;
  friends: string[];
  currency: number;
}

interface ProfileProps {
  user1?: string;
}

const Profile: React.FC<ProfileProps> = ({ user1 }) => {
  const user2 = useSelector((state: RootState) => state.user.username);
  const username = user1 || user2;
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
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Profile not found</div>;
  }

  return (
    <div>
      <h1>{user.username}'s Profile</h1>
      <p>Win Rate: {user.winRate}%</p>
      <p>Correct Rate: {user.correctRate}%</p>
      <p>Correct Answers: {user.correctNumber}</p>
      <p>Friends: {user.friends.join(', ')}</p>
      <p>Currency: {user.currency}</p>
    </div>
  );
};

export default Profile;