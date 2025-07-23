import "@testing-library/jest-dom";
import React from "react";
import { act } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import store from "../../src/redux/store";
import { setUser } from "../../src/redux/userSlice";
import { setError } from "../../src/redux/errorSlice";
import AdminApprovalDashboard from "../../src/components/questionrequest/AdminApprovalDashboard";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);

vi.mock("../../src/redux/errorSlice", async () => {
  const actual = await vi.importActual("../../src/redux/errorSlice");
  return {
    ...actual,
    setError: vi.fn((payload) => ({ type: "error/setError", payload }))
  };
});

const renderWithProviders = () => {
  render(
    <Provider store={store}>
      <MemoryRouter>
        <AdminApprovalDashboard />
      </MemoryRouter>
    </Provider>
  );
};

const mockClassicQuestions = [
  {
    _id: "2",
    question: "What is 2 + 2?",
    options: ["1", "2", "3", "4"],
    correctOption: 4,
    explanation: "2 + 2 = 4",
    difficulty: 1,
    createdBy: "user1",
    type: "classic"
  }
];

const mockKnowledgeQuestions = [
  {
    _id: "1",
    question: "image.jpg",
    correctOption: "Earth",
    difficulty: 2,
    createdBy: "user2",
    type: "knowledge"
  }
];

describe("AdminApprovalDashboard", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    store.dispatch(
      setUser({
        username: "testuser",
        email: "test@test.com",
        verified: true,
        chatBan: false,
        gameBan: false,
        role: "admin"
      })
    );
  });

  describe("Classic Tests", () => {
    it("displays classic questions by default and allows approval", async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              questions: mockClassicQuestions,
              categories: ["General", "Meme God"]
            })
        })
        .mockResolvedValueOnce({ ok: true });

      await renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText("What is 2 + 2?")).toBeInTheDocument();
      });

      await act(() => {
        const dropdowns = document.querySelectorAll(".category-select");
        dropdowns.forEach((dropdown) => {
          fireEvent.change(dropdown, { target: { value: "General" } });
        });
      });

      fireEvent.click(screen.getByText("Approve"));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenLastCalledWith(
          expect.stringContaining("/api/questions/approve-classic/2"),
          expect.objectContaining({
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              category: "General",
              difficulty: 1
            })
          })
        );
      });
    });

    it("displays classic questions by default and allows approval (custom category)", async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              questions: mockClassicQuestions,
              categories: ["General", "Meme God"]
            })
        })
        .mockResolvedValueOnce({ ok: true });

      await renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText("What is 2 + 2?")).toBeInTheDocument();
      });

      await act(() => {
        const dropdowns = document.querySelectorAll(".category-select");
        dropdowns.forEach((dropdown) => {
          fireEvent.change(dropdown, { target: { value: "Other" } });
        });
      });

      fireEvent.click(screen.getByText("Approve"));

      await waitFor(() => {
        expect(screen.getByText("Enter Manual Category")).toBeInTheDocument();
      });

      const input = await screen.findByPlaceholderText(/Type category name/i);
      fireEvent.change(input, { target: { value: "Test Category" } });

      fireEvent.click(screen.getByTestId("approve-button"));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenLastCalledWith(
          expect.stringContaining("/api/questions/approve-classic/2"),
          expect.objectContaining({
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              category: "Test Category",
              difficulty: 1
            })
          })
        );
      });
    });

    it("reject classic question approval without category", async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              questions: mockClassicQuestions,
              categories: ["General", "Meme God"]
            })
        })
        .mockResolvedValueOnce({ ok: true });

      await renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText("What is 2 + 2?")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Approve"));

      await waitFor(() => {
        expect(setError).toHaveBeenCalledWith({
          errorMessage: "Please select a category.",
          success: false
        });
      });
    });

    it("allows rejecting a classic question", async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              questions: mockClassicQuestions,
              categories: ["General", "Meme God"]
            })
        })
        .mockResolvedValueOnce({ ok: true });

      await renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText("What is 2 + 2?")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Reject"));

      await waitFor(() => {
        expect(screen.getByText("Reason for Rejection")).toBeInTheDocument();
      });

      const input = await screen.findByPlaceholderText(
        /Optional: Add a brief explanation/i
      );
      fireEvent.change(input, { target: { value: "test reason" } });

      fireEvent.click(screen.getByTestId("reject-button"));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenLastCalledWith(
          expect.stringContaining("/api/questions/reject-classic/2"),
          expect.objectContaining({
            method: "DELETE",
            credentials: "include",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ reason: "test reason" })
          })
        );
      });
    });
  });

  describe("Knowledge Tests", () => {
    it("toggles to knowledge/classic/knowledge questions and approves", async () => {
      global.fetch = vi
        .fn()
        // Initial fetch for classic
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              questions: mockClassicQuestions,
              categories: ["General", "Meme God"]
            })
        })
        // Fetch knowledge questions
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              questions: mockKnowledgeQuestions,
              categories: ["General", "Meme God"]
            })
        })
        // Then back to classic
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              questions: mockClassicQuestions,
              categories: ["General", "Meme God"]
            })
        })
        // finally knowledge questions
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              questions: mockKnowledgeQuestions,
              categories: ["General", "Meme God"]
            })
        })
        // Approve knowledge
        .mockResolvedValueOnce({ ok: true });

      await renderWithProviders();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenLastCalledWith(
          expect.stringContaining("/api/questions/fetch-classic"),
          expect.objectContaining({
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json"
            }
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByText("What is 2 + 2?")).toBeInTheDocument();
      });

      await act(() => {
        const toggles = screen.getAllByText("Knowledge");
        toggles.forEach((toggle) => {
          fireEvent.click(toggle);
        });
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenLastCalledWith(
          expect.stringContaining("/api/questions/fetch-knowledge"),
          expect.objectContaining({
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json"
            }
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByText("user2")).toBeInTheDocument();
        expect(screen.getByText("Earth")).toBeInTheDocument();
      });

      await act(() => {
        const toggles = screen.getAllByText("Classic");
        toggles.forEach((toggle) => {
          fireEvent.click(toggle);
        });
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenLastCalledWith(
          expect.stringContaining("/api/questions/fetch-classic"),
          expect.objectContaining({
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json"
            }
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByText("What is 2 + 2?")).toBeInTheDocument();
      });

      await act(() => {
        const toggles = screen.getAllByText("Knowledge");
        toggles.forEach((toggle) => {
          fireEvent.click(toggle);
        });
      });

      await waitFor(() => {
        expect(screen.getByText("user2")).toBeInTheDocument();
        expect(screen.getByText("Earth")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Approve"));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenLastCalledWith(
          expect.stringContaining("/api/questions/approve-knowledge/1"),
          expect.objectContaining({
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              category: null,
              difficulty: 2
            })
          })
        );
      });
    });

    it("rejects knowledge question", async () => {
      global.fetch = vi
        .fn()
        // Initial fetch for classic
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              questions: mockClassicQuestions,
              categories: ["General", "Meme God"]
            })
        })
        // Fetch knowledge questions
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              questions: mockKnowledgeQuestions,
              categories: ["General", "Meme God"]
            })
        })
        // Reject knowledge question
        .mockResolvedValueOnce({ ok: true });

      await renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText("What is 2 + 2?")).toBeInTheDocument();
      });

      await act(() => {
        const toggles = screen.getAllByText("Knowledge");
        toggles.forEach((toggle) => {
          fireEvent.click(toggle);
        });
      });

      await waitFor(() => {
        expect(screen.getByText("user2")).toBeInTheDocument();
        expect(screen.getByText("Earth")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Reject"));

      await waitFor(() => {
        expect(screen.getByText("Reason for Rejection")).toBeInTheDocument();
      });

      const input = await screen.findByPlaceholderText(
        /Optional: Add a brief explanation/i
      );
      fireEvent.change(input, { target: { value: "test reason" } });

      fireEvent.click(screen.getByTestId("reject-button"));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenLastCalledWith(
          expect.stringContaining("/api/questions/reject-knowledge/1"),
          expect.objectContaining({
            method: "DELETE",
            credentials: "include",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ reason: "test reason" })
          })
        );
      });
    });
  });

  it("renders correct question details for classic and knowledge when clicked", async () => {
    global.fetch = vi
      .fn()
      // Initial classic fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            questions: mockClassicQuestions,
            categories: ["General", "Meme God"]
          })
      })
      // Knowledge fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            questions: mockKnowledgeQuestions,
            categories: ["General", "Meme God"]
          })
      });

    await renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText("What is 2 + 2?")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("What is 2 + 2?"));

    await waitFor(() => {
      expect(screen.getByText("2 + 2 = 4")).toBeInTheDocument();
      expect(screen.getByText("Difficulty:")).toBeInTheDocument();
      expect(screen.getByText("Category:")).toBeInTheDocument();
      expect(screen.getByText("Correct Option:")).toBeInTheDocument();
      expect(screen.getByText("Explanation:")).toBeInTheDocument();
    });

    // Switch to knowledge
    const toggles = screen.getAllByText("Knowledge");
    toggles.forEach((toggle) => {
      fireEvent.click(toggle);
    });

    await waitFor(() => {
      expect(screen.getByText("image.jpg")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("image.jpg"));

    await waitFor(() => {
      expect(screen.getByText("Answer:")).toBeInTheDocument();
      expect(screen.getByText("Difficulty:")).toBeInTheDocument();
      expect(screen.getByText("Image:")).toBeInTheDocument();
      expect(screen.getByText("Contributor:")).toBeInTheDocument();
    });
  });

  it("filters questions by search query and shows correct details (classic & knowledge)", async () => {
    const extendedClassicQuestions = [
      {
        _id: "3",
        question: "What is 5 + 5?",
        options: ["9", "10", "11", "12"],
        correctOption: 2,
        explanation: "5 + 5 = 10",
        difficulty: 2,
        createdBy: "user3",
        type: "classic"
      }
    ];

    const extendedKnowledgeQuestions = [
      {
        _id: "4",
        question: "satellite.jpg",
        correctOption: "Mars",
        difficulty: 3,
        createdBy: "user4",
        type: "knowledge"
      }
    ];

    global.fetch = vi
      .fn()
      // Classic questions fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          questions: mockClassicQuestions,
          categories: ["General", "Meme God"]
        })
      })
      // Classic search questions fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => extendedClassicQuestions
      })
      // Knowledge questions fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            questions: mockKnowledgeQuestions,
            categories: ["General", "Meme God"]
          })
      })
      // Knowledge search questions fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => extendedKnowledgeQuestions
      });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText("What is 2 + 2?")).toBeInTheDocument();
    });

    await act(() => {
      const searchInput = screen.getByPlaceholderText(
        "Search by Questions/Options or Search by User Contributor"
      );
      fireEvent.change(searchInput, { target: { value: "5" } });
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenLastCalledWith(
        expect.stringContaining("/api/questions/search-classic?searchQuery=5"),
        expect.objectContaining({
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          }
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText("What is 5 + 5?")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("What is 5 + 5?"));
    await waitFor(() => {
      expect(screen.getByText("5 + 5 = 10")).toBeInTheDocument();
      expect(screen.getByText("Difficulty:")).toBeInTheDocument();
      expect(screen.getByText("Category:")).toBeInTheDocument();
      expect(screen.getByText("Correct Option:")).toBeInTheDocument();
      expect(screen.getByText("Explanation:")).toBeInTheDocument();
    });

    // Switch to knowledge tab
    await act(() => {
      const knowledgeButtons = screen.getAllByText("Knowledge");
      knowledgeButtons.forEach((btn) => fireEvent.click(btn));
    });

    await waitFor(() => {
      expect(screen.getByText("image.jpg")).toBeInTheDocument();
    });

    await act(() => {
      const searchInput = screen.getByPlaceholderText(
        "Search by Questions/Options or Search by User Contributor"
      );
      fireEvent.change(searchInput, { target: { value: "s" } });
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenLastCalledWith(
        expect.stringContaining(
          "/api/questions/search-knowledge?searchQuery=s"
        ),
        expect.objectContaining({
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          }
        })
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText("[Contributed by user4] Mars")
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("[Contributed by user4] Mars"));
    await waitFor(() => {
      expect(screen.getByText("Image:")).toBeInTheDocument();
      expect(screen.getByText("Difficulty:")).toBeInTheDocument();
      expect(screen.getByText("Answer:")).toBeInTheDocument();
      expect(screen.getByText("Contributor:")).toBeInTheDocument();
    });
  });
});
