import React from 'react';
import { useNavigate } from 'react-router-dom';

const LogoutButton: React.FC = () => {
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (res.ok) {
        window.location.reload();
        navigate('/');
      } else {
        const data = await res.json();
        console.error('Logout failed:', data.message || 'An error occurred');
      }
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  return (
    <button onClick={handleLogout} className='logout-button'>Logout</button>
  );
};

export default LogoutButton;