import { useNavigate } from 'react-router-dom'
import LogoutButton from './LogoutButton'
import "../../styles/loginbar.css"
import useAuth from '../../hooks/useAuth';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import React from 'react';

export const LoginBar = () => {
  const navigate = useNavigate();
  const onClick = (e) => {
    const page = e.target.className.slice(0, e.target.className.indexOf('-button'));
    navigate(`/${page}`);
  }

  const handleUsernameClick = () => {
    if (username) {
      navigate(`/profile`);
    }
  }

  const username = useSelector((state: RootState) => state.user.username);

  const isLoggedIn = useAuth();
  if (isLoggedIn === null) {
    return null;
  }

  return (
    <div className="login-bar">
      {isLoggedIn ? (
        <div className="logged-in-bar">
          <div className="welcome-text">
            <p>Welcome,&nbsp;</p>
            <p onClick={handleUsernameClick} className='username'>{username}</p>
          </div>
          <LogoutButton />
        </div>
      ) : (
        <div>
          <button className='login-button login-bar-button' onClick={onClick}>Login</button>
          <button className='signup-button login-bar-button' onClick={onClick}>Sign Up</button>
        </div>
      )}
    </div>
  )
}

export default LoginBar;