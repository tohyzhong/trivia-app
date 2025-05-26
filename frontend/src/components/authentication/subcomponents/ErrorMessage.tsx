import React from 'react'
import { IoIosInformationCircle } from "react-icons/io";
import { RxCross2 } from "react-icons/rx";
import { useEffect } from 'react';

interface Props {
  message: string;
}

const ErrorMessage: React.FC<Props> = (props) => {
  const [message, setMessage] = React.useState(props.message);
  if (!message) {
    return null;
  } else return (
    <div className='invalid-token'>
      <IoIosInformationCircle className='information-icon' />
      <p>{message}</p>
      <RxCross2 type='button' className='close-icon' onClick={() => setMessage('')} />
    </div>
  )
}

export default ErrorMessage