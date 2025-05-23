import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Profile from './Profile';
import FriendsList from './FriendsList';

const ProfileRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/:username" element={<Profile />} />
      <Route path="/:username/friends" element={<FriendsList />} />
      <Route path="/" element={<Profile />} />
    </Routes>
  );
};

export default ProfileRoutes;
