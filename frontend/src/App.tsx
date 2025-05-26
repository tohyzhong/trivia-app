import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import React, { useEffect } from "react";
import './styles/App.css'

import useAuth from './hooks/useAuth';

import NavigationBar from './components/navigationbar/NavigationBar'

import GameMainpage from './components/game/GameMainpage'
import Leaderboard from './components/leaderboard/Leaderboard'
import SettingsRoutes from './components/settingspage/SettingsRoutes'
import AboutPage from './components/about/AboutPage'
import HomePage from './components/homepage/HomePage'
import Authentication from "./components/authentication/Authentication";

import ProfileRoutes from './components/profilepage/ProfileRoutes';
import { useSelector } from "react-redux";
import { RootState } from "./redux/store";

function App() {
  const isAuthChecked = useAuth();

  const location = useLocation();
  const navigate = useNavigate();
  const verified = useSelector((state: RootState) => state.user.verified);

  const authFreeRoutes = ['/settings', '/auth/login', '/auth/signup', '/auth/forgotpassword', '/about', '/leaderboard'];

  useEffect(() => {
    if (verified === false && !authFreeRoutes.some(route => location.pathname.startsWith(route)) && location.pathname !== '/') {
      navigate('/settings', { replace: true });
    }
  }, [verified, location.pathname, navigate]);

  const Components = [
    { component: HomePage, path: '/' },
    { component: GameMainpage, path: '/play' },
    { component: Leaderboard, path: '/leaderboard' },
    { component: SettingsRoutes, path: '/settings/*' },
    { component: AboutPage, path: '/about' },
    { component: Authentication, path: '/auth/*' }
  ]

  if (!isAuthChecked) {
    return null;
  }

  return (
    <>
      <NavigationBar />
      <Routes>
        {Components.map((comp) => {
          const ComponentName = comp.component;
          return <Route key={comp.path} path={comp.path} element={<ComponentName />} />;
        })}
        <Route path="/profile/*" element={<ProfileRoutes />} />
      </Routes>
    </>
  )
}

export default App;