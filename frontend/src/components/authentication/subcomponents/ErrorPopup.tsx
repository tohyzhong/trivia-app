import React, { useState } from "react";
import { motion } from "motion/react";
import { IoIosInformationCircle } from "react-icons/io";
import { RxCross2 } from "react-icons/rx";
import "../../../styles/errorpopup.css";

interface Props {
  message: string;
  setMessage: (message: string) => void; // Optional setter for message
}

const ErrorPopup: React.FC<Props> = (props) => {
  if (!props.message) {
    return null;
  } else
    return (
      <motion.div
        className="invalid-token"
        initial={{ opacity: 0, y: "-20%", x: "-50%" }}
        animate={{
          opacity: 1,
          y: "0%",
          x: "-50%",
          transition: { duration: 0.3 },
        }}
      >
        <IoIosInformationCircle className="information-icon" />
        <p>{props.message}</p>
        <RxCross2
          type="button"
          className="close-icon"
          onClick={() => props.setMessage("")}
        />
      </motion.div>
    );
};

export default ErrorPopup;
