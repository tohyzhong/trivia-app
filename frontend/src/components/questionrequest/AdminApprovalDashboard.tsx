import React, { useState, useEffect } from "react";
import "../../styles/adminapprovaldashboard.css";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import ErrorPopup from "../authentication/subcomponents/ErrorPopup";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import NoAccess from "../noaccess/NoAccess";

interface Question {
  _id: string;
  question: string;
  options: string[];
  correctOption: number;
  explanation: string;
  category: string;
  difficulty: number;
  approved?: boolean;
  createdBy?: string;
  approvedBy?: string;
}

const AdminApprovalDashboard: React.FC = () => {
  const user = useSelector((state: RootState) => state.user);
  const role = user.role;
  console.log(user);

  const [approvalMessage, setApprovalMessage] = useState("");
  const [isApprovalSuccess, setIsApprovalSuccess] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [manualCategories, setManualCategories] = useState<{
    [key: string]: string;
  }>({});
  const [showManualPopup, setShowManualPopup] = useState(false);
  const [pendingApprovalId, setPendingApprovalId] = useState<string | null>(
    null
  );
  const [selectedCategories, setSelectedCategories] = useState<{
    [key: string]: string;
  }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any | null>(null);

  // Fetching questions that are not approved, and categories for admin to select
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/questions/initial`,
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
        setQuestions(data.questions);
        setCategories(
          data.categories.filter((cat: string) => cat !== "Community")
        );
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

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
        `${import.meta.env.VITE_API_URL}/api/questions/search?searchQuery=${query}`,
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

  const handleQuestionClick = (question: any) => {
    setSelectedQuestion((prevState) =>
      prevState?._id === question._id ? null : question
    );
  };

  const handleCategoryChange = (questionId: string, selectedValue: string) => {
    setSelectedCategories((prev) => ({
      ...prev,
      [questionId]: selectedValue
    }));
  };

  const handleApprove = async (questionId: string) => {
    const selectedCat = selectedCategories[questionId];

    if (selectedCat === "Other") {
      setPendingApprovalId(questionId);
      setShowManualPopup(true);
      return;
    }

    if (!selectedCat?.trim()) {
      setIsApprovalSuccess(false);
      setApprovalMessage("Please select a category.");
      return;
    }

    await sendApproval(questionId, selectedCat);
  };

  const sendApproval = async (questionId: string, categoryToUse: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/questions/approve/${questionId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category: categoryToUse })
        }
      );

      if (!response.ok) {
        throw new Error(`Approval failed: ${response.status}`);
      }

      setQuestions((prev) => prev.filter((q) => q._id !== questionId));
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

      setShowManualPopup(false);
      setPendingApprovalId(null);
      setIsApprovalSuccess(true);
      setApprovalMessage("Question approved successfully!");
    } catch (error) {
      console.error("Error approving:", error);
      setIsApprovalSuccess(false);
      setApprovalMessage("Failed to approve question. Please try again.");
    }
  };

  const handleReject = async (questionId: string) => {
    try {
      const confirmed = window.confirm(
        "Are you sure you want to reject this question?"
      );
      if (!confirmed) return;

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/questions/reject/${questionId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" }
        }
      );

      if (!response.ok) {
        throw new Error("Failed to reject question");
      }

      setQuestions((prev) => prev.filter((q) => q._id !== questionId));
      setIsApprovalSuccess(true);
      setApprovalMessage("Question rejected successfully.");
    } catch (error) {
      console.error("Error rejecting question:", error);
      setIsApprovalSuccess(false);
      setApprovalMessage("Failed to reject question.");
    }
  };

  const columnDefs: ColDef<Question>[] = [
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
    {
      headerName: "Category",
      field: "category",
      sortable: false,
      maxWidth: 200,
      flex: 2,
      cellRenderer: (params) => {
        const id = params.data._id;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
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

            {selectedCategories[id] === "Other" && (
              <input
                type="text"
                className="manual-category-input"
                placeholder="Enter new category"
                value={manualCategories[id] || ""}
                onChange={(e) => {
                  setManualCategories((prev) => ({
                    ...prev,
                    [id]: e.target.value
                  }));
                }}
              />
            )}
          </div>
        );
      }
    },
    {
      headerName: "Actions",
      field: "actions" as any,
      maxWidth: 250,
      sortable: false,
      flex: 1,
      cellRenderer: (params) => (
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className="approve-button"
            onClick={() => handleApprove(params.data._id)}
          >
            Approve
          </button>

          <button
            className="reject-button"
            onClick={() => handleReject(params.data._id)}
          >
            Reject
          </button>
        </div>
      )
    }
  ];

  return role.includes("admin") ? (
    <div className="admin-approval-dashboard">
      <ErrorPopup
        message={approvalMessage}
        setMessage={setApprovalMessage}
        success={isApprovalSuccess}
      />
      <h2 className="admin-header">Admin Question Approval</h2>

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
              {result.question}
            </li>
          ))}
        </ul>
      </div>

      {selectedQuestion && (
        <div className="question-details-request">
          <h3>Question Details</h3>
          <p className="question-text-request">
            <strong>Question:</strong> {selectedQuestion.question}
          </p>
          <p className="category-text-request">
            <strong>Category:</strong> {selectedQuestion.category}
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
      )}

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
                      setIsApprovalSuccess(false);
                      setApprovalMessage("Please enter a category.");
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
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        <h3>Unapproved Community Questions</h3>
        {isLoading ? (
          <p>Loading...</p>
        ) : questions.length === 0 ? (
          <p>You have no unapproved questions.</p>
        ) : (
          <div className="ag-theme-alpine unapproved-questions-grid">
            <AgGridReact
              rowData={questions}
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
