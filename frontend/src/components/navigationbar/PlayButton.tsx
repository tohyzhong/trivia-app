import React from 'react'
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';

const PlayButton = () => {
  const username = useSelector((state: RootState) => state.user.username);
  const navigate = useNavigate();
  const handleClick = () => {
    username ? navigate('/play') : navigate('/auth/login?error=login_required');
  }

  return (
    <div>
      <button className='play-button' onClick={handleClick}>Play The Rizz Quiz</button>
    </div>
  )
}

export default PlayButton