import React from 'react'
import '../../styles/noaccess.css'

const NoAccess: React.FC = () => {
  return (
    <div className='no-access-container'>
      <h1 className='no-access-header'>Access Denied</h1>
      <p className='no-access-text'>You do not have permission to view this page.</p>
      <p className='no-access-text'>Please contact support if you believe this is an error.</p>
      <a className='return-button' href="/">Go to Home</a>
    </div>
  )
}

export default NoAccess