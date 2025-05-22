// __tests__/initial_load.test.js

const { screen, within, queryByText } = require("@testing-library/dom");
const fs = require("fs");
const path = require("path");

// Mock scrollIntoView for JSDOM
if (typeof window !== "undefined") {
  window.HTMLElement.prototype.scrollIntoView = function () {};
}

const htmlPath = path.resolve(__dirname, "../v003.html");
const htmlContent = fs.readFileSync(htmlPath, "utf8");

// We don't need to read appJsContent and inject it anymore.
// We will load app.js via a <script src="..."> tag and then call initializeApp.

describe("Module 1: Initial State & Sentence Loading", () => {
  let scriptTag; // To hold reference to the script tag for cleanup

  beforeEach(() => {
    // 1. Set up the document body with HTML content
    document.body.innerHTML = htmlContent;

    // 2. Load the app.js script. This makes initializeApp available on window.
    //    We append to body to ensure it runs after DOM elements are available.
    //    Or head if it's self-contained and uses DOMContentLoaded.
    scriptTag = document.createElement("script");
    scriptTag.src = "../app.js"; // Relative path from v003.html to app.js
    // JSDOM needs to be able to resolve this.
    // For local file system, it might need to be an absolute path
    // or Jest needs to be configured to serve it.
    // A more robust way for complex setups is to bundle.
    // For now, let's try with a simple approach.
    // Let's revert to injecting content, it's more reliable for this setup.

    // Revert to injecting script content, simpler for this phase than handling src resolution
    const appJsContent = fs.readFileSync(
      path.resolve(__dirname, "../app.js"),
      "utf8"
    );
    scriptTag = document.createElement("script");
    scriptTag.textContent = appJsContent;
    document.head.appendChild(scriptTag);

    // 3. Call the initialization function now that it's loaded.
    if (typeof window.initializeApp === "function") {
      window.initializeApp();
    } else {
      throw new Error(
        "initializeApp function not found on window. Check app.js."
      );
    }
  });

  afterEach(() => {
    // Clean up the DOM
    document.body.innerHTML = "";

    // Remove the script tag
    if (scriptTag && scriptTag.parentNode) {
      scriptTag.parentNode.removeChild(scriptTag);
      scriptTag = null;
    }

    // Clean up globals set by initializeApp
    // This list should match what initializeApp exposes to window
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
      // 'isHelpModalOpen', // No longer global if kept local in initializeApp
      // 'elementThatHadFocusBeforeModal', // No longer global
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
      "initializeApp", // also remove the initializer itself
    ];

    globalsToClear.forEach((globalName) => {
      if (window.hasOwnProperty(globalName)) {
        delete window[globalName];
      }
    });
  });

  // ... (rest of your test cases - they should now work as window.sentencePairs etc. are set by initializeApp)
  // Example for the first test:
  test("should display source, LLM target, and initial correction for the first sentence", () => {
    // initializeApp() in beforeEach should have set up window.sentencePairs etc.
    expect(window.sentencePairs).toBeDefined(); // Good first check
    const firstPair = window.sentencePairs[0];

    const sourceSentenceEl = screen.getByTestId("source-sentence");
    expect(sourceSentenceEl).toHaveTextContent(firstPair.source);

    const llmTargetSentenceEl = screen.getByTestId("llm-target-sentence");
    expect(llmTargetSentenceEl).toHaveTextContent(firstPair.target);

    const correctionArea = screen.getByTestId("correction-area");
    expect(window.normalizeWords).toBeDefined(); // Check if function is on window
    const initialCorrectionWords = window.normalizeWords(firstPair.target);
    initialCorrectionWords.forEach((word) => {
      expect(within(correctionArea).getByText(word)).toBeInTheDocument();
    });
  });

  test('should display status text "Sentence 1 of X"', () => {
    const totalSentences = window.sentencePairs.length;
    const statusTextEl = screen.getByTestId("status-text");
    expect(statusTextEl).toHaveTextContent(`Sentence 1 of ${totalSentences}`);
  });

  test("should select the first word by default if the initial target sentence is not empty", () => {
    const firstPair = window.sentencePairs[0];
    if (window.normalizeWords(firstPair.target).length > 0) {
      const correctionArea = screen.getByTestId("correction-area");
      const firstWordText = window.normalizeWords(firstPair.target)[0];
      const firstWordSpan = within(correctionArea).getByText(firstWordText);

      expect(firstWordSpan).toHaveClass("bg-sky-600", "text-white");
      expect(window.selectedWordIndex).toBe(0);
    } else {
      console.warn(
        "Skipping first word selection test as target is empty (unexpected for current data)"
      );
    }
  });

  test("should not select any word and show empty message if the initial target sentence is empty", () => {
    // For this test, we need to re-initialize with different data.
    // So, we call initializeApp again after modifying window.sentencePairs for the test scope.
    // The beforeEach already ran initializeApp with default data.

    // Modify sentencePairs on window (which initializeApp will use if it reads from window.sentencePairs)
    // OR, better, modify the sentencePairs *inside* app.js and make initializeApp use THAT.
    // For now, let's assume initializeApp uses the sentencePairs array defined within its own scope.
    // This means we need a way to make initializeApp use *different* sentencePairs for this test.
    // This points to a refinement in initializeApp: it could take initial data as a parameter.

    // TEMPORARY WORKAROUND for this specific test:
    // We will manually call loadSentence with our test-specific data.
    // This bypasses the sentencePairs defined inside initializeApp for this specific call.
    // This test will likely need adjustment once initializeApp is more flexible.

    // Clean slate by calling initializeApp again, but how to pass different data?
    // This current test structure for "empty sentence" is problematic with the new app.js structure.
    // Let's simplify this test FOR NOW to just check loadSentence's behavior when given an empty target.
    // We'll call loadSentence directly.

    // Store original sentencePairs to restore them if needed, though initializeApp should reset
    const originalGlobalSentencePairs = window.sentencePairs; // Save from previous initializeApp call

    window.sentencePairs = [{ source: "Test source for empty", target: " " }]; // Set for loadSentence call
    window.currentSentenceIndex = 0; // Reset current index for loadSentence
    window.loadSentence(0); // Manually call loadSentence with new data

    const correctionArea = screen.getByTestId("correction-area");
    expect(
      within(correctionArea).getByText(/Sentence is empty/i)
    ).toBeInTheDocument();
    expect(window.selectedWordIndex).toBe(-1);

    // Restore sentencePairs for subsequent tests (beforeEach will run initializeApp again)
    window.sentencePairs = originalGlobalSentencePairs;
  });

  test("loadSentence should correctly set originalTargetForReset", () => {
    const firstPair = window.sentencePairs[0];
    expect(window.originalTargetForReset).toBe(firstPair.target);

    if (window.sentencePairs.length > 1) {
      window.loadSentence(1); // This will use the sentencePairs set up by initializeApp
      const secondPair = window.sentencePairs[1]; // This should be the second pair from app.js
      expect(window.originalTargetForReset).toBe(secondPair.target);
    }
  });

  test('should display "Completed!" message when loadSentence is called with an out-of-bounds index', () => {
    const outOfBoundsIndex = window.sentencePairs.length; // Uses sentencePairs from initializeApp
    window.loadSentence(outOfBoundsIndex);

    const appContainer = screen.getByTestId("app-container");
    expect(within(appContainer).getByText("Completed!")).toBeInTheDocument();
    expect(
      within(appContainer).getByText(/All sentences have been processed/i)
    ).toBeInTheDocument();
    expect(window.allCompleted).toBe(true);

    const helpToggleBtn = screen.getByTestId("help-toggle-button"); // Use getByTestId if we expect it to be there
    expect(helpToggleBtn).toHaveClass("hidden");
  });

  test("normalizeWords (via loadSentence) correctly handles sentences with various spacing", () => {
    // Similar to the empty sentence test, this requires influencing the data loadSentence uses.
    // For now, we'll call loadSentence directly after setting a temporary window.sentencePairs.
    const originalGlobalSentencePairs = window.sentencePairs;

    window.sentencePairs = [
      { source: "Spacing test", target: "  word1   word2  " },
    ];
    window.currentSentenceIndex = 0;
    window.loadSentence(0);

    const correctionArea = screen.getByTestId("correction-area");
    expect(within(correctionArea).getByText("word1")).toBeInTheDocument();
    expect(within(correctionArea).getByText("word2")).toBeInTheDocument();

    const wordSpans = correctionArea.querySelectorAll("span[data-index]");
    expect(wordSpans.length).toBe(2);
    expect(window.correctedWords).toEqual(["word1", "word2"]);

    window.sentencePairs = originalGlobalSentencePairs;
  });
});
