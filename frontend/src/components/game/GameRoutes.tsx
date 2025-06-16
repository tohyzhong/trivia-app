import React from 'react'
import { Route, Routes } from 'react-router-dom';
import GameMainpage from './GameMainpage';
import QuizHandler from './solomode/QuizHandler';

const GameRoutes = () => {
  return (
    <Routes>
      <Route path='/' element={<GameMainpage />} />
      <Route path='/:lobbyId' element={<QuizHandler />} />
    </Routes>
  )
}

export default GameRoutes