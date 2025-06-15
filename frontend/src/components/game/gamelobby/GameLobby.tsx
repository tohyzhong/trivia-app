import React, { useEffect, useState } from 'react'
import { io } from 'socket.io-client';

import '../../../styles/gamelobby.css';
import GameSettings from './GameSettings';
import GameUsers from './GameUsers';
import GameChat from './GameChat';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';

const socket = io(import.meta.env.VITE_API_URL)

const GameLobby = () => {
  const lobbyId = '7c8202df-0335-43a6-afa2-c9229d2260db';

  useEffect(() => {
    if (lobbyId) {
      socket.emit('joinLobby', lobbyId);
      socket.on('lobbyUpdate', (data) => {
        console.log(data);
      });
    }
    return () => {
      socket.emit('leaveLobby', lobbyId);
      socket.off('lobbyUpdate');
    }
  }, [lobbyId])

  const loggedInUser = useSelector((state: RootState) => state.user.username)
  const test = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/lobby/solo/chat/${lobbyId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ player: loggedInUser, message: 'test' }),
        });
      const data = await response.json();
      console.log(data);

    } catch (error) {
      
    }
  }

  return (
    <div className='game-lobby-full'>
      <div className='game-lobby-container'>
        <GameSettings />
        <GameUsers />
        <GameChat />
      </div>
      <button onClick={test}>Test</button>
    </div>
  )
}

export default GameLobby