import React, { useEffect } from 'react'
import { motion } from 'motion/react';
import '../../../styles/modeselect.css';
import { IoClose } from "react-icons/io5";

interface SubMode {
  name: string;
  description: string
  image: string;
}

interface ModeSelectProps {
  mode: string;
  submodes: SubMode[];
  setActive: (active: boolean) => void;
}

const submodeSelect: React.FC<ModeSelectProps> = (props) => {
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('.submode-select-container-full') && !target.closest('.submode-select-container')) {
        props.setActive(false);
      }
    } 

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    }
  }, []);

  return (
    <motion.div 
      className='submode-select-container-full'
      initial={{ opacity: 0, y: '-20%' }}
      animate={{ opacity: 1, y: '0%', transition: { duration: 0.3 } }}
    >
      <div className='submode-select-container'>
        <div className='submode-select-header'>
          <h3>{props.mode}</h3>
          <IoClose className='submode-select-close' onClick={() => props.setActive(false)}/>
        </div>
        <div className='submode-select-content'>
          {props.submodes.map((submode, index) => (
            <div key={index} className='submode-select-item'>
              <h4 className='submode-item-header'>{submode.name}</h4>
              <img src={submode.image} alt={`${submode.name} logo`} className='submode-select-image' />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export default submodeSelect