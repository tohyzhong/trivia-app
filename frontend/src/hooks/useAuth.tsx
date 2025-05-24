import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setUser } from '../redux/userSlice';

const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const dispatch = useDispatch();  // Hook to dispatch Redux actions

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/verify-token', {
        method: 'GET',
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();

        dispatch(setUser({
          username: data.username,
          email: data.email,
          verified: data.verified,
        }));

        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('Error checking authentication:', err);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);
  return isAuthenticated;
};

export default useAuth;