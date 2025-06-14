import React from 'react'
import { Route, Routes } from 'react-router-dom';
import GameMainpage from './GameMainpage';
import SoloGameRouteHandler from './solomode/SoloGameRouteHandler';

const GameRoutes = () => {
  return (
    <Routes>
      <Route path='/' element={<GameMainpage />} />
      <Route path='/:id' element={<SoloGameRouteHandler />} />
    </Routes>
  )
}

export default GameRoutes