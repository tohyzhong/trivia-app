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

interface GameSetting {
  numQuestions: number,
  timePerQuestion: number,
  difficulty: number, 
  categories: string[],
}

interface ChatMessage {
  sender: string;
  message: string;
}

interface GameLobbyProps {
  lobbyId: string;
  lobbySettings: GameSetting;
  lobbyUsers: string[]
  lobbyChat: ChatMessage[];
}

const GameLobby: React.FC<GameLobbyProps> = (props) => {
  // Handle component loading
  const [ loading, setLoading ] = useState<boolean>(true);

  // Lobby details
  const { lobbyId, lobbySettings, lobbyUsers, lobbyChat } = props;

  // Ensure that the states are loaded
  useEffect(() => {
    if (lobbyId && lobbySettings && lobbyUsers && lobbyChat) {
      setLoading(false);
    }
  }, [lobbyId, lobbySettings, lobbyUsers, lobbyChat])

  return loading ? <></> : (
    <div className='game-lobby-full'>
      <div className='game-lobby-container'>
        <GameSettings gameSettings={lobbySettings}/>
        <GameUsers lobbyId={lobbyId} userIds={lobbyUsers}/>
        <GameChat lobbyId={lobbyId} chatMessages={lobbyChat}/>
      </div>
    </div>
  )
}

export default GameLobby