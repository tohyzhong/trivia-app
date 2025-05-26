import React from 'react'
import { useNavigate } from 'react-router-dom';

export const ReturnButton: React.FC = () => {
  const navigate = useNavigate();
  const handleBack = () => {
    navigate('/');
  }

  return (
    <a className='back-button' onClick={handleBack}>Back</a>
  )
}
