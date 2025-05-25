import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import React, { useEffect } from "react";
import './styles/App.css'

import useAuth from './hooks/useAuth';

import NavigationBar from './components/navigationbar/NavigationBar'

import GameMainpage from './components/game/GameMainpage'
import Leaderboard from './components/leaderboard/Leaderboard'
import Settings from './components/settingspage/Settings'
import AboutPage from './components/about/AboutPage'
import HomePage from './components/homepage/HomePage'
import LoginPage from './components/loginpage/LoginPage'
import SignupPage from "./components/loginpage/SignupPage"
import PasswordReset from "./components/loginpage/PasswordReset";

import ProfileRoutes from './components/profilepage/ProfileRoutes';
import { useSelector } from "react-redux";
import { RootState } from "./redux/store";

function App() {
  useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { verified } = useSelector((state: RootState) => state.user);

  const authFreeRoutes = ['/settings', '/login', '/signup', '/forgotpassword', '/about', '/', '/leaderboard'];

  useEffect(() => {
    if (verified === false && !authFreeRoutes.includes(location.pathname)) {
      navigate('/settings', { replace: true });
    }
  }, [verified, location.pathname, navigate]);

  const Components = [
    { component: HomePage, path: '/' },
    { component: GameMainpage, path: '/play' },
    { component: Leaderboard, path: '/leaderboard' },
    { component: Settings, path: '/settings' },
    { component: AboutPage, path: '/about' },
    { component: LoginPage, path: '/login' },
    { component: SignupPage, path: '/signup' },
    { component: PasswordReset, path: '/forgotpassword' },
  ]

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