import React from 'react'
import LoginBar from './LoginBar';
import "../../styles/navbar.css"

export const NavigationBar = () => {
  const navBar = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Play', path: '/play' },
    { name: 'Leaderboard', path: '/leaderboard' },
    { name: 'Settings', path: '/settings' },
    { name: 'Profile', path: '/profile' },
  ]

  return (
    <nav className='navbar'>
      <ul className='nav-list'>
        {navBar.map((item) =>
          <li key={item.name.toLowerCase() + "-button"} className='nav-item'>
            <a href={item.path}>{item.name}</a>
          </li>
        )}
      </ul>
      <LoginBar />
    </nav>
  )
}

export default NavigationBar