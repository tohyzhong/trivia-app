import React, { useEffect, useState } from 'react'
import LoginBar from './LoginBar';
import "../../styles/navbar.css"
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';

export const NavigationBar = () => {
  const isLoggedIn = useSelector((state: RootState) => state.user.isAuthenticated);
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [matchingProfiles, setMatchingProfiles] = useState([]);

  const [navBar, updateNavBar] = useState([
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
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
  }, [location.pathname, navBar])

  // Search Bar
  const handleSearch = (e) => {
    e.preventDefault();
    const topProfile = matchingProfiles[0]?.username ?? searchQuery.trim();
    setSearchQuery('');
    setMatchingProfiles([]);

    if (topProfile) {
      navigate(`/profile/${topProfile}`);
      window.location.reload();
    }
  };

  const filterProfiles = async (query) => {
    if (!query) {
      setMatchingProfiles([]);
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/profile/search-profiles?query=${encodeURIComponent(query)}`,
        {
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error('Failed to fetch profiles');
      const data = await response.json();
      setMatchingProfiles(data);
    } catch (err) {
      setMatchingProfiles([]);
    }
  };

  const handleInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    filterProfiles(query);
  };

  const onAuthPage = location.pathname.startsWith('/auth');

  return !onAuthPage ? (
    <nav className='navbar'>
      <div className='nav-search'>
        <ul className='nav-list'>
          {navBar.map((item) =>
            <li key={item.name.toLowerCase() + "-button"} className='nav-item'>
              <a href={item.path}>{item.name}</a>
            </li>
          )}
        </ul>

        {isLoggedIn ? (
          <div className='search-bar'>
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                placeholder="Search for a profile"
              />
              <button type="submit">Search</button>
            </form>

            {matchingProfiles.length > 0 && (
              <div className="profile-dropdown">
                <ul>
                  {matchingProfiles.map((profile) => (
                    <li key={profile.username} onClick={
                      () => {
                        navigate(`/profile/${profile.username}`)
                        setSearchQuery('');
                        setMatchingProfiles([]);
                      }
                    }>
                      {profile.username}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null
        }
      </div>

      <LoginBar />
    </nav>
  ) : (<></>)
}

export default NavigationBar