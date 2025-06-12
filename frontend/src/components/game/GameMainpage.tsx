import React from 'react';
import '../../styles/game.css';
import SoloModeLogo from '../../assets/solo_mode.png';
import MultiplayerModeLogo from '../../assets/multiplayer_mode.png';
import LeaderboardLogo from '../../assets/leaderboard_logo.png';

export const GameMainpage: React.FC = () => {
  const modes = [
    {
      name: 'Solo Mode',
      description: 'Play alone and test your meme knowledge!',
      logo: SoloModeLogo,
      link: '/solo'
    },
    {
      name: 'Multiplayer Mode',
      description: 'Compete with friends or players worldwide!',
      logo: MultiplayerModeLogo,
      link: '/multiplayer'
    },
    {
      name: 'Leaderboard',
      description: 'Check out the top memers and their scores!',
      logo: LeaderboardLogo,
      link: '/leaderboard'
    }
  ]

  return (
    <div className='game-mainpage'>
      <div className='welcome-message'>
        <h1>Welcome to The Rizz Quiz</h1>
        <p>Select a game mode below</p>
      </div>
      <div className='mode-selection'>
        {
          modes.map((mode, index) => (
            <div className='mode-card' key={index}>
              <img src={mode.logo} alt={`${mode.name} logo`} className='mode-logo' />
              <h2 className='mode-name'>{mode.name}</h2>
              <p className='mode-description'>{mode.description}</p>
              <button className='mode-button'>Play Now!</button>
            </div>
          ))
        }
      </div>
      <div className='misc-tools'>
        <p>settings</p>
      </div>
    </div>
  )
}

export default GameMainpage;