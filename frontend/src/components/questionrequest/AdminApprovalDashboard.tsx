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
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [pendingRejectId, setPendingRejectId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [approvingIds, setApprovingIds] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [updatingIds, setUpdatingIds] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [rejectingIds, setRejectingIds] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [deletingIds, setDeletingIds] = useState<{ [key: string]: boolean }>(
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
  const [editModeQuestionId, setEditModeQuestionId] = useState<string | null>(
    null
  );
  const [editedQuestionData, setEditedQuestionData] = useState<
    Partial<ClassicQuestion | KnowledgeQuestion>
  >({});
  const [isValidImage, setIsValidImage] = useState<boolean | null>(null);

  useEffect(() => {
    setIsValidImage(null);
    if (
      !editedQuestionData ||
      !editedQuestionData?.question ||
      !editedQuestionData?.question?.trim()
    ) {
      setIsValidImage(null);
      return;
    }

    const img = new Image();
    img.onload = () => setIsValidImage(true);
    img.onerror = () => setIsValidImage(false);
    img.src = editedQuestionData.question;
  }, [editedQuestionData.question]);

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
        if (currentMode === "Classic") {
          setClassicQuestions(data.questions);
          setCategories(
            data.categories.filter((cat: string) => cat !== "Community")
          );
        } else setKnowledgeQuestions(data.questions);
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
      setSearchResults(
        data.map((q) =>
          q.createdBy
            ? {
                ...q,
                correctOption:
                  `[Contributed by ${q.createdBy}] ` + q.correctOption
              }
            : { ...q }
        )
      );
    } catch (error) {
      console.error("Error searching for questions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEdit = async (questionId: string) => {
    setUpdatingIds((prev) => ({ ...prev, [questionId]: true }));

    const mode = selectedQuestion?.type === "classic" ? "classic" : "knowledge";
    const category =
      selectedCategories[questionId] === "Other"
        ? manualCategories[questionId]?.trim()
        : selectedCategories[questionId];

    if (editedQuestionData.question === "") {
      dispatch(
        setError({
          errorMessage: "Question is required.",
          success: false
        })
      );
      return;
    }

    if (mode === "classic") {
      if (!category) {
        dispatch(
          setError({
            errorMessage: "Please select a category.",
            success: false
          })
        );
        return;
      }

      if ((editedQuestionData as ClassicQuestion).explanation === "") {
        dispatch(
          setError({
            errorMessage: "Explanation is required for classic questions.",
            success: false
          })
        );
        return;
      }

      const correctOption = editedQuestionData.correctOption as number;
      if (!isFinite(correctOption)) {
        dispatch(
          setError({
            errorMessage: "Please select a correct option.",
            success: false
          })
        );
        return;
      }

      if (correctOption > 4 || correctOption < 1) {
        dispatch(
          setError({
            errorMessage: "Correct option must be between 1 and 4.",
            success: false
          })
        );
        return;
      }

      if (
        editedQuestionData.difficulty > 5 ||
        editedQuestionData.difficulty < 1
      ) {
        dispatch(
          setError({
            errorMessage: "Difficulty must be between 1 and 5.",
            success: false
          })
        );
        return;
      }

      if (
        editedQuestionData.question.match(
          /^\[Contributed by [^\]]+\]\s*(.*)/
        ) &&
        !editedQuestionData.question.match(
          /^\[Contributed by [^\]]+\]\s*(.*)/
        )?.[1]
      ) {
        dispatch(
          setError({
            errorMessage: "Question is required.",
            success: false
          })
        );
        return;
      }
    }

    if (mode === "knowledge") {
      if (!editedQuestionData.question.trim()) {
        dispatch(
          setError({
            errorMessage: "Question is required.",
            success: false
          })
        );
        return;
      }

      if (!(editedQuestionData.correctOption as string).trim()) {
        dispatch(
          setError({
            errorMessage: "Correct answer is required.",
            success: false
          })
        );
        return;
      }

      if (
        editedQuestionData.difficulty < 1 ||
        editedQuestionData.difficulty > 5
      ) {
        dispatch(
          setError({
            errorMessage: "Difficulty must be between 1 and 5.",
            success: false
          })
        );
        return;
      }

      if (!isValidImage) {
        dispatch(
          setError({
            errorMessage: "Please provide a valid image.",
            success: false
          })
        );
        return;
      }
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/questions/update-${mode}/${questionId}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ...selectedQuestion,
            ...editedQuestionData,
            ...(mode === "classic" ? { category } : {})
          })
        }
      );
      if (!res.ok) {
        const err = await res.json();
        console.error("Update failed:", err);
        dispatch(setError({ errorMessage: String(err), success: false }));
      }

      if (
        selectedQuestion.approved === undefined ||
        selectedQuestion.approved
      ) {
        // Modify in Search
        setSearchResults((prev) =>
          prev.map((q) =>
            q._id === questionId
              ? {
                  ...selectedQuestion,
                  ...editedQuestionData,
                  ...(mode === "classic" ? { category } : {})
                }
              : q
          )
        );
      } else {
        // Modify in Unapproved Questions
        if (selectedQuestion.type === "classic") {
          setClassicQuestions((prev) =>
            prev.map((q) =>
              q._id === questionId
                ? {
                    ...(selectedQuestion as ClassicQuestion),
                    ...(editedQuestionData as ClassicQuestion),
                    category
                  }
                : q
            )
          );
        } else {
          setKnowledgeQuestions((prev) =>
            prev.map((q) =>
              q._id === questionId
                ? {
                    ...(selectedQuestion as KnowledgeQuestion),
                    ...(editedQuestionData as KnowledgeQuestion)
                  }
                : q
            )
          );
        }
      }

      // Modify in Preview
      setSelectedQuestion({
        ...selectedQuestion,
        ...editedQuestionData,
        ...(mode === "classic" ? { category } : {})
      } as ClassicQuestion | KnowledgeQuestion);

      dispatch(
        setError({ errorMessage: "Saved successfully!", success: true })
      );
      setEditModeQuestionId(null);
      setEditedQuestionData({});
    } catch (err) {
      console.error(err);
      dispatch(setError({ errorMessage: "Failed to save.", success: false }));
    } finally {
      setUpdatingIds((prev) => {
        const updated = { ...prev };
        delete updated[questionId];
        return updated;
      });
    }
  };

  const handleDelete = (questionId: string) => {
    setPendingDeleteId(questionId);
    setDeleteReason("");
    setShowDeletePopup(true);
  };

  const sendDeletion = async (questionId: string, deleteReason: string) => {
    setRejectingIds((prev) => ({ ...prev, [questionId]: true }));
    setDeletingIds((prev) => ({ ...prev, [questionId]: true }));
    const mode = selectedQuestion?.type === "classic" ? "classic" : "knowledge";

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/questions/delete-${mode.toLowerCase()}/${questionId}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: deleteReason })
        }
      );
      if (!res.ok) {
        const err = await res.json();
        console.error("Update failed:", err);
      }

      if (
        selectedQuestion.approved === undefined ||
        selectedQuestion.approved
      ) {
        setSearchResults(
          (prev) =>
            prev.filter((q) => q._id !== questionId) as
              | KnowledgeQuestion[]
              | ClassicQuestion[]
        );
      } else {
        {
          if (selectedQuestion.type === "classic") {
            setClassicQuestions((prev) =>
              prev.filter((q) => q._id !== questionId)
            );
          } else {
            setKnowledgeQuestions((prev) =>
              prev.filter((q) => q._id !== questionId)
            );
          }
        }
      }

      dispatch(
        setError({ errorMessage: "Deleted successfully!", success: true })
      );
      setSelectedQuestion(null);
    } catch (err) {
      console.error(err);
      dispatch(setError({ errorMessage: "Delete failed.", success: false }));
    } finally {
      setDeletingIds((prev) => {
        const updated = { ...prev };
        delete updated[questionId];
        return updated;
      });
      setRejectingIds((prev) => {
        const updated = { ...prev };
        delete updated[questionId];
        return updated;
      });
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
    const isEditing =
      selectedQuestion && editModeQuestionId === selectedQuestion._id;

    if (selectedQuestion?.type === "classic") {
      const q = selectedQuestion;
      const formData = isEditing ? editedQuestionData : q;

      const handleFieldChange = (field: string, value: any) => {
        setEditedQuestionData((prev) => ({ ...prev, [field]: value }));
      };

      return (
        <div className="question-details-request">
          <h3>Question Details</h3>

          {isEditing ? (
            <>
              <label>
                <strong>Question:</strong>
              </label>
              {(() => {
                const prefixMatch = formData.question.match(
                  /^\[Contributed by [^\]]+\]\s*/
                );
                const prefix = prefixMatch ? prefixMatch[0] : "";
                const editablePart = formData.question.replace(prefix, "");

                return (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {prefix && (
                      <span
                        style={{
                          backgroundColor: "#f0f0f0",
                          padding: "4px 6px",
                          color: "#888",
                          fontStyle: "italic"
                        }}
                      >
                        {prefix}
                      </span>
                    )}
                    <textarea
                      value={editablePart}
                      required={true}
                      onChange={(e) =>
                        handleFieldChange("question", prefix + e.target.value)
                      }
                    />
                  </div>
                );
              })()}

              <label>
                <strong>Category:</strong>
              </label>
              <select
                value={selectedCategories[q._id] || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  handleCategoryChange(q._id, val);
                }}
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="Other">Other</option>
              </select>

              {selectedCategories[q._id] === "Other" && (
                <>
                  <input
                    type="text"
                    required={true}
                    placeholder="Please Enter a Category"
                    style={{ marginTop: "10px" }}
                    value={manualCategories[q._id] || ""}
                    onChange={(e) =>
                      setManualCategories((prev) => ({
                        ...prev,
                        [q._id]: e.target.value
                      }))
                    }
                  />
                </>
              )}

              <label>
                <strong>Difficulty (1-5):</strong>
              </label>
              <input
                type="number"
                min={1}
                max={5}
                required={true}
                value={formData.difficulty}
                onChange={(e) =>
                  handleFieldChange("difficulty", Number(e.target.value))
                }
              />

              <label>
                <strong>Options:</strong>
              </label>
              {(formData as ClassicQuestion).options?.map((opt, idx) => (
                <input
                  key={idx}
                  value={opt}
                  required={true}
                  onChange={(e) => {
                    const updatedOptions = [
                      ...(formData as ClassicQuestion).options!
                    ];
                    updatedOptions[idx] = e.target.value;
                    handleFieldChange("options", updatedOptions);
                  }}
                />
              ))}

              <label>
                <strong>Correct Option (1-based index):</strong>
              </label>
              <input
                type="number"
                min={1}
                max={4}
                required={true}
                value={formData.correctOption}
                onChange={(e) =>
                  handleFieldChange("correctOption", Number(e.target.value))
                }
              />

              <label>
                <strong>Explanation:</strong>
              </label>
              <textarea
                value={(formData as ClassicQuestion).explanation || ""}
                required={true}
                onChange={(e) =>
                  handleFieldChange("explanation", e.target.value)
                }
              />

              <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
                <button
                  className="approve-button loading-button"
                  onClick={() => handleSaveEdit(q._id)}
                  disabled={!!updatingIds[q._id]}
                >
                  {updatingIds[q._id] ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 1,
                        ease: "linear"
                      }}
                      className="loading-icon-wrapper"
                    >
                      <AiOutlineLoading3Quarters className="loading-icon" />
                    </motion.div>
                  ) : (
                    "Save"
                  )}
                </button>

                <button
                  className="reject-button"
                  onClick={() => {
                    setEditModeQuestionId(null);
                    setEditedQuestionData({});
                  }}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <label>
                <strong>Question:</strong>
              </label>{" "}
              {selectedQuestion.question}
              <label>
                <strong>Category:</strong>
              </label>{" "}
              {selectedQuestion.category}
              <label>
                <strong>Difficulty:</strong>
              </label>{" "}
              {selectedQuestion.difficulty}
              <label>
                <strong>Options:</strong>
              </label>
              <ul className="options-list-request">
                {selectedQuestion.options.map(
                  (option: string, index: number) => (
                    <li key={index}>{option}</li>
                  )
                )}
              </ul>
              <label>
                <strong>Correct Option:</strong>{" "}
                {selectedQuestion.options[selectedQuestion.correctOption - 1]}
              </label>
              <label>
                <strong>Explanation:</strong> {selectedQuestion.explanation}
              </label>
              <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
                <button
                  className="approve-button"
                  onClick={() => {
                    setEditModeQuestionId(q._id);
                    setEditedQuestionData({ ...q });
                    setSelectedCategories((prev) => ({
                      ...prev,
                      [q._id]: q.category || ""
                    }));
                  }}
                >
                  ✏️ Edit
                </button>
                <button
                  className="reject-button loading-button"
                  onClick={() => handleDelete(q._id)}
                  disabled={!!deletingIds[q._id]}
                >
                  {deletingIds[q._id] ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 1,
                        ease: "linear"
                      }}
                      className="loading-icon-wrapper"
                    >
                      <AiOutlineLoading3Quarters className="loading-icon" />
                    </motion.div>
                  ) : (
                    "🗑️ Delete"
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      );
    } else {
      const isEditing = editModeQuestionId === selectedQuestion._id;

      return (
        <div key={selectedQuestion._id} className="question-details-request">
          <h3>Question Details</h3>

          {isEditing ? (
            <>
              <label>
                <strong>Image URL: </strong>

                <input
                  value={editedQuestionData.question ?? ""}
                  onChange={(e) =>
                    setEditedQuestionData((prev) => ({
                      ...prev,
                      question: e.target.value
                    }))
                  }
                />
              </label>
              <img
                src={editedQuestionData.question ?? ""}
                alt="Preview"
                style={{
                  display: "block",
                  marginTop: "10px",
                  height: "300px"
                }}
              />

              <label>
                <strong>Difficulty:</strong>
              </label>
              <input
                min={1}
                max={5}
                required={true}
                type="number"
                value={editedQuestionData.difficulty ?? ""}
                onChange={(e) =>
                  setEditedQuestionData(
                    (prev: KnowledgeQuestion) =>
                      ({
                        ...prev,
                        difficulty: parseInt(e.target.value)
                      }) as KnowledgeQuestion
                  )
                }
              />

              <label>
                <strong>Answer: </strong>
                <input
                  value={editedQuestionData.correctOption ?? ""}
                  onChange={(e) =>
                    setEditedQuestionData((prev: KnowledgeQuestion) => ({
                      ...prev,
                      correctOption: e.target.value
                    }))
                  }
                />
              </label>

              <div
                className="action-buttons"
                style={{ display: "flex", gap: "10px", marginTop: "20px" }}
              >
                <button
                  className="approve-button loading-button"
                  onClick={() => handleSaveEdit(editModeQuestionId)}
                  disabled={!!updatingIds[editModeQuestionId]}
                >
                  {updatingIds[editModeQuestionId] ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 1,
                        ease: "linear"
                      }}
                      className="loading-icon-wrapper"
                    >
                      <AiOutlineLoading3Quarters className="loading-icon" />
                    </motion.div>
                  ) : (
                    "Save"
                  )}
                </button>
                <button
                  className="reject-button"
                  onClick={() => setEditModeQuestionId(null)}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <label>
                <strong>Image:</strong>
              </label>
              <img
                src={selectedQuestion.question}
                style={{
                  display: "block",
                  marginTop: "10px",
                  height: "300px"
                }}
              />

              <label>
                <strong>Difficulty:</strong> {selectedQuestion.difficulty}
              </label>

              <label>
                <strong>Answer:</strong> {selectedQuestion.correctOption}
              </label>

              {selectedQuestion.createdBy && (
                <label>
                  <strong>Contributor:</strong> {selectedQuestion.createdBy}
                </label>
              )}

              <div
                className="action-buttons"
                style={{ display: "flex", gap: "10px", marginTop: "20px" }}
              >
                <button
                  className="approve-button"
                  onClick={() => {
                    setEditModeQuestionId(selectedQuestion._id);
                    setEditedQuestionData({
                      question: selectedQuestion.question,
                      difficulty: selectedQuestion.difficulty,
                      correctOption: selectedQuestion.correctOption
                    });
                  }}
                >
                  ✏️ Edit
                </button>
                <button
                  className="reject-button loading-button"
                  onClick={() => handleDelete(selectedQuestion._id)}
                  disabled={!!deletingIds[selectedQuestion._id]}
                >
                  {deletingIds[selectedQuestion._id] ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 1,
                        ease: "linear"
                      }}
                      className="loading-icon-wrapper"
                    >
                      <AiOutlineLoading3Quarters className="loading-icon" />
                    </motion.div>
                  ) : (
                    "🗑️ Delete"
                  )}
                </button>
              </div>
            </>
          )}
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

      if (currentMode === "Classic")
        setClassicQuestions((prev) => prev.filter((q) => q._id !== questionId));
      else
        setKnowledgeQuestions((prev) =>
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
          filter: true,
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
    currentMode === "Knowledge"
      ? {
          headerName: "Contributor",
          field: "createdBy",
          sortable: false,
          filter: true,
          maxWidth: 200,
          flex: 1.5,
          cellStyle: {
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontStyle: "italic"
          }
        }
      : { sortable: false, filter: false, maxWidth: 0, flex: 0 },
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="admin-approval-dashboard">
        <h2 className="admin-header">Admin Question Approval Dashboard</h2>
        <div className="buttons-container">
          {availableModes.map((mode) => (
            <button
              key={mode}
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
          placeholder="Search by Questions/Options or Search by User Contributor"
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
                    data-testid="approve-button"
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
                    data-testid="reject-button"
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

          {showDeletePopup && pendingDeleteId && (
            <div className="manual-category-popup-overlay">
              <div className="manual-category-popup">
                <h3>Reason for Deletion</h3>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
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
                      sendDeletion(pendingDeleteId, deleteReason);
                      setShowDeletePopup(false);
                      setPendingDeleteId(null);
                    }}
                    className="reject-button"
                    data-testid="reject-button"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      setShowDeletePopup(false);
                      setPendingDeleteId(null);
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
                key={mode}
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
            <p style={{ color: "black", textShadow: "none" }}>
              You have no unapproved questions.
            </p>
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
    </motion.div>
  ) : (
    <NoAccess />
  );
};

export default AdminApprovalDashboard;
