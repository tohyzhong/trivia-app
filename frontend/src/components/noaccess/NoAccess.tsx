import React from "react";
import "../../styles/noaccess.css";
import { Link } from "react-router-dom";

const NoAccess: React.FC = () => {
  return (
    <div className="no-access-container">
      <h1 className="no-access-header">Access Denied</h1>
      <p className="no-access-text">
        You do not have permission to view this page or the page does not exist.
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
  );
};

export default NoAccess;
