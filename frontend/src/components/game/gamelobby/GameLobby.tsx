import React, { useEffect, useState } from 'react'
import { io } from 'socket.io-client';

import '../../../styles/gamelobby.css';
import GameSettings from './GameSettings';
import GameUsers from './GameUsers';
import GameChat from './GameChat';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { useNavigate } from 'react-router-dom';

const socket = io(import.meta.env.VITE_API_URL)

interface LobbyDetails {
  lobbyId: string;
  players: string[];
  gameType: 'solo-classic' | 'solo-knowledge';
  status: 'waiting' | 'in-progress' | 'finished';
  gameData: object;
  gameSettings: object;
  gameResult: object;
  chatMessages: { sender: string; message: string; timestamp: Date }[];
}

interface GameLobbyProps {
  lobbyId: string;
  lobbyState: LobbyDetails;
}

const GameLobby: React.FC<GameLobbyProps> = (props) => {
  // Handle component loading
  const [ loading, setLoading ] = useState<boolean>(true);

  // Lobby details
  const { lobbyId } = props;
  const [ lobbyState, setLobbyState ] = useState(props.lobbyState);

  useEffect(() => {
    if (lobbyState) setLoading(false);
  }, [lobbyState])

  // Handle updates and disconnection from lobby
  const navigate = useNavigate();
  const disconnect = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/lobby/solo/disconnect/${lobbyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ player: loggedInUser }),
      });
    } catch (error) {
      navigate('/',{ state: { errorMessage: 'There was an issue disconnecting you. A report has been sent to the admins' } });
    }
  }

  useEffect(() => {
    socket.emit('joinLobby', lobbyId);
    socket.on('updateLobby', (data) => {
      setLobbyState(data.updatedLobby);
    });
    return () => {
      socket.emit('leaveLobby', lobbyId);
      disconnect();
      socket.off('updateLobby');
    }
  }, []);

  const loggedInUser = useSelector((state: RootState) => state.user.username)

  return loading ? <></> : (
    <div className='game-lobby-full'>
      <div className='game-lobby-container'>
        <GameSettings />
        <GameUsers />
        <GameChat lobbyId={lobbyId} chatMessages={lobbyState ? lobbyState.chatMessages : []}/>
      </div>
    </div>
  )
}

export default GameLobby