import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUser } from '../../redux/userSlice';
import { useNavigate } from 'react-router-dom';
import '../../styles/loginpage.css';
import { ReturnButton } from './ReturnButton';
import useAuth from '../../hooks/useAuth';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isLoggedIn = useAuth();

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/');
    }
  }, [isLoggedIn, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (res.ok) {
      window.location.reload();
      dispatch(setUser({ username: username, email: data.email, verified: data.verified }));
      navigate('/');
    } else {
      setError(data.error || 'Login failed');
    }
  };

  return (
    <div className="login-page">
      <div className="form-container">
        <form onSubmit={handleLogin}>
          {error && <div className="error">{error}</div>}
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          <a className='forgot-password' href='/forgotpassword'>Forgot Password?</a>
          <div className='buttons-container'>
            <ReturnButton />
            <button type="submit" className='submit-button'>Login</button>
          </div>
          <p className='register-message'>Don't have an account? <a href='/signup'>Sign up here!</a></p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;