// __tests__/word_deletion.test.js

const { screen, within, fireEvent } = require("@testing-library/dom");
// userEvent is not strictly needed if direct fireEvent for keys is preferred for global handlers.
// const userEvent = require("@testing-library/user-event").default;
const fs = require("fs");
const path = require("path");

// Mock scrollIntoView for JSDOM
if (typeof window !== "undefined") {
  window.HTMLElement.prototype.scrollIntoView = function () {};
}

const htmlPath = path.resolve(__dirname, "../v003.html");
const htmlContent = fs.readFileSync(htmlPath, "utf8");

describe("Module 5: Word Deletion", () => {
  let scriptTag;
  let mockFocus; // For spying on HTMLElement.prototype.focus()

  beforeEach(() => {
    document.body.innerHTML = htmlContent;

    // Spy on HTMLElement.prototype.focus to check calls on specific elements
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
      "sentencePairs", "currentSentenceIndex", "correctedWords",
      "selectedWordIndex", "isEditingWord", "activeEditableElement",
      "originalTargetForReset", "allCompleted", "sourceSentenceEl",
      "llmTargetSentenceEl", "correctionAreaEl", "submitBtn", "resetBtn",
      "statusTextEl", "appContainer", "helpToggleBtn", "helpModal",
      "closeHelpModalBtn", "normalizeWords", "renderCorrectionArea",
      "selectWord", "moveSelection", "initiateWordEdit", "commitWordEdit",
      "cancelWordEdit", "deleteSelectedWord", "loadSentence", "handleSubmit",
      "handleReset", "showHelpModal", "hideHelpModal", "toggleHelpModal",
      "globalKeyHandler", "initializeApp", "_globalFKeyHandler",
    ];
    globalsToClear.forEach((globalName) => {
      if (window.hasOwnProperty(globalName)) {
        delete window[globalName];
      }
    });
    jest.clearAllMocks(); // Clears all mocks, including mockFocus
  });

  const getSelectedWordSpan = () => {
    if (window.selectedWordIndex === -1) return null;
    return screen
      .getByTestId("correction-area")
      .querySelector(`span[data-index="${window.selectedWordIndex}"]`);
  };

  const getCorrectionAreaWords = () => {
    const spans = screen.getByTestId("correction-area").querySelectorAll("span[data-index]");
    return Array.from(spans).map(span => span.textContent);
  };

  const getEmptyMessage = () => {
    return screen.getByTestId("correction-area").querySelector("span.text-gray-400.italic");
  }

  describe("deleteSelectedWord() function and its triggers (Delete/Backspace keys)", () => {
    test("pressing Delete key on selected word removes it, selects appropriately, calls preventDefault, and focuses correction area", () => {
      expect(window.selectedWordIndex).toBe(0);
      const initialWords = ["ليش", "عملت", "هذا", "الشيء", "يا", "رجال"];
      expect(window.correctedWords).toEqual(initialWords);

      window.correctionAreaEl.focus(); 
      mockFocus.mockClear(); 

      const deleteEvent = new KeyboardEvent('keydown', { key: 'Delete', code: 'Delete', bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(deleteEvent, 'preventDefault');
      document.dispatchEvent(deleteEvent); 

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(window.correctedWords).toEqual(["عملت", "هذا", "الشيء", "يا", "رجال"]);
      expect(window.selectedWordIndex).toBe(0); 
      expect(getSelectedWordSpan().textContent).toBe("عملت");
      expect(getCorrectionAreaWords()).toEqual(["عملت", "هذا", "الشيء", "يا", "رجال"]);
      expect(mockFocus.mock.instances).toContain(window.correctionAreaEl);
    });

    test("pressing Backspace key on selected word removes it and selects appropriately", () => {
      window.selectWord(1); 
      expect(window.selectedWordIndex).toBe(1);
      expect(window.correctedWords[1]).toBe("عملت");
      mockFocus.mockClear(); 

      window.correctionAreaEl.focus();
      const backspaceEvent = new KeyboardEvent('keydown', { key: 'Backspace', code: 'Backspace', bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(backspaceEvent, 'preventDefault');
      document.dispatchEvent(backspaceEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(window.correctedWords).toEqual(["ليش", "هذا", "الشيء", "يا", "رجال"]);
      expect(window.selectedWordIndex).toBe(1); 
      expect(getSelectedWordSpan().textContent).toBe("هذا");
      expect(mockFocus.mock.instances).toContain(window.correctionAreaEl);
    });

    test("deleting the last word selects the new last word", () => {
      const lastIndex = window.correctedWords.length - 1; 
      window.selectWord(lastIndex);
      expect(window.selectedWordIndex).toBe(lastIndex);
      mockFocus.mockClear();

      window.correctionAreaEl.focus();
      fireEvent.keyDown(document, { key: 'Delete', code: 'Delete' });

      expect(window.correctedWords).toEqual(["ليش", "عملت", "هذا", "الشيء", "يا"]);
      expect(window.selectedWordIndex).toBe(window.correctedWords.length - 1); 
      expect(getSelectedWordSpan().textContent).toBe("يا");
      expect(mockFocus.mock.instances).toContain(window.correctionAreaEl);
    });

    test("deleting a word in the middle selects the word that takes its place", () => {
      window.selectWord(2); 
      expect(window.selectedWordIndex).toBe(2);
      mockFocus.mockClear();

      window.correctionAreaEl.focus();
      fireEvent.keyDown(document, { key: 'Delete', code: 'Delete' });

      expect(window.correctedWords).toEqual(["ليش", "عملت", "الشيء", "يا", "رجال"]);
      expect(window.selectedWordIndex).toBe(2); 
      expect(getSelectedWordSpan().textContent).toBe("الشيء");
      expect(mockFocus.mock.instances).toContain(window.correctionAreaEl);
    });

    test("deleting the only word results in empty state and selectedWordIndex -1", () => {
      window.sentencePairs = [{ source: "Test", target: "SoloWord" }];
      window.loadSentence(0);
      expect(window.correctedWords).toEqual(["SoloWord"]);
      expect(window.selectedWordIndex).toBe(0);
      mockFocus.mockClear(); 

      window.correctionAreaEl.focus();
      fireEvent.keyDown(document, { key: 'Delete', code: 'Delete' });

      expect(window.correctedWords).toEqual([]);
      expect(window.selectedWordIndex).toBe(-1);
      expect(getEmptyMessage()).toBeInTheDocument();
      expect(getEmptyMessage()).toHaveTextContent("Sentence is empty. Use controls if needed.");
      expect(getCorrectionAreaWords()).toEqual([]);
      expect(mockFocus.mock.instances).toContain(window.correctionAreaEl);
    });

    // --- CORRECTLY NESTED TESTS START HERE ---
    test("should not delete if no word is selected (selectedWordIndex is -1)", () => {
      const originalWords = [...window.correctedWords];
      window.selectedWordIndex = -1;
      window.renderCorrectionArea(); 
      
      mockFocus.mockClear(); 
      
      window.correctionAreaEl.focus(); 
      const focusCallsBeforeAction = mockFocus.mock.instances.filter(
        instance => instance === window.correctionAreaEl
      ).length;

      fireEvent.keyDown(document, { key: 'Delete', code: 'Delete' }); 

      expect(window.correctedWords).toEqual(originalWords);
      expect(window.selectedWordIndex).toBe(-1);

      const focusCallsAfterAction = mockFocus.mock.instances.filter(
        instance => instance === window.correctionAreaEl
      ).length;
      expect(focusCallsAfterAction).toBe(focusCallsBeforeAction); 
    });

    test("should not delete if isEditingWord is true", () => {
      expect(window.selectedWordIndex).toBe(0); 
      const originalWords = [...window.correctedWords];
      
      mockFocus.mockClear(); 
      
      window.correctionAreaEl.focus();
      const focusCallsBeforeAction = mockFocus.mock.instances.filter(
        instance => instance === window.correctionAreaEl
      ).length;

      window.isEditingWord = true; 

      fireEvent.keyDown(document, { key: 'Delete', code: 'Delete' }); 

      expect(window.correctedWords).toEqual(originalWords);
      expect(window.selectedWordIndex).toBe(0); 
      
      const focusCallsAfterAction = mockFocus.mock.instances.filter(
        instance => instance === window.correctionAreaEl
      ).length;
      expect(focusCallsAfterAction).toBe(focusCallsBeforeAction); 
      
      window.isEditingWord = false; 
    });
    // --- CORRECTLY NESTED TESTS END HERE ---

  }); // Closes "deleteSelectedWord() function and its triggers (Delete/Backspace keys)"

  describe("deleteSelectedWord() direct function call tests", () => {
    test("calling deleteSelectedWord() directly when first word is selected", () => {
        window.selectWord(0); 
        mockFocus.mockClear();
        window.deleteSelectedWord();
        expect(window.correctedWords).toEqual(["عملت", "هذا", "الشيء", "يا", "رجال"]);
        expect(window.selectedWordIndex).toBe(0);
        expect(getSelectedWordSpan().textContent).toBe("عملت");
        expect(mockFocus.mock.instances).toContain(window.correctionAreaEl);
    });

    test("calling deleteSelectedWord() directly when last word is selected", () => {
        const lastIndex = window.correctedWords.length - 1;
        window.selectWord(lastIndex); 
        mockFocus.mockClear();
        window.deleteSelectedWord();
        expect(window.correctedWords).toEqual(["ليش", "عملت", "هذا", "الشيء", "يا"]);
        expect(window.selectedWordIndex).toBe(window.correctedWords.length - 1); 
        expect(getSelectedWordSpan().textContent).toBe("يا");
        expect(mockFocus.mock.instances).toContain(window.correctionAreaEl);
    });

    test("calling deleteSelectedWord() directly when only word is selected", () => {
        window.sentencePairs = [{ source: "Test", target: "Unique" }];
        window.loadSentence(0);
        expect(window.correctedWords).toEqual(["Unique"]);
        window.selectWord(0);
        mockFocus.mockClear();

        window.deleteSelectedWord();

        expect(window.correctedWords).toEqual([]);
        expect(window.selectedWordIndex).toBe(-1);
        expect(getEmptyMessage()).toBeInTheDocument();
        expect(mockFocus.mock.instances).toContain(window.correctionAreaEl);
    });

    test("deleteSelectedWord() calls correctionAreaEl.focus()", () => {
        window.selectWord(0); 
        mockFocus.mockClear(); 

        window.deleteSelectedWord();

        expect(mockFocus.mock.instances).toContain(window.correctionAreaEl);
    });
  }); // Closes "deleteSelectedWord() direct function call tests"

}); // Closes "Module 5: Word Deletion"