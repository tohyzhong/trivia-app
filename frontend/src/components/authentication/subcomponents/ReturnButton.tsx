import React from "react";
import { Link } from "react-router-dom";

const ReturnButton: React.FC = () => {
  return (
    <Link className="back-button" to="/" style={{ textDecoration: "none" }}>
      Back
    </Link>
  );
};

export default ReturnButton;
