import React, { useEffect } from "react";
import { motion } from "motion/react";
import ReactMarkdown from "react-markdown";
import { IoClose } from "react-icons/io5";

interface ExplanationProps {
  setActive: (active: boolean) => void;
  explanation: string; // in markdown
}

const Explanation: React.FC<ExplanationProps> = ({
  explanation,
  setActive
}) => {
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.closest(".explanation-popup-full") &&
        !target.closest(".explanation-popup")
      ) {
        setActive(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  return (
    <motion.div
      className="explanation-popup-full"
      initial={{ opacity: 0, y: "-20%" }}
      animate={{ opacity: 1, y: "0%", transition: { duration: 0.3 } }}
    >
      <div className="explanation-popup">
        <IoClose
          className="explanation-popup-close"
          onClick={() => setActive(false)}
        />
        <ReactMarkdown>{explanation}</ReactMarkdown>
      </div>
    </motion.div>
  );
};

export default Explanation;
