import React, { useEffect, useState } from 'react'
import LoginBar from './LoginBar';
import "../../styles/navbar.css"
import { useLocation } from 'react-router-dom';

export const NavigationBar = () => {
  const isLoggedIn = !!localStorage.getItem('token');

  const [navBar, updateNavBar] = useState([
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Play', path: '/play' },
    { name: 'Leaderboard', path: '/leaderboard' },
  ])

  // TODO: Find a cleaner way to do this?
  useEffect(() => {
    if (isLoggedIn) {
      updateNavBar([
        { name: 'Home', path: '/' },
        { name: 'About', path: '/about' },
        { name: 'Play', path: '/play' },
        { name: 'Leaderboard', path: '/leaderboard' },
        { name: 'Profile', path: '/profile' },
        { name: 'Settings', path: '/settings' },
      ])
    } else {
      updateNavBar([
        { name: 'Home', path: '/' },
        { name: 'About', path: '/about' },
        { name: 'Leaderboard', path: '/leaderboard' },
      ])
    }
  }, [isLoggedIn])


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

  const onAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  return !onAuthPage ? (
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
  ) : (<></>)
}

export default NavigationBar