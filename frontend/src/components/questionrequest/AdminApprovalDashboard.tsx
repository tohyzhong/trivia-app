import React, { useState, useEffect } from "react";
import "../../styles/adminapprovaldashboard.css";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import NoAccess from "../noaccess/NoAccess";
import { motion } from "framer-motion";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { setError } from "../../redux/errorSlice";

interface ClassicQuestion {
  type: "classic";
  _id: string;
  question: string;
  options?: string[];
  correctOption: number;
  explanation?: string;
  category?: string;
  difficulty: number;
  approved?: boolean;
  createdBy?: string;
  approvedBy?: string;
}

interface KnowledgeQuestion {
  type: "knowledge";
  _id: string;
  question: string;
  correctOption: string;
  difficulty: number;
  approved?: boolean;
  createdBy?: string;
  approvedBy?: string;
}

const AdminApprovalDashboard: React.FC = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user);
  const role = user.role;

  const availableModes = ["Classic", "Knowledge"];
  const [currentMode, setCurrentMode] = useState<string>("Classic");
  const [searchMode, setSearchMode] = useState<string>("Classic");

  const [classicQuestions, setClassicQuestions] = useState<ClassicQuestion[]>(
    []
  );
  const [knowledgeQuestions, setKnowledgeQuestions] = useState<
    KnowledgeQuestion[]
  >([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [manualCategories, setManualCategories] = useState<{
    [key: string]: string;
  }>({});
  const [showManualPopup, setShowManualPopup] = useState(false);
  const [editedDifficulties, setEditedDifficulties] = useState<{
    [key: string]: number;
  }>({});
  const [pendingApprovalId, setPendingApprovalId] = useState<string | null>(
    null
  );
  const [showRejectPopup, setShowRejectPopup] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [pendingRejectId, setPendingRejectId] = useState<string | null>(null);
  const [approvingIds, setApprovingIds] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [rejectingIds, setRejectingIds] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [selectedCategories, setSelectedCategories] = useState<{
    [key: string]: string;
  }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    ClassicQuestion[] | KnowledgeQuestion[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<
    ClassicQuestion | KnowledgeQuestion | null
  >(null);

  // Fetching questions that are not approved, and categories for admin to select
  useEffect(() => {
    const fetchData = async () => {
      if (!currentMode) return;
      setIsLoading(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/questions/fetch-${currentMode.toLowerCase()}`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch initial questions and categories");
        }
        const data = await response.json();
        if (currentMode === "Classic") setClassicQuestions(data.questions);
        else setKnowledgeQuestions(data.questions);
        setCategories(
          data.categories.filter((cat: string) => cat !== "Community")
        );
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentMode]);

  // Searchbar for admin to search through preexisting questions and options
  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedQuestion(null);
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === "") {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/questions/search-${searchMode.toLowerCase()}?searchQuery=${query}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
      if (!response.ok) {
        throw new Error("Failed to search questions");
      }
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Error searching for questions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionClick = (
    question: ClassicQuestion | KnowledgeQuestion
  ) => {
    setSelectedQuestion((prevState) =>
      prevState?._id === question._id ? null : question
    );
  };

  const generateQuestionDisplay = () => {
    if (selectedQuestion.type === "classic") {
      return (
        <div className="question-details-request">
          <h3>Question Details</h3>
          <p className="question-text-request">
            <strong>Question:</strong> {selectedQuestion.question}
          </p>
          <p className="category-text-request">
            <strong>Category:</strong> {selectedQuestion.category}
          </p>
          <p className="difficulty-text-request">
            <strong>Difficulty:</strong> {selectedQuestion.difficulty}
          </p>
          <p className="options-label-request">
            <strong>Options:</strong>
          </p>
          <ul className="options-list-request">
            {selectedQuestion.options.map((option: string, index: number) => (
              <li key={index}>{option}</li>
            ))}
          </ul>
          <p className="correct-option-request">
            <strong>Correct Option:</strong>{" "}
            {selectedQuestion.options[selectedQuestion.correctOption - 1]}
          </p>
        </div>
      );
    } else if (selectedQuestion.type === "knowledge") {
      return (
        <div className="question-details-request">
          <h3>Question Details</h3>
          <p className="question-text-request">
            <strong>Image:</strong>
            <img
              src={selectedQuestion.question}
              style={{ display: "block", marginTop: "10px", height: "300px" }}
            />
          </p>
          <p className="difficulty-text-request">
            <strong>Difficulty:</strong> {selectedQuestion.difficulty}
          </p>
          <p className="options-label-request">
            <strong>Answer:</strong> {selectedQuestion.correctOption}
          </p>
        </div>
      );
    }
  };

  const handleCategoryChange = (questionId: string, selectedValue: string) => {
    setSelectedCategories((prev) => ({
      ...prev,
      [questionId]: selectedValue
    }));
  };

  const handleApprove = async (questionId: string) => {
    if (currentMode === "Classic") {
      const selectedCat = selectedCategories[questionId];

      if (selectedCat === "Other") {
        setPendingApprovalId(questionId);
        setShowManualPopup(true);
        return;
      }

      if (!selectedCat?.trim()) {
        dispatch(
          setError({
            errorMessage: "Please select a category.",
            success: false
          })
        );
        return;
      }

      await sendApproval(questionId, selectedCat);
    } else if (currentMode === "Knowledge") {
      await sendApproval(questionId, null);
    }
  };

  const sendApproval = async (questionId: string, categoryToUse: string) => {
    const difficultyToUse =
      editedDifficulties[questionId] ??
      (currentMode === "Classic"
        ? classicQuestions.find((q) => q._id === questionId)?.difficulty
        : knowledgeQuestions.find((q) => q._id === questionId)?.difficulty);

    if (
      difficultyToUse === undefined ||
      difficultyToUse === null ||
      isNaN(difficultyToUse) ||
      difficultyToUse < 1 ||
      difficultyToUse > 5
    ) {
      dispatch(
        setError({
          errorMessage: "Please enter a valid difficulty between 1 and 5.",
          success: false
        })
      );
      return;
    }

    setApprovingIds((prev) => ({ ...prev, [questionId]: true }));

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/questions/approve-${currentMode.toLowerCase()}/${questionId}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: categoryToUse,
            difficulty: difficultyToUse
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Approval failed: ${response.status}`);
      }

      if (currentMode === "Classic") {
        setClassicQuestions((prev) => prev.filter((q) => q._id !== questionId));

        setManualCategories((prev) => {
          const updated = { ...prev };
          delete updated[questionId];
          return updated;
        });
        setSelectedCategories((prev) => {
          const updated = { ...prev };
          delete updated[questionId];
          return updated;
        });
      } else {
        setKnowledgeQuestions((prev) =>
          prev.filter((q) => q._id !== questionId)
        );
      }

      setShowManualPopup(false);
      setPendingApprovalId(null);
      dispatch(
        setError({
          errorMessage: "Question approved successfully!",
          success: true
        })
      );
    } catch (error) {
      console.error("Error approving:", error);
      dispatch(
        setError({
          errorMessage: "Failed to approve question. Please try again.",
          success: false
        })
      );
    } finally {
      setApprovingIds((prev) => {
        const updated = { ...prev };
        delete updated[questionId];
        return updated;
      });
    }
  };

  const handleReject = (questionId: string) => {
    setPendingRejectId(questionId);
    setRejectReason("");
    setShowRejectPopup(true);
  };

  const sendRejection = async (questionId: string, reason: string) => {
    setRejectingIds((prev) => ({ ...prev, [questionId]: true }));

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/questions/reject-${currentMode.toLowerCase()}/${questionId}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ reason })
        }
      );

      if (!response.ok) {
        throw new Error("Failed to reject question");
      }

      currentMode === "Classic"
        ? setClassicQuestions((prev) =>
            prev.filter((q) => q._id !== questionId)
          )
        : setKnowledgeQuestions((prev) =>
            prev.filter((q) => q._id !== questionId)
          );
      dispatch(
        setError({
          errorMessage: "Question rejected successfully.",
          success: true
        })
      );
    } catch (error) {
      console.error("Error rejecting question:", error);
      dispatch(
        setError({
          errorMessage: "Failed to reject question. Please try again.",
          success: false
        })
      );
    } finally {
      setRejectingIds((prev) => {
        const updated = { ...prev };
        delete updated[questionId];
        return updated;
      });
    }
  };

  const columnDefs: ColDef<ClassicQuestion | KnowledgeQuestion>[] = [
    {
      headerName: "Question",
      field: "question",
      flex: 3,
      cellStyle: {
        cursor: "pointer",
        textDecoration: "underline",
        wordBreak: "break-word",
        textAlign: "center"
      },
      autoHeight: true,
      wrapText: true,
      filter: true
    },
    currentMode === "Classic"
      ? {
          headerName: "Category",
          field: "category",
          sortable: false,
          maxWidth: 180,
          flex: 2,
          cellStyle: {
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: "8px"
          },
          cellRenderer: (params) => {
            const id = params.data._id;
            return (
              <div>
                <select
                  className="category-select"
                  value={selectedCategories[id] || params.data.category}
                  onChange={(e) => handleCategoryChange(id, e.target.value)}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="Other">Other</option>
                </select>
              </div>
            );
          }
        }
      : {
          headerName: "Answer",
          field: "correctOption",
          sortable: false,
          maxWidth: 180,
          flex: 2,
          cellStyle: {
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: "8px"
          }
        },
    {
      headerName: "Difficulty",
      field: "difficulty",
      editable: true,
      maxWidth: 100,
      flex: 1,
      cellStyle: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center"
      },
      cellRenderer: (params) => {
        const id = params.data._id;
        const value = editedDifficulties[id] ?? params.data.difficulty;

        return (
          <input
            type="number"
            min={1}
            max={5}
            value={value}
            onChange={(e) => {
              const num = parseInt(e.target.value);
              setEditedDifficulties((prev) => ({
                ...prev,
                [id]: isNaN(num) ? value : num
              }));
            }}
            onClick={(e) => e.stopPropagation()}
            className="category-select"
            style={{
              textAlign: "center",
              width: "100%",
              borderColor:
                value < 1 || value > 5 || isNaN(value) ? "red" : "#ccc"
            }}
          />
        );
      }
    },
    {
      headerName: "Actions",
      maxWidth: 250,
      sortable: false,
      flex: 1,
      cellStyle: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center"
      },
      cellRenderer: (params) => (
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className="approve-button loading-button"
            onClick={() => handleApprove(params.data._id)}
            disabled={!!approvingIds[params.data._id]}
          >
            {approvingIds[params.data._id] ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="loading-icon-wrapper"
              >
                <AiOutlineLoading3Quarters className="loading-icon" />
              </motion.div>
            ) : (
              "Approve"
            )}
          </button>

          <button
            className="reject-button loading-button"
            onClick={() => handleReject(params.data._id)}
            disabled={!!rejectingIds[params.data._id]}
          >
            {rejectingIds[params.data._id] ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="loading-icon-wrapper"
              >
                <AiOutlineLoading3Quarters className="loading-icon" />
              </motion.div>
            ) : (
              "Reject"
            )}
          </button>
        </div>
      )
    }
  ];

  return role.includes("admin") ? (
    <div className="admin-approval-dashboard">
      <h2 className="admin-header">Admin Question Approval</h2>
      <div className="buttons-container">
        {availableModes.map((mode) => (
          <button
            className={`mode-select-buttons ${mode === searchMode ? "selected" : ""}`}
            onClick={() => {
              setSearchMode(mode);
              setSearchQuery("");
              setSearchResults([]);
            }}
          >
            {mode}
          </button>
        ))}
      </div>
      <br />

      <input
        type="text"
        value={searchQuery}
        onChange={handleSearch}
        placeholder="Search questions or options"
        className="search-input"
      />

      <div className="search-results">
        {isLoading && <p>Loading...</p>}
        <ul className="search-results-list">
          {searchResults.map((result) => (
            <li
              key={result._id}
              onClick={() => handleQuestionClick(result)}
              className="search-result-item"
            >
              {searchMode === "Classic"
                ? result.question
                : result.correctOption}
            </li>
          ))}
        </ul>
      </div>

      {selectedQuestion && generateQuestionDisplay()}

      <div className="unapproved-questions">
        {showManualPopup && pendingApprovalId && (
          <div className="manual-category-popup-overlay">
            <div className="manual-category-popup">
              <h3>Enter Manual Category</h3>
              <input
                type="text"
                value={manualCategories[pendingApprovalId] || ""}
                onChange={(e) =>
                  setManualCategories((prev) => ({
                    ...prev,
                    [pendingApprovalId]: e.target.value
                  }))
                }
                placeholder="Type category name..."
              />
              <div className="popup-actions">
                <button
                  onClick={() => {
                    const value = manualCategories[pendingApprovalId]?.trim();
                    if (!value) {
                      dispatch(
                        setError({
                          errorMessage: "Please enter a category.",
                          success: false
                        })
                      );
                      return;
                    }
                    setShowManualPopup(false);
                    setPendingApprovalId(null);
                    sendApproval(pendingApprovalId, value);
                  }}
                  className="approve-button"
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    setShowManualPopup(false);
                    setPendingApprovalId(null);
                  }}
                  className="reject-button"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {showRejectPopup && pendingRejectId && (
          <div className="manual-category-popup-overlay">
            <div className="manual-category-popup">
              <h3>Reason for Rejection</h3>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Optional: Add a brief explanation"
                style={{
                  width: "100%",
                  minHeight: "100px",
                  padding: "10px",
                  fontSize: "14px"
                }}
              />
              <div className="popup-actions">
                <button
                  onClick={() => {
                    sendRejection(pendingRejectId, rejectReason);
                    setShowRejectPopup(false);
                    setPendingRejectId(null);
                  }}
                  className="reject-button"
                >
                  Reject
                </button>
                <button
                  onClick={() => {
                    setShowRejectPopup(false);
                    setPendingRejectId(null);
                  }}
                  className="approve-button"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        <h3>Unapproved Community Questions</h3>
        <div className="buttons-container">
          {availableModes.map((mode) => (
            <button
              className={`mode-select-buttons ${mode === currentMode ? "selected" : ""}`}
              onClick={() => setCurrentMode(mode)}
            >
              {mode}
            </button>
          ))}
        </div>
        {isLoading ? (
          <p>Loading...</p>
        ) : (currentMode === "Classic"
            ? classicQuestions.length
            : knowledgeQuestions.length) === 0 ? (
          <p>You have no unapproved questions.</p>
        ) : (
          <div className="ag-theme-alpine unapproved-questions-grid">
            <AgGridReact
              rowData={
                currentMode === "Classic"
                  ? classicQuestions
                  : knowledgeQuestions
              }
              columnDefs={columnDefs}
              pagination={true}
              paginationPageSize={10}
              paginationPageSizeSelector={[10, 20, 50]}
              domLayout="autoHeight"
              onCellClicked={(params) => {
                if (params.colDef.field === "question") {
                  handleQuestionClick(params.data);
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  ) : (
    <NoAccess />
  );
};

export default AdminApprovalDashboard;
