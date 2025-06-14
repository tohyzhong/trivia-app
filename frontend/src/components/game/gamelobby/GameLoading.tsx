import React from 'react'
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { motion } from 'motion/react';
import '../../../styles/gamelobby.css'

const GameLoading = () => {
  console.log('loading')
  return (
    <div className="loader-full">
      <motion.div 
        className='loading-icon-container'
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
      >
        <AiOutlineLoading3Quarters className='loading-icon'/>
      </motion.div>
      <h1>Loading Lobby . . .</h1>
    </div>
  )
}

export default GameLoading