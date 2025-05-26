import React, { FormEvent, useEffect } from 'react';
import '../../styles/forgotpassword.css';
import { ReturnButton } from './ReturnButton';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');

  // Check if OTP has been sent
  const [OTPSent, setOTPSent] = React.useState(false);

  // For OTP input and verification
  const [OTPInput, setOTPInput] = React.useState(new Array(6).fill(''));
  const [OTP, setOTP] = React.useState(123456); // Placeholder

  // Post-verification
  const [verified, setVerified] = React.useState(false);

  const handleOTPChange = (index, value) => {
    const newOTPInput = [...OTPInput];
    newOTPInput[index] = value;
    setOTPInput(newOTPInput);

    if (value && index < OTPInput.length - 1) {
      const nextInput = document.querySelector(`input:nth-child(${index + 2})`);
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
      }
    }
  }

  // For debugging purposes
  useEffect(() => {
    console.log('OTPInput:', OTPInput);
  }, [OTPInput]);

  const handleOTPKeyDown = (e, index) => {
    if (e.key !== 'Backspace' && e.key !== 'Delete') return;
    if (e.target.value === '' && index > 0) {
      const prevInput = document.querySelector(`input:nth-child(${index})`);
      if (prevInput) {
        (prevInput as HTMLInputElement).focus();
      }
    }
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch('/api/auth/forgotpassword', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    const data = await res.json();

    if (res.ok) {
      console.log(data.otp)
      setOTP(data.otp);
      setOTPSent(true);
    } else {
      alert(data.error || 'Failed to send OTP');
    }
  }

  // Debugging
  useEffect(() => {
    console.log('OTPInput:', OTPInput);
  }, [OTPInput]);

  const verifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    const enteredOTP = OTPInput.join('');
    if (enteredOTP !== OTP.toString()) {
      alert('Invalid OTP. Please try again.');
      return;
    } else {
      alert('Successfully verified OTP.');
      setVerified(true);
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const newPassword = (form.elements[0] as HTMLInputElement).value;
    const confirmPassword = (form.elements[1] as HTMLInputElement).value;

    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    const res = await fetch('/api/auth/resetpassword', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: newPassword }),
    });

    const data = await res.json();

    if (res.ok) {
      alert('Password reset successfully. Redirecting to Login Page...');
      navigate('/login');
    } else {
      alert(data.error || 'Failed to reset password');
    }
  }

  return verified ? (
    <div className="password-reset-page">
      <div className="form-container">
        <form onSubmit={handlePasswordReset}>
          <h3>Password Reset</h3>
          <p>OTP verified successfully!</p>
          <input
            type="password"
            placeholder="New Password"
            required
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            required
          />
          <div className='buttons-container'>
            <ReturnButton />
            <button type="submit" className='submit-button'>Reset Password</button>
          </div>
        </form>
      </div>
    </div>
  ) : !OTPSent ? (
    <div className="password-reset-page">
      <div className="form-container">
        <form onSubmit={handleSendOTP}>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
          <div className='buttons-container'>
            <ReturnButton />
            <button type="submit" className='submit-button'>Send OTP</button>
          </div>
        </form>
      </div>
    </div>
  ) : (
    <div className="password-reset-page">
      <div className="form-container">
        <form onSubmit={verifyOTP}>
          <h3>Email Verification</h3>
          <p>A 6-digit OTP has been sent to your email</p>
          <div className='otp-input'>
            {OTPInput.map((digit, index) => (
              <input
                key={index}
                className='otp-input-box'
                type="text"
                value={digit}
                onChange={(e) => handleOTPChange(index, e.target.value)}
                onKeyDown={(e) => handleOTPKeyDown(e, index)}
                maxLength={1}
                required
              />
            ))}
          </div>
          <div className='buttons-container'>
            <ReturnButton />
            <button type="submit" className='submit-button'>Submit OTP</button>
          </div>
        </form>
      </div>
    </div>
  )
};

export default LoginPage;