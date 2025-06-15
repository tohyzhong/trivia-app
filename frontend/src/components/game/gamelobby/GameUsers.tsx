import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { useNavigate } from 'react-router-dom';
import defaultAvatar from '../../../assets/default-avatar.jpg';

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
        setUsers([...data.users,
          // For scroll test (to be deleted)
          {username: 'test1', profilePicture: defaultAvatar},
          {username: 'test2', profilePicture: defaultAvatar},
          {username: 'test3', profilePicture: defaultAvatar},
          {username: 'test4', profilePicture: defaultAvatar},
          {username: 'test5', profilePicture: defaultAvatar},
          {username: 'test6', profilePicture: defaultAvatar},
          {username: 'test7', profilePicture: defaultAvatar},
          {username: 'test8', profilePicture: defaultAvatar},
          {username: 'test9', profilePicture: defaultAvatar},
          {username: 'test10', profilePicture: defaultAvatar}
        ])
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
      console.log(data);
      if (response.ok){
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
            <img src={user.profilePicture} alt={user.username+'\'s Profile Picture'}/>
            <h3>&nbsp;{user.username}</h3>
          </ul>
        ))}
      </div>
      <div className='game-lobby-buttons'>
        <button className='leave-button' onClick={handleLeave}>Leave</button>
        <button className='ready-button'>Ready</button>
      </div>
    </div>
  )
}

export default GameUsers