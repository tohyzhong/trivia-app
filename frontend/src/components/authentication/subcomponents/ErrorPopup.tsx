import React from 'react'
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
    <div className='invalid-token'>
      <IoIosInformationCircle className='information-icon' />
      <p>{message}</p>
      <RxCross2 type='button' className='close-icon' onClick={() => setMessage('')} />
    </div>
  )
}

export default ErrorPopup