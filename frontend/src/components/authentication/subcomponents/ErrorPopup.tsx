import React from "react";
import { motion } from "motion/react";
import { IoIosInformationCircle } from "react-icons/io";
import { RxCross2 } from "react-icons/rx";
import "../../../styles/errorpopup.css";
import { clearError } from "../../../redux/errorSlice";
import { useDispatch } from "react-redux";

interface Props {
  message: string;
  success?: boolean;
}

const ErrorPopup: React.FC<Props> = ({ message, success = false }) => {
  if (!message) {
    return null;
  } else {
    const dispatch = useDispatch();
    return (
      <motion.div
        className={`invalid-token ${success ? "success" : ""}`}
        initial={{ opacity: 0, y: "-20%", x: "-50%" }}
        animate={{
          opacity: 1,
          y: "0%",
          x: "-50%",
          transition: { duration: 0.3 }
        }}
      >
        <IoIosInformationCircle className="information-icon" />
        <p>{message}</p>
        <RxCross2
          type="button"
          className="close-icon"
          onClick={() => dispatch(clearError())}
        />
      </motion.div>
    );
  }
};

export default ErrorPopup;
