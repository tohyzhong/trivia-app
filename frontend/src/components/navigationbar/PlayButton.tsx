import React from 'react'
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';

const PlayButton = () => {
  const username = useSelector((state: RootState) => state.user.username);
  const lobby = useSelector((state: RootState) => state.lobby);
  const navigate = useNavigate();

  const handleClick = () => {
    username ? lobby.lobbyId ? navigate(`/play/${lobby.lobbyId}`) : navigate('/play') : navigate('/auth/login?error=login_required');
  }

  return (
    <div>
      <button className='play-button' onClick={handleClick}>
        {lobby.lobbyId ? 'Return to Lobby' : 'Play The Rizz Quiz'}
      </button>
    </div>
  )
}

export default PlayButton