import React from 'react'
import { useNavigate } from 'react-router-dom'
import LogoutButton from './LogoutButton'
import "../../styles/loginbar.css"

export const LoginBar = () => {
  const navigate = useNavigate();
  const onClick = (e) => {
    const page = e.target.className.slice(0, e.target.className.indexOf('-button'));
    navigate(`/${page}`);
  }

  const isLoggedIn = !!localStorage.getItem('token');
  const username = "testuser"; // TODO: Replace with actual username retrieval logic

  return (
    <div className="login-bar">
      {isLoggedIn ? (
        <div className="logged-in-bar">
          <p>Welcome, {username}</p>
          <LogoutButton />
        </div>
      ) : (
        <div>
          <button className='login-button' onClick={onClick}>Login</button>
          <button className='signup-button' onClick={onClick}>Sign Up</button>
        </div>
      )}
    </div>
  )
}

export default LoginBar;