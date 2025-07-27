import "@testing-library/jest-dom";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor, render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import store from "../../src/redux/store";
import { setUser } from "../../src/redux/userSlice";
import * as errorSlice from "../../src/redux/errorSlice";
import ClassicQuestionSubmissionForm from "../../src/components/questionrequest/ClassicQuestionSubmissionForm.tsx";
import KnowledgeQuestionSubmissionForm from "../../src/components/questionrequest/KnowledgeQuestionSubmissionForm";

vi.spyOn(errorSlice, "setError").mockImplementation((payload) => ({
  type: "error/setError",
  payload
}));

const renderWithProviders = (ui) => {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={ui} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

describe("ClassicQuestionSubmissionForm", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    store.dispatch(setUser({ username: "testUser", role: "user" }));
  });

  it("shows validation error when submitting empty form", async () => {
    renderWithProviders(<ClassicQuestionSubmissionForm />);

    fireEvent.click(screen.getByText("Submit Question"));

    await waitFor(() =>
      expect(errorSlice.setError).toHaveBeenCalledWith({
        errorMessage: "Question is required.",
        success: false
      })
    );
  });

  it("submits valid form", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({ ok: true });

    renderWithProviders(<ClassicQuestionSubmissionForm />);

    fireEvent.change(screen.getByLabelText("Question:"), {
      target: { value: "What is 2 + 2?" }
    });

    const optionInputs = screen
      .getAllByRole("textbox")
      .filter(
        (input) =>
          input.id !== "question-input" && input.id !== "explanation-textarea"
      );
    optionInputs.forEach((input, i) => {
      fireEvent.change(input, { target: { value: `Option ${i + 1}` } });
    });

    fireEvent.change(screen.getByLabelText("Correct Option (1-4):"), {
      target: { value: 4 }
    });
    fireEvent.change(screen.getByLabelText("Explanation:"), {
      target: { value: "Because 2 + 2 = 4." }
    });
    fireEvent.change(screen.getByLabelText("Difficulty (1-5):"), {
      target: { value: 1 }
    });

    fireEvent.click(screen.getByText("Submit Question"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/questions/request"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            question: "What is 2 + 2?",
            options: ["Option 1", "Option 2", "Option 3", "Option 4"],
            correctOption: 4,
            explanation: "Because 2 + 2 = 4.",
            category: "Community",
            difficulty: 1,
            approved: false,
            createdBy: "testUser"
          })
        })
      );
    });

    expect(errorSlice.setError).toHaveBeenCalledWith({
      errorMessage: "Question submitted!",
      success: true
    });
  });

  describe("ClassicQuestionSubmissionForm validation flow", () => {
    it("prompts 'Question is required.' when all fields empty", async () => {
      renderWithProviders(<ClassicQuestionSubmissionForm />);
      fireEvent.click(screen.getByText("Submit Question"));

      await waitFor(() => {
        expect(errorSlice.setError).toHaveBeenCalledWith({
          errorMessage: "Question is required.",
          success: false
        });
      });
    });

    it("prompts 'All options must be filled.' when question filled but options empty", async () => {
      renderWithProviders(<ClassicQuestionSubmissionForm />);
      fireEvent.change(screen.getByLabelText("Question:"), {
        target: { value: "My Question?" }
      });

      fireEvent.click(screen.getByText("Submit Question"));

      await waitFor(() => {
        expect(errorSlice.setError).toHaveBeenCalledWith({
          errorMessage: "All options must be filled.",
          success: false
        });
      });
    });

    it("prompts 'Correct option must be an integer between 1 and 4.' when question and options filled but correct option invalid", async () => {
      renderWithProviders(<ClassicQuestionSubmissionForm />);
      fireEvent.change(screen.getByLabelText("Question:"), {
        target: { value: "My Question?" }
      });

      const optionInputs = screen
        .getAllByRole("textbox")
        .filter(
          (input) =>
            input.id !== "question-input" && input.id !== "explanation-textarea"
        );
      optionInputs.forEach((input, i) => {
        fireEvent.change(input, { target: { value: `Option ${i + 1}` } });
      });

      // Set invalid correct option (e.g. 0)
      fireEvent.change(screen.getByLabelText("Correct Option (1-4):"), {
        target: { value: 0 }
      });

      fireEvent.click(screen.getByText("Submit Question"));

      await waitFor(() => {
        expect(errorSlice.setError).toHaveBeenCalledWith({
          errorMessage: "Correct option must be an integer between 1 and 4.",
          success: false
        });
      });
    });

    it("prompts 'Explanation is required.' when question, options, correct option are valid but explanation empty", async () => {
      renderWithProviders(<ClassicQuestionSubmissionForm />);
      fireEvent.change(screen.getByLabelText("Question:"), {
        target: { value: "My Question?" }
      });

      const optionInputs = screen
        .getAllByRole("textbox")
        .filter(
          (input) =>
            input.id !== "question-input" && input.id !== "explanation-textarea"
        );
      optionInputs.forEach((input, i) => {
        fireEvent.change(input, { target: { value: `Option ${i + 1}` } });
      });

      fireEvent.change(screen.getByLabelText("Correct Option (1-4):"), {
        target: { value: 2 }
      });

      fireEvent.click(screen.getByText("Submit Question"));

      await waitFor(() => {
        expect(errorSlice.setError).toHaveBeenCalledWith({
          errorMessage: "Explanation is required.",
          success: false
        });
      });
    });
  });
});

describe("KnowledgeQuestionSubmissionForm", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    store.dispatch(setUser({ username: "testUser", role: "user" }));
  });

  describe("KnowledgeQuestionSubmissionForm validation flow", () => {
    beforeEach(() => {
      vi.resetAllMocks();
      store.dispatch(setUser({ username: "testUser", role: "user" }));
    });

    it("prompts 'Question is required.' when all fields empty", async () => {
      renderWithProviders(<KnowledgeQuestionSubmissionForm />);
      fireEvent.click(screen.getByText("Submit Question"));

      await waitFor(() => {
        expect(errorSlice.setError).toHaveBeenCalledWith({
          errorMessage: "Question is required.",
          success: false
        });
      });
    });

    it("prompts 'Please provide a valid image URL' when question is invalid URL", async () => {
      renderWithProviders(<KnowledgeQuestionSubmissionForm />);
      fireEvent.change(screen.getByLabelText("Question: (Image URL)"), {
        target: { value: "invalid-url" }
      });
      fireEvent.change(screen.getByLabelText("Answer:"), {
        target: { value: "Some answer" }
      });

      fireEvent.click(screen.getByText("Submit Question"));

      await waitFor(() => {
        expect(errorSlice.setError).toHaveBeenCalledWith({
          errorMessage: "Please provide a valid image URL",
          success: false
        });
      });
    });

    it("prompts 'Answer is required' when question valid but answer empty", async () => {
      renderWithProviders(<KnowledgeQuestionSubmissionForm />);
      fireEvent.change(screen.getByLabelText("Question: (Image URL)"), {
        target: { value: "image.jpg" }
      });

      fireEvent.click(screen.getByText("Submit Question"));

      await waitFor(() => {
        expect(errorSlice.setError).toHaveBeenCalledWith({
          errorMessage: "Answer is required",
          success: false
        });
      });
    });

    it("prompts 'Difficulty must be between 1 and 5.' when difficulty is out of range", async () => {
      renderWithProviders(<KnowledgeQuestionSubmissionForm />);
      fireEvent.change(screen.getByLabelText("Question: (Image URL)"), {
        target: { value: "image.jpg" }
      });
      fireEvent.change(screen.getByLabelText("Answer:"), {
        target: { value: "Some answer" }
      });
      fireEvent.change(screen.getByLabelText("Difficulty (1-5):"), {
        target: { value: 0 }
      });

      fireEvent.click(screen.getByText("Submit Question"));

      await waitFor(() => {
        expect(errorSlice.setError).toHaveBeenCalledWith({
          errorMessage: "Difficulty must be between 1 and 5.",
          success: false
        });
      });
    });
  });

  it("submits valid knowledge question", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({ ok: true });

    renderWithProviders(<KnowledgeQuestionSubmissionForm />);

    fireEvent.change(screen.getByLabelText("Question: (Image URL)"), {
      target: { value: "test.jpg" }
    });
    fireEvent.change(screen.getByLabelText("Answer:"), {
      target: { value: "42" }
    });
    fireEvent.change(screen.getByLabelText("Difficulty (1-5):"), {
      target: { value: 2 }
    });

    fireEvent.click(screen.getByText("Submit Question"));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/questions/requestknowledge"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            question: "test.jpg",
            answer: "42",
            difficulty: 2,
            createdBy: "testUser"
          })
        })
      )
    );

    expect(errorSlice.setError).toHaveBeenCalledWith({
      errorMessage: "Question submitted!",
      success: true
    });
  });
});
