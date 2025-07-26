import React, { useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { motion } from "motion/react";
import "../../styles/contactform.css";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { setError } from "../../redux/errorSlice";

const ContactForm = () => {
  const user = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    name: "",
    username: user.isAuthenticated ? user.username : "",
    email: user.isAuthenticated ? user.email : "",
    subject: "",
    message: ""
  });

  const [sending, setSending] = useState<boolean>(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value
    }));
  };

  const isValidEmail = (email) => {
    return true;
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValidEmail(formData.email)) {
      dispatch(
        setError({
          errorMessage: "Please enter a valid email address.",
          success: false
        })
      );
      return;
    }

    try {
      setSending(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/settings/contact`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(formData)
        }
      );
      if (response.ok) {
        dispatch(
          setError({
            errorMessage: "Your message has been sent!",
            success: true
          })
        );
        setFormData({
          name: "",
          username: user.username,
          email: user.email,
          subject: "",
          message: ""
        });
      } else {
        const errorData = await response.json();
        dispatch(
          setError({
            errorMessage:
              errorData.message ||
              "Failed to send your message. Please try again later.",
            success: false
          })
        );
      }
    } catch (error) {
      dispatch(
        setError({
          errorMessage:
            error.message ||
            "Failed to send your message. Please try again later or email us directly.",
          success: false
        })
      );
    }

    setSending(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="contact-form-container">
        <h2>Contact Us</h2>
        <div className="send-email-container">
          <a>Email us at:&nbsp;</a>
          <a className="send-email-prompt" href="mailto:email@example.com">
            therizzquiz@gmail.com
          </a>
        </div>
        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              name="username"
              id="username"
              value={formData.username}
              onChange={handleChange}
              disabled={user.isAuthenticated}
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={user.isAuthenticated}
            />
          </div>
          <div className="form-group">
            <label htmlFor="subject">Subject:</label>
            <input
              type="text"
              name="subject"
              id="subject"
              value={formData.subject}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="message">Message:</label>
            <textarea
              name="message"
              id="message"
              value={formData.message}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className={sending ? "disabled" : ""}>
            Send Message
            {sending && (
              <>
                &nbsp;
                <motion.div
                  className="loading-icon-container"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                >
                  <AiOutlineLoading3Quarters
                    className="loading-icon"
                    style={{
                      fontSize: "1.2rem",
                      marginLeft: "5px",
                      marginRight: "5px"
                    }}
                  />
                </motion.div>
              </>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default ContactForm;
