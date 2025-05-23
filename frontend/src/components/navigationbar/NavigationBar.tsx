import React, { useEffect } from 'react'
import LoginBar from './LoginBar';
import "../../styles/navbar.css"
import { useLocation } from 'react-router-dom';

export const NavigationBar = () => {
  const navBar = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Play', path: '/play' },
    { name: 'Leaderboard', path: '/leaderboard' },
    { name: 'Settings', path: '/settings' },
    { name: 'Profile', path: '/profile' },
  ]

  const location = useLocation();
  useEffect(() => {
    const navItems = document.querySelectorAll('.nav-item a');
    navItems.forEach((item) => {
      if (item.getAttribute('href') === location.pathname) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }, [location.pathname])

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