import React from 'react'
import { useNavigate } from 'react-router-dom'
import LogoutButton from '../loginpage/LogoutButton'
import "../../styles/loginbar.css"

export const LoginBar = () => {
  const navigate = useNavigate();
  const onClick = (e) => {
    const page = e.target.className.slice(0, e.target.className.indexOf('-button'));
    navigate(`/${page}`);
  }

  const isLoggedIn = !!localStorage.getItem('token');

  return (
    <div className="login-bar">
      {isLoggedIn ? (
        <LogoutButton />
      ) : (
        <div>
          <button className='login-button' onClick={onClick}>Login</button>
          <button className='signup-button' onClick={onClick}>Sign Up</button>
        </div>
      )}
    </div>
  )
}

export default LoginBar