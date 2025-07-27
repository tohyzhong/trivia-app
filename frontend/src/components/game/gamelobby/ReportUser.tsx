import React, { useEffect } from "react";
import "../../../styles/userreport.css";
import { IoClose } from "react-icons/io5";
import { useDispatch } from "react-redux";
import { setError } from "../../../redux/errorSlice";
import { motion } from "framer-motion";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

interface ReportUserProps {
  setActive?: (active: boolean) => void;
  username: string;
  lobbyId: string;
}

const ReportUser: React.FC<ReportUserProps> = ({
  username,
  setActive,
  lobbyId
}) => {
  const reportTypes = () => {
    return [
      "Inappropriate Username",
      "Cheating",
      "Harassment or Abusive Communications",
      "Spam"
    ];
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.closest(".report-user-container-full") &&
        !target.closest(".report-content")
      ) {
        setActive?.(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  });

  const dispatch = useDispatch();
  const [reportSending, setReportSending] = React.useState(false);
  const handleReportSubmit = async () => {
    // TODO: Implement report submission logic for different report types
    setReportSending(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/profile/report`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            reported: username,
            source: "lobby",
            lobbyId,
            reasons: selectedReasons
          })
        }
      );

      const data = await response.json();
      if (response.ok) {
        dispatch(
          setError({
            errorMessage: "User reported successfully.",
            success: true
          })
        );
      } else {
        dispatch(
          setError({
            errorMessage: `Failed to report user: ${data.message}`,
            success: false
          })
        );
      }
    } catch (err) {
      console.error("Error reporting user:", err);
      dispatch(
        setError({
          errorMessage: `Error reporting user: ${String(err)}`,
          success: false
        })
      );
    }
    setReportSending(false);
    setActive(false);
  };

  // Handle report reason selections
  const [selectedReasons, setSelectedReasons] = React.useState<string[]>([]);
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;
    if (checked) {
      setSelectedReasons((prev) => [...prev, value]);
    } else {
      setSelectedReasons((prev) => prev.filter((reason) => reason !== value));
    }
  };

  return (
    <div className="report-user-container-full">
      <div className="report-overlay">
        <div className="report-content">
          <IoClose
            className="report-close-button"
            onClick={() => setActive(false)}
          />
          <h2 className="report-header">Report User {username}</h2>
          <div className="report-reasons">
            {reportTypes().map((type, index) => (
              <div key={index} className="report-reason">
                <input
                  type="checkbox"
                  id={`reason-${index}`}
                  value={type}
                  onChange={handleChange}
                />
                <label htmlFor={`reason-${index}`}>{type}</label>
              </div>
            ))}
          </div>
          <button
            className={`report-send-button ${reportSending && "disabled"}`}
            onClick={handleReportSubmit}
          >
            Report Player
            {reportSending && (
              <>
                &nbsp;
                <motion.div
                  className="loading-icon-container"
                  animate={{ rotate: 360 }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                    ease: "linear"
                  }}
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
        </div>
      </div>
    </div>
  );
};

export default ReportUser;
