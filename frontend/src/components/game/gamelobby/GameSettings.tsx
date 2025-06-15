import React, { useEffect } from 'react'

interface GameSetting {
  numQuestions: number,
  timePerQuestion: number,
  difficulty: number, 
  categories: string[],
}

interface GameSettingsProps {
  gameSettings: GameSetting;
}

const GameSettings: React.FC<GameSettingsProps> = (props) => {
  const { gameSettings } = props;

  const handleSaveSettings = async () => {
    // TODO
  }

  return (
    <div className='game-lobby-settings'>
      <div className='game-lobby-settings-header'>
        <h1>Game Settings</h1>
      </div>
      <div className='game-lobby-settings-content'>
        <div className='game-lobby-settings-item'>
          <label>Number of Questions:</label>
          <span>{gameSettings.numQuestions}</span>
        </div>
        <div className='game-lobby-settings-item'>
          <label>Time Limit:</label>
          <span>{gameSettings.timePerQuestion} seconds</span>
        </div>
        <div className='game-lobby-settings-item'>
          <label>Difficulty:</label>
          <span>{gameSettings.difficulty}</span>
        </div>
        <div className='game-lobby-settings-item'>
          <label>Categories:</label>
          <span>{gameSettings.categories.join(', ')}Standard</span>
        </div>
      </div>
      <div className='game-lobby-settings-footer'>
        <button className='save-settings-button' onClick={handleSaveSettings}>Save Settings</button>
      </div>
    </div>
  )
}

export default GameSettings