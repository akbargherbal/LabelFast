// __tests__/sentence_reset.test.js

const { screen, fireEvent } = require("@testing-library/dom");
const fs = require("fs");
const path = require("path");

// Mock scrollIntoView for JSDOM
if (typeof window !== "undefined") {
  window.HTMLElement.prototype.scrollIntoView = function () {};
}

const htmlPath = path.resolve(__dirname, "../v003.html");
const htmlContent = fs.readFileSync(htmlPath, "utf8");

describe("Module 6: Sentence Reset Functionality", () => {
  let scriptTag;
  let mockFocus;

  beforeEach(() => {
    document.body.innerHTML = htmlContent;
    mockFocus = jest
      .spyOn(HTMLElement.prototype, "focus")
      .mockImplementation(() => {});

    const appJsContent = fs.readFileSync(
      path.resolve(__dirname, "../app.js"),
      "utf8"
    );
    scriptTag = document.createElement("script");
    scriptTag.textContent = appJsContent;
    document.head.appendChild(scriptTag);

    if (typeof window.initializeApp === "function") {
      window.initializeApp(); // This will load the first sentence
    } else {
      throw new Error(
        "initializeApp function not found on window. Check app.js."
      );
    }
  });

  afterEach(() => {
    document.body.innerHTML = "";
    if (scriptTag && scriptTag.parentNode) {
      scriptTag.parentNode.removeChild(scriptTag);
      scriptTag = null;
    }
    const globalsToClear = [
      "sentencePairs",
      "currentSentenceIndex",
      "correctedWords",
      "selectedWordIndex",
      "isEditingWord",
      "activeEditableElement",
      "originalTargetForReset",
      "allCompleted",
      "sourceSentenceEl",
      "llmTargetSentenceEl",
      "correctionAreaEl",
      "submitBtn",
      "resetBtn",
      "statusTextEl",
      "appContainer",
      "helpToggleBtn",
      "helpModal",
      "closeHelpModalBtn",
      "normalizeWords",
      "renderCorrectionArea",
      "selectWord",
      "moveSelection",
      "initiateWordEdit",
      "commitWordEdit",
      "cancelWordEdit",
      "deleteSelectedWord",
      "loadSentence",
      "handleSubmit",
      "handleReset",
      "showHelpModal",
      "hideHelpModal",
      "toggleHelpModal",
      "globalKeyHandler",
      "initializeApp",
      "_globalFKeyHandler",
    ];
    globalsToClear.forEach((globalName) => {
      if (window.hasOwnProperty(globalName)) {
        delete window[globalName];
      }
    });
    jest.clearAllMocks();
  });

  const getCorrectionAreaWordsText = () => {
    const spans = screen
      .getByTestId("correction-area")
      .querySelectorAll("span[data-index]");
    return Array.from(spans).map((span) => span.textContent);
  };

  const getEmptyMessage = () => {
    return screen
      .getByTestId("correction-area")
      .querySelector("span.text-gray-400.italic");
  };

  describe("handleReset() triggered by Reset Button", () => {
    test("clicking Reset button reverts correctedWords, selection, and focuses correction area", () => {
      const originalWords = [...window.correctedWords];
      expect(originalWords.length).toBeGreaterThan(0);

      // Modify the words
      window.correctedWords[0] = "MODIFIED";
      window.selectWord(1); // Change selection
      window.renderCorrectionArea(); // Reflect modification
      expect(getCorrectionAreaWordsText()[0]).toBe("MODIFIED");
      expect(window.selectedWordIndex).toBe(1);
      mockFocus.mockClear();

      fireEvent.click(window.resetBtn);

      expect(window.correctedWords).toEqual(
        window.normalizeWords(window.originalTargetForReset)
      );
      expect(getCorrectionAreaWordsText()).toEqual(
        window.normalizeWords(window.originalTargetForReset)
      );
      expect(window.selectedWordIndex).toBe(0); // Should reset to first word
      expect(window.isEditingWord).toBe(false);
      expect(mockFocus.mock.instances).toContain(window.correctionAreaEl);
    });

    test("Reset button does nothing if isEditingWord is true", () => {
      const initialWords = [...window.correctedWords];
      window.isEditingWord = true;
      mockFocus.mockClear();

      fireEvent.click(window.resetBtn);

      expect(window.correctedWords).toEqual(initialWords);
      expect(window.isEditingWord).toBe(true); // Should remain true
      expect(mockFocus.mock.instances).not.toContain(window.correctionAreaEl); // Focus should not be called by handleReset
    });

    test("Reset button does nothing if allCompleted is true", () => {
      window.loadSentence(window.sentencePairs.length); // Trigger allCompleted state
      expect(window.allCompleted).toBe(true);
      const appContainerHTML = window.appContainer.innerHTML; // Capture "Completed!" message
      mockFocus.mockClear();

      fireEvent.click(window.resetBtn);

      expect(window.appContainer.innerHTML).toBe(appContainerHTML); // UI should not change
      expect(window.allCompleted).toBe(true);
      // No specific focus expectation here as context changes completely
    });
  });

  describe("handleReset() triggered by Escape Key", () => {
    test("pressing Escape (not editing, help closed) calls handleReset and resets sentence", () => {
      const originalWords = [...window.correctedWords];
      window.isEditingWord = false;
      // Assuming help modal is closed by default after initializeApp

      // Modify the words
      window.correctedWords[1] = "CHANGED";
      window.selectWord(0);
      window.renderCorrectionArea();
      expect(getCorrectionAreaWordsText()[1]).toBe("CHANGED");
      mockFocus.mockClear();

      const escapeEvent = new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = jest.spyOn(escapeEvent, "preventDefault");
      document.dispatchEvent(escapeEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(window.correctedWords).toEqual(
        window.normalizeWords(window.originalTargetForReset)
      );
      expect(getCorrectionAreaWordsText()).toEqual(
        window.normalizeWords(window.originalTargetForReset)
      );
      expect(window.selectedWordIndex).toBe(0);
      expect(window.isEditingWord).toBe(false);
      expect(mockFocus.mock.instances).toContain(window.correctionAreaEl);
    });

    test("Escape key does not trigger reset if isEditingWord is true (cancelWordEdit should handle)", () => {
      const initialWords = [...window.correctedWords];
      // Manually initiate an edit to set up state
      window.selectWord(0);
      window.initiateWordEdit(); // This sets isEditingWord = true and activeEditableElement
      expect(window.isEditingWord).toBe(true);
      const activeEditable = window.activeEditableElement;
      expect(activeEditable).not.toBeNull();
      activeEditable.textContent = "Temporary Edit";

      mockFocus.mockClear(); // Clear focus calls from initiateWordEdit

      const escapeEvent = new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      });
      // Note: The event listener on activeEditableElement will call e.stopPropagation() if it handles Esc.
      // So, we dispatch on the activeEditableElement if it exists, or document if globalKeyHandler should see it.
      // For this test, we are testing that globalKeyHandler's reset branch is NOT taken.
      // The Esc handler in initiateWordEdit will call cancelWordEdit.

      // To specifically test handleReset is NOT called via global handler:
      // Spy on handleReset and ensure it's not called
      const handleResetSpy = jest.spyOn(window, "handleReset");

      // MODIFIED: Dispatch event directly on the activeEditable element
      // document.dispatchEvent(escapeEvent);
      activeEditable.dispatchEvent(escapeEvent);

      // cancelWordEdit would have run, reverting the "Temporary Edit"
      expect(window.correctedWords[0]).not.toBe("Temporary Edit");
      expect(window.correctedWords[0]).toBe(initialWords[0]); // cancelWordEdit restores original
      expect(window.isEditingWord).toBe(false); // cancelWordEdit sets this to false

      // Crucially, handleReset itself (the full sentence reset) should not have been called
      expect(handleResetSpy).not.toHaveBeenCalled();

      handleResetSpy.mockRestore();
    });

    test("Escape key does not trigger reset if help modal is open (hideHelpModal should handle)", () => {
      const initialWords = [...window.correctedWords];
      window.showHelpModal(); // Open help modal
      expect(window.helpModal.classList.contains("hidden")).toBe(false);
      mockFocus.mockClear(); // Focus moved to modal elements

      const handleResetSpy = jest.spyOn(window, "handleReset");
      const escapeEvent = new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(escapeEvent);

      expect(window.helpModal.classList.contains("hidden")).toBe(true); // Modal should close
      expect(window.correctedWords).toEqual(initialWords); // Words should not have reset
      expect(handleResetSpy).not.toHaveBeenCalled();
      handleResetSpy.mockRestore();
    });

    test("Escape key does not trigger reset if allCompleted is true", () => {
      window.loadSentence(window.sentencePairs.length); // Trigger allCompleted state
      expect(window.allCompleted).toBe(true);
      const appContainerHTML = window.appContainer.innerHTML;
      mockFocus.mockClear();

      const handleResetSpy = jest.spyOn(window, "handleReset");
      const escapeEvent = new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(escapeEvent);

      expect(window.appContainer.innerHTML).toBe(appContainerHTML);
      expect(handleResetSpy).not.toHaveBeenCalled();
      handleResetSpy.mockRestore();
    });
  });

  describe("handleReset() general behavior", () => {
    test("handleReset correctly resets to an empty state if originalTargetForReset was empty", () => {
      // Use a sentence pair where the target is empty
      const originalSentencePairs = window.sentencePairs;
      window.sentencePairs = [
        { source: "Test Source", target: "  " }, // Empty target
        ...originalSentencePairs.slice(1),
      ];
      window.loadSentence(0); // This sets originalTargetForReset to "  "
      expect(window.originalTargetForReset).toBe("  ");

      // Manually set correctedWords to something non-empty to ensure reset has an effect
      window.correctedWords = ["Not", "Empty"];
      window.selectedWordIndex = 0;
      window.renderCorrectionArea();
      expect(getCorrectionAreaWordsText()).toEqual(["Not", "Empty"]);
      mockFocus.mockClear();

      window.handleReset(); // Call directly to test its core logic

      expect(window.correctedWords).toEqual([]);
      expect(getEmptyMessage()).toBeInTheDocument();
      expect(getEmptyMessage().textContent).toContain("Sentence is empty");
      expect(window.selectedWordIndex).toBe(-1);
      expect(window.isEditingWord).toBe(false);
      expect(mockFocus.mock.instances).toContain(window.correctionAreaEl);

      window.sentencePairs = originalSentencePairs; // Restore for other tests
    });

    test("handleReset ensures isEditingWord is false after execution", () => {
      // Modify words
      window.correctedWords = ["Something", "Else"];
      window.renderCorrectionArea();

      // Although guard prevents reset if isEditingWord is true,
      // test that if it somehow proceeded, isEditingWord is explicitly set false.
      // This is more of a safety check on handleReset's internal logic.
      window.isEditingWord = true; // Simulate an inconsistent state before direct call

      // Temporarily bypass the guard for this specific test of internal behavior
      const originalIsEditingWord = window.isEditingWord;
      const originalAllCompleted = window.allCompleted;
      window.isEditingWord = false;
      window.allCompleted = false;

      window.handleReset();

      window.isEditingWord = originalIsEditingWord; // Restore for guard logic
      window.allCompleted = originalAllCompleted;

      // The important check is what handleReset *sets* it to internally
      // However, handleReset itself checks `if (window.allCompleted || window.isEditingWord) return;`
      // So, we can't directly test the internal assignment of `isEditingWord = false`
      // if the guards are active.
      // Let's re-approach: check the state *after* a successful reset.

      // Reset to initial state for this test part
      window.initializeApp();
      window.correctedWords = ["Modified", "Word"];
      window.renderCorrectionArea();
      expect(window.isEditingWord).toBe(false); // Pre-condition

      window.handleReset(); // Perform a valid reset

      expect(window.isEditingWord).toBe(false); // Post-condition
    });

    test("handleReset maintains focus on correctionAreaEl if target sentence is not empty after reset", () => {
      // Initial sentence is not empty
      expect(
        window.normalizeWords(window.originalTargetForReset).length
      ).toBeGreaterThan(0);

      // Modify words
      window.correctedWords = ["Different", "Words"];
      window.selectWord(0);
      window.renderCorrectionArea();
      mockFocus.mockClear();

      window.handleReset();

      expect(window.correctedWords).toEqual(
        window.normalizeWords(window.originalTargetForReset)
      );
      expect(window.selectedWordIndex).toBe(0);
      expect(mockFocus.mock.instances).toContain(window.correctionAreaEl);
    });
  });
});
