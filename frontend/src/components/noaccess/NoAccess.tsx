import React from "react";
import "../../styles/noaccess.css";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const NoAccess: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="no-access-container">
        <h1 className="no-access-header">Access Denied</h1>
        <p className="no-access-text">
          You do not have permission to view this page or the page does not
          exist.
        </p>
        <p className="no-access-text">
          Please{" "}
          <Link className="contact-support" to="/contact">
            contact support
          </Link>{" "}
          if you believe this is an error.
        </p>
        <Link className="return-button" to="/">
          Go to Home
        </Link>
      </div>
    </motion.div>
  );
};

export default NoAccess;
