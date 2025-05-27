import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setUser, logout } from '../redux/userSlice';
import { useLocation } from 'react-router-dom';

const useAuth = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log(import.meta.env.VITE_API_URL);
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-token`, {
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
      } finally {
        setIsAuthChecked(true);
      }
    };

    checkAuth();
  }, [location.pathname, dispatch]);

  return isAuthChecked;
};

export default useAuth;