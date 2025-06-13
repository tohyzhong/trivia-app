import React from 'react'
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
  active: boolean;
  setActive: (active: boolean) => void;
}

const submodeSelect: React.FC<ModeSelectProps> = (props) => {
  return (
    <div className='submode-select-container-full'>
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
    </div>
  )
}

export default submodeSelect