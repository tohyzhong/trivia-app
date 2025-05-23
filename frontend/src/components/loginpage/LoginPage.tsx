import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/loginpage.css';
import { ReturnButton } from './ReturnButton';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  const isLoggedIn = !!localStorage.getItem('token');
  if (isLoggedIn) {
    navigate('/');
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('token', data.token);
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
          <div className='buttons-container'>
            <ReturnButton />
            <button type="submit" className='submit-button'>Login</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;