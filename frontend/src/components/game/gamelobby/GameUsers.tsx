import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { useNavigate } from 'react-router-dom';
import defaultAvatar from '../../../assets/default-avatar.jpg';
import { clearLobby } from '../../../redux/lobbySlice';

interface User {
  username: string;
  profilePicture: string;
}

interface GameUsersProps {
  lobbyId: string;
  userIds: string[];
}

const GameUsers: React.FC<GameUsersProps> = (props) => {
  const { lobbyId, userIds } = props;
  const loggedInUser = useSelector((state: RootState) => state.user.username);
  const [ users, setUsers ] = useState<User[]>([]);

  // Render all users and avatars
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const renderUsers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/profile/get-profiles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userIds }),
      })
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users)
      } else {
        throw new Error();
      }
    } catch (error) {
      console.error(error)
      navigate('/',{ state: { errorMessage: 'Error loading lobby. A report has been sent to the admins' } });
    }
  }

  useEffect(() => {
    if (userIds) renderUsers();
  }, [userIds])

  // Ready button 
  const handleReady = () => {
    // TODO for multiplayer
  }

  // Start button
  const handleStart = () => {

  }

  // Leaving Lobby
  const handleLeave = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/lobby/solo/leave/${lobbyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ player: loggedInUser }),
      })
      const data = await response.json();
      if (response.ok){
        dispatch(clearLobby());
        navigate('/',{ state: { errorMessage: 'You left the lobby.' } });
      } else {
        throw new Error();
      }
    } catch (error) {
      console.error(error);
      navigate('/',{ state: { errorMessage: 'Error loading lobby. A report has been sent to the admins' } });
    }
  }

  return (
    <div className='game-lobby-users'>
      <div className='game-lobby-users-header'>
        <h1>Players</h1>
      </div>
      <div className='game-lobby-users-list'>
        {users.length > 0 && users.map((user, index) => (
          <ul key={user.username+index} className='game-lobby-user'>
            <img src={user.profilePicture || defaultAvatar} alt={user.username+'\'s Profile Picture'}/>
            <h3>&nbsp;{user.username}</h3>
          </ul>
        ))}
      </div>
      <div className='game-lobby-buttons'>
        <button className='leave-button' onClick={handleLeave}>Leave</button>
        <button className='ready-button' onClick={handleReady}>Ready</button>
        <button className='start-button' onClick={handleStart}>Start</button>
      </div>
    </div>
  )
}

export default GameUsers