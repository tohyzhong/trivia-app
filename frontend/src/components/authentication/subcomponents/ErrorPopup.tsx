import React from 'react'
import { motion } from 'motion/react';
import { IoIosInformationCircle } from "react-icons/io";
import { RxCross2 } from "react-icons/rx";

interface Props {
  message: string;
}

const ErrorPopup: React.FC<Props> = (props) => {
  const [message, setMessage] = React.useState(props.message);
  if (!message) {
    return null;
  } else return (
    <motion.div 
      className='invalid-token'
      initial={{ opacity: 0, y: '-20%', x: '-50%'}}
      animate={{ opacity: 1, y: '0%', x: '-50%', transition: { duration: 0.3 }}}
    >
      <IoIosInformationCircle className='information-icon' />
      <p>{message}</p>
      <RxCross2 type='button' className='close-icon' onClick={() => setMessage('')} />
    </motion.div>
  )
}

export default ErrorPopup