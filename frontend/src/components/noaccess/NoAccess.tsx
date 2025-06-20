import React from "react";
import "../../styles/noaccess.css";

const NoAccess: React.FC = () => {
  return (
    <div className="no-access-container">
      <h1 className="no-access-header">Access Denied</h1>
      <p className="no-access-text">
        You do not have permission to view this page or the page does not exist.
      </p>
      <p className="no-access-text">
        Please{" "}
        <a className="contact-support" href="/">
          contact support
        </a>{" "}
        if you believe this is an error.
      </p>
      <a className="return-button" href="/">
        Go to Home
      </a>
    </div>
  );
};

export default NoAccess;
