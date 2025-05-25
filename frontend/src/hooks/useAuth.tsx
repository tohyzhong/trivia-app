import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setUser, logout } from '../redux/userSlice';
import { useLocation } from 'react-router-dom';

const useAuth = () => {
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
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
        } else {
          dispatch(logout());
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        dispatch(logout());
      }
    };

    checkAuth();
  }, [location.pathname, dispatch]);
};

export default useAuth;