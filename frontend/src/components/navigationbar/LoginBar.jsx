import React from 'react'
import { useNavigate } from 'react-router-dom'

export const LoginBar = () => {
  const navigate = useNavigate();
  const onClick = (e) => {
    const page = e.target.className.slice(0, e.target.className.indexOf('-button'));
    navigate(`/${page}`);
  }

  return (
    <div>
      <button className='login-button' onClick={onClick}>Login</button>
      <button className='signup-button' onClick={onClick}>Sign Up</button>
    </div>
  )
}
