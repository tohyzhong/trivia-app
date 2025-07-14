import React from "react";
import { Routes, Route } from "react-router-dom";
import Profile from "./Profile";
import FriendsList from "./FriendsList";
import MatchHistory from "./MatchHistory";
import ManageUser from "./ManageUser";

const ProfileRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/:username" element={<Profile />} />
      <Route path="/:username/friends" element={<FriendsList />} />
      <Route path="/:username/matchhistory" element={<MatchHistory />} />
      <Route path="/:username/manage" element={<ManageUser />} />
      <Route path="/" element={<Profile />} />
    </Routes>
  );
};

export default ProfileRoutes;
