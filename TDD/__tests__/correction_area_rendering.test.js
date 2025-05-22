// __tests__/correction_area_rendering.test.js

const { screen, within } = require("@testing-library/dom");
const fs = require("fs");
const path = require("path");
// userEvent is not strictly needed for these direct DOM event tests, but can be kept if other tests use it.
// const userEvent = require("@testing-library/user-event").default;

// Mock scrollIntoView for JSDOM
if (typeof window !== "undefined") {
  window.HTMLElement.prototype.scrollIntoView = function () {};
}

const htmlPath = path.resolve(__dirname, "../v003.html");
const htmlContent = fs.readFileSync(htmlPath, "utf8");

describe("Module 2: Word Tokenization & Rendering in Correction Area", () => {
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
      window.initializeApp();
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
      "_globalFKeyHandler", // also clean up this helper
    ];
    globalsToClear.forEach((globalName) => {
      if (window.hasOwnProperty(globalName)) {
        delete window[globalName];
      }
    });
  });

  // --- Tests for normalizeWords() ---
  describe("normalizeWords() function", () => {
    test("should be available on window object after initialization", () => {
      expect(window.normalizeWords).toBeDefined();
      expect(typeof window.normalizeWords).toBe("function");
    });

    test("should split sentence with single spaces into words", () => {
      const sentence = "This is a test";
      expect(window.normalizeWords(sentence)).toEqual([
        "This",
        "is",
        "a",
        "test",
      ]);
    });

    test("should split sentence with multiple spaces between words and filter empty strings", () => {
      const sentence = "Word1  Word2   Word3";
      expect(window.normalizeWords(sentence)).toEqual([
        "Word1",
        "Word2",
        "Word3",
      ]);
    });

    test("should trim leading and trailing spaces from sentence", () => {
      const sentence = "  leading and trailing spaces  ";
      expect(window.normalizeWords(sentence)).toEqual([
        "leading",
        "and",
        "trailing",
        "spaces",
      ]);
    });

    test("should filter out empty strings resulting from various space combinations", () => {
      const sentence = "  one   two three  four ";
      expect(window.normalizeWords(sentence)).toEqual([
        "one",
        "two",
        "three",
        "four",
      ]);
    });

    test("should return an empty array for an empty string", () => {
      const sentence = "";
      expect(window.normalizeWords(sentence)).toEqual([]);
    });

    test("should return an empty array for a string with only spaces", () => {
      const sentence = "   ";
      expect(window.normalizeWords(sentence)).toEqual([]);
    });

    test("should handle a sentence with no spaces (single word)", () => {
      const sentence = "SingleWord";
      expect(window.normalizeWords(sentence)).toEqual(["SingleWord"]);
    });

    test("should handle a sentence with mixed casing", () => {
      const sentence = "Mixed Case Sentence";
      expect(window.normalizeWords(sentence)).toEqual([
        "Mixed",
        "Case",
        "Sentence",
      ]);
    });

    test("should handle non-alphanumeric characters as part of words (as per current logic)", () => {
      const sentence = "Hello, world! This is a test-case.";
      expect(window.normalizeWords(sentence)).toEqual([
        "Hello,",
        "world!",
        "This",
        "is",
        "a",
        "test-case.",
      ]);
    });
  });

  // --- Tests for renderCorrectionArea() ---
  describe("renderCorrectionArea() function", () => {
    test("should be available on window object after initialization", () => {
      expect(window.renderCorrectionArea).toBeDefined();
      expect(typeof window.renderCorrectionArea).toBe("function");
    });

    test("displays the 'Sentence is empty...' message when correctedWords is empty and not editing", () => {
      window.correctedWords = [];
      window.isEditingWord = false;
      window.renderCorrectionArea();

      const correctionArea = screen.getByTestId("correction-area");
      const emptyMessageSpan = correctionArea.querySelector(
        "span.text-gray-400.italic"
      );

      expect(emptyMessageSpan).toBeInTheDocument();
      expect(emptyMessageSpan).toHaveTextContent(
        "Sentence is empty. Use controls if needed."
      );
      expect(window.selectedWordIndex).toBe(-1);
    });

    test("correctly creates <span> elements for each word in correctedWords", () => {
      if (!window.correctedWords || window.correctedWords.length === 0) {
        window.correctedWords = ["Test", "Words", "Here"]; // Fallback if initial sentence was empty
        window.renderCorrectionArea();
      }
      const correctionArea = screen.getByTestId("correction-area");
      const wordSpans = correctionArea.querySelectorAll("span[data-index]");

      expect(window.correctedWords.length).toBeGreaterThan(0);
      expect(wordSpans.length).toBe(window.correctedWords.length);
    });

    test("each word <span> has the correct textContent and data-index", () => {
      const testWords = window.correctedWords;
      expect(testWords.length).toBeGreaterThan(0);

      const correctionArea = screen.getByTestId("correction-area");
      const wordSpans = correctionArea.querySelectorAll("span[data-index]");

      expect(wordSpans.length).toBe(testWords.length);

      wordSpans.forEach((span, index) => {
        expect(span.textContent).toBe(testWords[index]);
        expect(span.dataset.index).toBe(String(index));
      });
    });

    test("correctly applies selection classes to the selectedWordIndex span", () => {
      const initialWords = window.correctedWords;
      const initialSelectedIndex = window.selectedWordIndex;
      const correctionArea = screen.getByTestId("correction-area");

      if (initialWords.length > 0 && initialSelectedIndex !== -1) {
        expect(initialSelectedIndex).toBe(0);
        const selectedSpan = correctionArea.querySelector(
          `span[data-index="${initialSelectedIndex}"]`
        );
        expect(selectedSpan).toHaveClass("bg-sky-600", "text-white");
        expect(selectedSpan).not.toHaveClass("hover:bg-sky-100");

        if (initialWords.length > 1) {
          const unselectedSpans = correctionArea.querySelectorAll(
            "span[data-index]:not(.bg-sky-600)"
          );
          expect(unselectedSpans.length).toBe(initialWords.length - 1);
          unselectedSpans.forEach((span) => {
            expect(span).not.toHaveClass("bg-sky-600", "text-white");
            expect(span.className).toContain("hover:bg-sky-100");
          });
        }
      } else if (initialWords.length === 0) {
        const wordSpans = correctionArea.querySelectorAll("span[data-index]");
        expect(wordSpans.length).toBe(0);
        const emptyMessageSpan = correctionArea.querySelector(
          "span.text-gray-400.italic"
        );
        if (emptyMessageSpan) {
          expect(emptyMessageSpan).not.toHaveClass("bg-sky-600");
        }
      }

      if (initialWords.length > 1) {
        window.selectedWordIndex = 1;
        window.renderCorrectionArea();

        const newlySelectedSpan =
          correctionArea.querySelector(`span[data-index="1"]`);
        expect(newlySelectedSpan).toHaveClass("bg-sky-600", "text-white");
        expect(newlySelectedSpan).not.toHaveClass("hover:bg-sky-100");

        const previouslySelectedSpan =
          correctionArea.querySelector(`span[data-index="0"]`);
        expect(previouslySelectedSpan).not.toHaveClass(
          "bg-sky-600",
          "text-white"
        );
        expect(previouslySelectedSpan.className).toContain("hover:bg-sky-100");
      }

      if (initialWords.length > 0) {
        window.selectedWordIndex = -1;
        window.renderCorrectionArea();
        const wordSpansWithSelection =
          correctionArea.querySelectorAll("span.bg-sky-600");
        expect(wordSpansWithSelection.length).toBe(0);
      }
    });

    test("word span click updates selection correctly", () => {
      // Initial state from loadSentence(0): selectedWordIndex is 0.
      expect(window.selectedWordIndex).toBe(0);
      const correctionArea = screen.getByTestId("correction-area");
      const initialWords = window.correctedWords;
      expect(initialWords.length).toBeGreaterThan(0); // Ensure sentence has words

      // Target the second word (index 1) if it exists
      const targetIndex = 1;
      if (initialWords.length <= targetIndex) {
        console.warn(
          "Skipping click test part as not enough words for targetIndex=1"
        );
        return; // Or throw error if test expects multiple words
      }
      const spanToClick = correctionArea.querySelector(
        `span[data-index="${targetIndex}"]`
      );
      expect(spanToClick).toBeInTheDocument();

      window.isEditingWord = false;
      spanToClick.click(); // Direct DOM click

      expect(window.selectedWordIndex).toBe(targetIndex);
    });

    test("word span dblclick triggers initiateWordEdit effects", () => {
      // Initial state from loadSentence(0): selectedWordIndex is 0.
      const initialWords = window.correctedWords;
      expect(initialWords.length).toBeGreaterThan(0);
      const correctionArea = screen.getByTestId("correction-area");

      const targetIndex = 0; // DblClick the first word
      const spanToDblClick = correctionArea.querySelector(
        `span[data-index="${targetIndex}"]`
      );
      expect(spanToDblClick).toBeInTheDocument();

      window.isEditingWord = false; // Pre-condition
      expect(window.selectedWordIndex).toBe(targetIndex); // Ensure it's selected first

      // Dispatch dblclick event
      const dblClickEvent = new MouseEvent("dblclick", {
        bubbles: true,
        cancelable: true,
        composed: true,
      });
      spanToDblClick.dispatchEvent(dblClickEvent);

      // After dblclick, selectWord(targetIndex) and then initiateWordEdit() should have run
      expect(window.selectedWordIndex).toBe(targetIndex); // Selection remains/is confirmed
      expect(window.isEditingWord).toBe(true); // Editing mode is active
    });
  });
});
