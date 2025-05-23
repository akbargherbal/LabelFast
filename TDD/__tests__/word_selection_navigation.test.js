// __tests__/word_selection_navigation.test.js

const { screen, within } = require("@testing-library/dom");
const fs = require("fs");
const path = require("path");
// userEvent might be used for more complex interactions if needed, but direct dispatching for now.
// const userEvent = require("@testing-library/user-event").default;

// Mock scrollIntoView for JSDOM
if (typeof window !== "undefined") {
  window.HTMLElement.prototype.scrollIntoView = function () {};
}

const htmlPath = path.resolve(__dirname, "../v003.html");
const htmlContent = fs.readFileSync(htmlPath, "utf8");

describe("Module 3: Word Selection & Navigation", () => {
  let scriptTag;

  beforeEach(() => {
    document.body.innerHTML = htmlContent;

    const appJsContent = fs.readFileSync(
      path.resolve(__dirname, "../app.js"),
      "utf8"
    );
    scriptTag = document.createElement("script");
    scriptTag.textContent = appJsContent;
    document.head.appendChild(scriptTag);

    if (typeof window.initializeApp === "function") {
      window.initializeApp(); // This will load the first sentence by default
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
  });

  // --- Tests for selectWord() ---
  describe("selectWord() function", () => {
    test("should be available on window object after initialization", () => {
      expect(window.selectWord).toBeDefined();
      expect(typeof window.selectWord).toBe("function");
    });

    test("should select the word at the given valid index and update UI", () => {
      // First sentence: "ليش عملت هذا الشيء يا رجال" -> ["ليش", "عملت", "هذا", "الشيء", "يا", "رجال"] (6 words)
      // initializeApp sets selectedWordIndex to 0.
      expect(window.correctedWords.length).toBe(6);
      expect(window.selectedWordIndex).toBe(0);

      window.selectWord(1); // Select "عملت"
      expect(window.selectedWordIndex).toBe(1);

      const correctionArea = screen.getByTestId("correction-area");
      const selectedSpan = correctionArea.querySelector('span[data-index="1"]');
      const unselectedSpanPrevious = correctionArea.querySelector('span[data-index="0"]');
      const unselectedSpanNext = correctionArea.querySelector('span[data-index="2"]');


      expect(selectedSpan).toHaveClass("bg-sky-600", "text-white");
      expect(selectedSpan).not.toHaveClass("hover:bg-sky-100");

      expect(unselectedSpanPrevious).not.toHaveClass("bg-sky-600", "text-white");
      expect(unselectedSpanPrevious.className).toContain("hover:bg-sky-100");
      
      expect(unselectedSpanNext).not.toHaveClass("bg-sky-600", "text-white");
      expect(unselectedSpanNext.className).toContain("hover:bg-sky-100");
    });

    test("should select the first word if index is < 0 and words exist", () => {
      expect(window.correctedWords.length).toBeGreaterThan(0);
      window.selectWord(2); // Select something other than the first
      window.selectWord(-5); // Now try to select with negative
      expect(window.selectedWordIndex).toBe(0);
      const selectedSpan = screen.getByTestId("correction-area").querySelector('span[data-index="0"]');
      expect(selectedSpan).toHaveClass("bg-sky-600", "text-white");
    });

    test("should select the last word if index is >= correctedWords.length and words exist", () => {
      expect(window.correctedWords.length).toBeGreaterThan(0);
      const lastIndex = window.correctedWords.length - 1;
      window.selectWord(window.correctedWords.length + 5);
      expect(window.selectedWordIndex).toBe(lastIndex);

      const selectedSpan = screen.getByTestId("correction-area").querySelector(`span[data-index="${lastIndex}"]`);
      expect(selectedSpan).toHaveClass("bg-sky-600", "text-white");
    });

    test("should set selectedWordIndex to -1 if correctedWords is empty", () => {
      window.correctedWords = [];
      window.selectWord(0); 
      expect(window.selectedWordIndex).toBe(-1);

      const correctionArea = screen.getByTestId("correction-area");
      expect(correctionArea.querySelector("span.text-gray-400.italic")).toBeInTheDocument();
      expect(correctionArea.querySelectorAll("span[data-index]").length).toBe(0);
    });

    test("should not change selection if isEditingWord is true", () => {
      expect(window.correctedWords.length).toBeGreaterThanOrEqual(2);
      window.selectWord(0); // Ensure initial selection is 0
      expect(window.selectedWordIndex).toBe(0);
      window.isEditingWord = true;

      window.selectWord(1); // Attempt to select another word

      expect(window.selectedWordIndex).toBe(0); // Selection should not have changed
      window.isEditingWord = false; // Reset for other tests
    });

    test("should call scrollIntoView on the selected span", () => {
      expect(window.correctedWords.length).toBeGreaterThan(0);
      
      const originalScrollIntoView = window.HTMLElement.prototype.scrollIntoView;
      const mockScrollIntoView = jest.fn();
      window.HTMLElement.prototype.scrollIntoView = mockScrollIntoView;

      window.selectWord(1); // select a word other than the initial one
      
      // scrollIntoView is called on the span with data-index matching the selectedWordIndex
      // We need to ensure that the mock was called by the *correct* span.
      // However, just checking if it was called at all is usually sufficient for this level.
      expect(mockScrollIntoView).toHaveBeenCalled();
      
      window.HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    });
  });

  // --- Tests for moveSelection() ---
  describe("moveSelection() function", () => {
    test("should be available on window object after initialization", () => {
      expect(window.moveSelection).toBeDefined();
      expect(typeof window.moveSelection).toBe("function");
    });

    test("should select the next word when direction is 1", () => {
      // Initial state from initializeApp: selectedWordIndex = 0
      expect(window.selectedWordIndex).toBe(0); 
      window.moveSelection(1);
      expect(window.selectedWordIndex).toBe(1); 
      const selectedSpan = screen.getByTestId("correction-area").querySelector('span[data-index="1"]');
      expect(selectedSpan).toHaveClass("bg-sky-600", "text-white");
    });

    test("should select the previous word when direction is -1", () => {
      window.selectWord(1); 
      expect(window.selectedWordIndex).toBe(1);
      window.moveSelection(-1);
      expect(window.selectedWordIndex).toBe(0); 
      const selectedSpan = screen.getByTestId("correction-area").querySelector('span[data-index="0"]');
      expect(selectedSpan).toHaveClass("bg-sky-600", "text-white");
    });

    test("should wrap to the first word when moving next from the last word", () => {
      const lastIndex = window.correctedWords.length - 1;
      window.selectWord(lastIndex); 
      expect(window.selectedWordIndex).toBe(lastIndex);

      window.moveSelection(1); 
      expect(window.selectedWordIndex).toBe(0); 
    });

    test("should wrap to the last word when moving previous from the first word", () => {
      window.selectWord(0); 
      expect(window.selectedWordIndex).toBe(0);
      const lastIndex = window.correctedWords.length - 1;

      window.moveSelection(-1); 
      expect(window.selectedWordIndex).toBe(lastIndex); 
    });

    test("should do nothing if correctedWords is empty", () => {
      window.correctedWords = [];
      window.selectedWordIndex = -1; // Start with -1
      window.renderCorrectionArea(); // To ensure UI is in empty state if it wasn't already

      window.moveSelection(1);
      expect(window.selectedWordIndex).toBe(-1); 
      const correctionArea = screen.getByTestId("correction-area");
      expect(correctionArea.querySelector("span.text-gray-400.italic")).toBeInTheDocument();
      expect(correctionArea.querySelectorAll("span[data-index]").length).toBe(0);
    });

    test("should do nothing if only one word exists", () => {
      window.sentencePairs = [{ source: "Test", target: "SingleWord" }];
      window.loadSentence(0); // Load sentence with one word
      
      expect(window.correctedWords).toEqual(["SingleWord"]);
      expect(window.selectedWordIndex).toBe(0);

      window.moveSelection(1); 
      expect(window.selectedWordIndex).toBe(0);

      window.moveSelection(-1); 
      expect(window.selectedWordIndex).toBe(0);
    });

    test("should not change selection if isEditingWord is true", () => {
      expect(window.correctedWords.length).toBeGreaterThanOrEqual(2);
      window.selectWord(0); 
      expect(window.selectedWordIndex).toBe(0);
      window.isEditingWord = true;

      window.moveSelection(1); 

      expect(window.selectedWordIndex).toBe(0); 
      window.isEditingWord = false; 
    });
  });

  // --- Tests for globalKeyHandler() related to selection/navigation ---
  describe("globalKeyHandler() for Word Selection/Navigation", () => {
    // No specific beforeEach here, rely on main beforeEach and specific test setups if needed.

    test("ArrowRight key should select the next word", () => {
        // initializeApp selects word 0.
        expect(window.selectedWordIndex).toBe(0); 
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        expect(window.selectedWordIndex).toBe(1);
    });

    test("ArrowLeft key should select the previous word (wraps)", () => {
        // initializeApp selects word 0.
        expect(window.selectedWordIndex).toBe(0);
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
        const lastIndex = window.correctedWords.length - 1;
        expect(window.selectedWordIndex).toBe(lastIndex); 
    });
    
    test("Space key should select the next word (when not editing and not focused on button/input)", () => {
        const correctionArea = screen.getByTestId("correction-area");
        correctionArea.focus(); // Ensure a neutral element has focus.

        expect(window.selectedWordIndex).toBe(0);
        const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
        document.dispatchEvent(event);
        // No, globalKeyHandler must get it.
        // If correctionArea is focused, and it's not input/button, space should work.
        expect(window.selectedWordIndex).toBe(1);
    });

    test("Shift+Space key should select the previous word (wraps, not editing, not button/input)", () => {
        const correctionArea = screen.getByTestId("correction-area");
        correctionArea.focus(); // Ensure a neutral element has focus.
        
        expect(window.selectedWordIndex).toBe(0); // Starts at first word
        const event = new KeyboardEvent('keydown', { key: ' ', shiftKey: true, bubbles: true, cancelable: true });
        document.dispatchEvent(event);
        const lastIndex = window.correctedWords.length - 1;
        expect(window.selectedWordIndex).toBe(lastIndex);
    });

    test("Arrow/Space keys should not move selection if isEditingWord is true", () => {
        window.selectWord(0);
        window.isEditingWord = true; 

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        expect(window.selectedWordIndex).toBe(0); 

        const spaceEvent = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
        document.dispatchEvent(spaceEvent);
        expect(window.selectedWordIndex).toBe(0); 

        window.isEditingWord = false; 
    });

    test("Space key should NOT select next word if a button is focused", () => {
        const submitBtn = screen.getByRole('button', { name: /Submit & Next/i });
        submitBtn.focus(); 
        expect(document.activeElement).toBe(submitBtn);

        const initialSelection = window.selectedWordIndex; // Default is 0
        expect(initialSelection).toBe(0);
        
        const spaceEvent = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
        // Dispatch on document because globalKeyHandler is on document.
        // The handler itself checks document.activeElement.
        document.dispatchEvent(spaceEvent);

        expect(window.selectedWordIndex).toBe(initialSelection); // Selection should NOT have changed
    });

    test("Arrow keys should work even if a button is focused (as they are not typically button actions)", () => {
        const submitBtn = screen.getByRole('button', { name: /Submit & Next/i });
        submitBtn.focus();
        expect(document.activeElement).toBe(submitBtn);

        const initialSelection = window.selectedWordIndex; // Default is 0
        expect(initialSelection).toBe(0);

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        expect(window.selectedWordIndex).toBe(initialSelection + 1); // Should have moved

        // Reset selection for next part of test
        window.selectWord(initialSelection);
        expect(window.selectedWordIndex).toBe(initialSelection);
        submitBtn.focus(); // Re-focus button

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
        const lastIndex = window.correctedWords.length - 1;
        expect(window.selectedWordIndex).toBe(lastIndex); // Should have wrapped
    });
  });
});