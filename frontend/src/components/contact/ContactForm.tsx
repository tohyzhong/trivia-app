import React, { useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { motion } from "motion/react";
import "../../styles/contactform.css";
import ErrorPopup from "../authentication/subcomponents/ErrorPopup";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";

const ContactForm = () => {
  const user = useSelector((state: RootState) => state.user);

  const [formData, setFormData] = useState({
    name: "",
    username: user.isAuthenticated ? user.username : "",
    email: user.isAuthenticated ? user.email : "",
    subject: "",
    message: ""
  });

  const [approvalMessage, setApprovalMessage] = useState("");
  const [isApprovalSuccess, setIsApprovalSuccess] = useState(false);
  const [sending, setSending] = useState<boolean>(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value
    }));
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValidEmail(formData.email)) {
      setIsApprovalSuccess(false);
      setApprovalMessage("Please enter a valid email address.");
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
        setIsApprovalSuccess(true);
        setApprovalMessage("Your message has been sent!");
        setFormData({
          name: "",
          username: user.username,
          email: user.email,
          subject: "",
          message: ""
        });
      } else {
        setIsApprovalSuccess(false);
        const errorData = await response.json();
        setApprovalMessage(
          errorData.message ||
            "Failed to send your message. Please try again later."
        );
      }
    } catch (error) {
      setIsApprovalSuccess(false);
      setApprovalMessage(
        error.message ||
          "Failed to send your message. Please try again later or email us directly."
      );
    }

    setSending(false);
  };

  return (
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
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Username:</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            disabled={user.isAuthenticated}
          />
        </div>
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={user.isAuthenticated}
          />
        </div>
        <div className="form-group">
          <label>Subject:</label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Message:</label>
          <textarea
            name="message"
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
                <AiOutlineLoading3Quarters className="loading-icon" />
              </motion.div>
            </>
          )}
        </button>
      </form>
      <ErrorPopup
        message={approvalMessage}
        setMessage={setApprovalMessage}
        success={isApprovalSuccess}
      />
    </div>
  );
};

export default ContactForm;
