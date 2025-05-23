// app.js

function initializeApp() {
  // Use the data injected from the HTML template
  const sentencePairs =
    typeof sentencePairsGlobalData !== "undefined"
      ? sentencePairsGlobalData
      : [];
  // Ensure it's available on window if other functions outside initializeApp expect it this way
  // or pass it around as needed. For minimal change, we re-assign to window.sentencePairs
  window.sentencePairs = sentencePairs;

  let currentSentenceIndex = 0;
  let correctedWords = []; // This is locally scoped to initializeApp
  let isEditingWord = false;
  let activeEditableElement = null;
  let originalTargetForReset = "";
  let allCompleted = false;

  // DOM Elements assigned to window scope
  window.sourceSentenceEl = document.getElementById("sourceSentence");
  window.llmTargetSentenceEl = document.getElementById("llmTargetSentence");
  window.correctionAreaEl = document.getElementById("correctionArea");
  window.submitBtn = document.getElementById("submitBtn");
  window.resetBtn = document.getElementById("resetBtn");
  window.statusTextEl = document.getElementById("statusText");
  window.appContainer = document.getElementById("appContainer");

  window.helpToggleBtn = document.getElementById("helpToggleBtn");
  window.helpModal = document.getElementById("helpModal");
  window.closeHelpModalBtn = document.getElementById("closeHelpModalBtn");
  let isHelpModalOpen = false; // Local to initializeApp, managed by help functions
  let elementThatHadFocusBeforeModal; // Local to initializeApp

  // Global state variables assigned to window scope
  window.sentencePairs = sentencePairs; // Make sentencePairs accessible globally if needed by tests or other modules
  window.currentSentenceIndex = currentSentenceIndex;
  window.correctedWords = correctedWords; // window.correctedWords will be initially []
  window.selectedWordIndex = -1; // Default selection
  window.isEditingWord = isEditingWord;
  window.activeEditableElement = activeEditableElement;
  window.originalTargetForReset = originalTargetForReset;
  window.allCompleted = allCompleted;

  function normalizeWords(sentence) {
    return sentence.split(/\s+/).filter((word) => word.length > 0);
  }
  window.normalizeWords = normalizeWords;

  function renderCorrectionArea() {
    window.correctionAreaEl.innerHTML = "";
    if (window.correctedWords.length === 0 && !window.isEditingWord) {
      window.correctionAreaEl.innerHTML = `<span class="text-gray-400 italic">Sentence is empty. Use controls if needed.</span>`;
      window.selectedWordIndex = -1; // Ensure selection is cleared
      return;
    }

    window.correctedWords.forEach((word, index_in_foreach) => {
      const wordSpan = document.createElement("span");
      wordSpan.textContent = word;
      wordSpan.dataset.index = index_in_foreach;
      wordSpan.className = `p-1 rounded cursor-pointer hover:bg-sky-100 transition-colors duration-150 ease-in-out inline-block`;

      if (
        index_in_foreach === window.selectedWordIndex &&
        !window.isEditingWord
      ) {
        wordSpan.classList.add("bg-sky-600", "text-white");
        wordSpan.classList.remove("hover:bg-sky-100");
      }

      wordSpan.addEventListener("click", function handleClick() {
        if (window.isEditingWord) {
          // If editing, clicks on other words should ideally commit current edit or do nothing
          // For now, they do nothing.
          return;
        }
        selectWord(index_in_foreach);
      });

      wordSpan.addEventListener("dblclick", function handleDblClick() {
        if (window.isEditingWord) {
          return; // Don't initiate new edit if already editing
        }
        selectWord(index_in_foreach); // Select first
        initiateWordEdit(); // Then initiate edit
      });
      window.correctionAreaEl.appendChild(wordSpan);
    });

    // Add a zero-width span to ensure the flex container has a baseline
    // if all words are short and don't wrap, to maintain consistent height/gap.
    const flexGapFix = document.createElement("span");
    flexGapFix.className = "w-0 h-0 p-0 m-0"; // Or some other minimal, non-visible element
    window.correctionAreaEl.appendChild(flexGapFix);
  }
  window.renderCorrectionArea = renderCorrectionArea;

  function selectWord(index) {
    if (window.isEditingWord) {
      return;
    }

    if (window.correctedWords.length === 0) {
      window.selectedWordIndex = -1;
    } else {
      if (index < 0) {
        window.selectedWordIndex = 0;
      } else if (index >= window.correctedWords.length) {
        window.selectedWordIndex = window.correctedWords.length - 1;
      } else {
        window.selectedWordIndex = index;
      }
    }

    renderCorrectionArea(); // Re-render to apply/remove selection classes
    const selectedSpan = window.correctionAreaEl.querySelector(
      `span[data-index='${window.selectedWordIndex}']`
    );
    if (selectedSpan) {
      selectedSpan.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }
  }
  window.selectWord = selectWord;

  function moveSelection(direction) {
    if (window.isEditingWord || window.correctedWords.length === 0) {
      return;
    }
    let newIndex = window.selectedWordIndex + direction;
    if (newIndex < 0) {
      newIndex = window.correctedWords.length - 1; // Wrap to last
    } else if (newIndex >= window.correctedWords.length) {
      newIndex = 0; // Wrap to first
    }
    selectWord(newIndex);
  }
  window.moveSelection = moveSelection;

  function initiateWordEdit() {
    if (
      window.isEditingWord ||
      window.selectedWordIndex < 0 ||
      window.selectedWordIndex >= window.correctedWords.length
    ) {
      return;
    }
    window.isEditingWord = true;
    const wordToEdit = window.correctedWords[window.selectedWordIndex];
    const wordSpanToReplace = window.correctionAreaEl.querySelector(
      `span[data-index='${window.selectedWordIndex}']`
    );

    if (!wordSpanToReplace) {
      window.isEditingWord = false; // Should not happen if selectedWordIndex is valid
      return;
    }

    window.activeEditableElement = document.createElement("span");
    window.activeEditableElement.contentEditable = "true";
    window.activeEditableElement.textContent = wordToEdit;
    window.activeEditableElement.className =
      "editable-word p-1 border border-blue-700 rounded shadow-sm focus:ring-2 focus:ring-blue-500 text-lg bg-white"; // Added bg-white for better visibility
    window.activeEditableElement.dir = window.correctionAreaEl.dir; // Match text direction

    window.activeEditableElement.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault(); // Prevent newline in contenteditable
        e.stopPropagation(); // Prevent global handler from re-triggering edit
        commitWordEdit();
      } else if (e.key === "Escape") {
        e.preventDefault(); // Prevent other Esc actions
        e.stopPropagation(); // Prevent global handler
        cancelWordEdit();
      }
      // Allow other keys like space, characters, arrows to be handled by contenteditable
    });

    window.activeEditableElement.addEventListener("blur", () => {
      // Use a small timeout to allow click on another button (like submit) to process first
      // or to allow Escape/Enter handlers to run before blur commits.
      setTimeout(() => {
        if (window.isEditingWord && window.activeEditableElement)
          commitWordEdit();
      }, 0); // setTimeout with 0ms defers execution until after current call stack
    });

    wordSpanToReplace.replaceWith(window.activeEditableElement);
    window.activeEditableElement.focus(); // Focus the new editable element

    // Select all text within the contenteditable span
    const range = document.createRange();
    range.selectNodeContents(window.activeEditableElement);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
  window.initiateWordEdit = initiateWordEdit;

  function commitWordEdit() {
    if (!window.isEditingWord || !window.activeEditableElement) return;

    const newWord = window.activeEditableElement.textContent.trim();
    const originalIndexOfEditedWord = window.selectedWordIndex;

    if (newWord) {
      window.correctedWords[originalIndexOfEditedWord] = newWord;
    } else {
      // Word was made empty, so delete it
      window.correctedWords.splice(originalIndexOfEditedWord, 1);
    }

    window.isEditingWord = false;
    window.activeEditableElement = null;
    // renderCorrectionArea(); // selectWord below will call this

    // Determine new selection after commit
    if (window.correctedWords.length === 0) {
      selectWord(-1); // No words left, clear selection
    } else {
      if (newWord) {
        // Word was edited (not made empty)
        if (originalIndexOfEditedWord + 1 < window.correctedWords.length) {
          selectWord(originalIndexOfEditedWord + 1); // Move to next word
        } else {
          // It was the last word or became the last after an edit (no length change)
          selectWord(originalIndexOfEditedWord); // Stay on current (now new text, same index)
        }
      } else {
        // Word was made empty and thus deleted
        if (window.correctedWords.length === 0) {
          selectWord(-1);
        } else if (originalIndexOfEditedWord < window.correctedWords.length) {
          // If there's a word at the original index (something shifted into it)
          selectWord(originalIndexOfEditedWord);
        } else {
          // If the deleted word was the last one, select the new last word
          selectWord(window.correctedWords.length - 1);
        }
      }
    }
    window.correctionAreaEl.focus(); // Return focus to the general correction area
  }
  window.commitWordEdit = commitWordEdit;

  function cancelWordEdit() {
    if (!window.isEditingWord) return;

    // No changes to correctedWords needed, just revert UI
    window.isEditingWord = false;
    window.activeEditableElement = null;
    // renderCorrectionArea(); // selectWord below will call this

    // Restore selection to the word that was being edited
    if (window.selectedWordIndex !== -1 && window.correctedWords.length > 0) {
      selectWord(window.selectedWordIndex);
    } else if (window.correctedWords.length === 0) {
      // Should not happen if we were editing a word, but as a safeguard
      selectWord(-1);
    }
    window.correctionAreaEl.focus(); // Return focus to the general correction area
  }
  window.cancelWordEdit = cancelWordEdit;

  // --- START OF MODIFIED deleteSelectedWord ---
  function deleteSelectedWord() {
    if (
      window.isEditingWord ||
      window.selectedWordIndex < 0 ||
      window.selectedWordIndex >= window.correctedWords.length
    ) {
      return;
    }

    window.correctedWords.splice(window.selectedWordIndex, 1);

    if (window.correctedWords.length === 0) {
      window.selectedWordIndex = -1;
    } else if (window.selectedWordIndex >= window.correctedWords.length) {
      // If the deleted word was the last one, select the new last one
      window.selectedWordIndex = window.correctedWords.length - 1;
    }
    // If a word in the middle was deleted, selectedWordIndex remains the same,
    // and the word at that index is now the one that was after the deleted one.

    // selectWord will call renderCorrectionArea, handle highlighting, scrolling.
    selectWord(window.selectedWordIndex);
    window.correctionAreaEl.focus();
  }
  window.deleteSelectedWord = deleteSelectedWord;
  // --- END OF MODIFIED deleteSelectedWord ---

  function loadSentence(index) {
    window.currentSentenceIndex = index; // Update global currentSentenceIndex

    if (index >= window.sentencePairs.length) {
      window.allCompleted = true;
      // Consider removing global key listener when all completed
      document.removeEventListener("keydown", globalKeyHandler);
      // Hide help button and modal if open
      window.helpToggleBtn.classList.add("hidden");
      if (isHelpModalOpen) hideHelpModal(true); // Force hide if open

      window.appContainer.innerHTML = `<div class="text-center p-10"><h2 class="text-3xl font-bold text-green-600">Completed!</h2><p class="text-gray-700 mt-4">All sentences have been processed.</p></div>`;
      return;
    }

    const pair = window.sentencePairs[index];
    window.sourceSentenceEl.textContent = pair.source;
    window.llmTargetSentenceEl.textContent = pair.target;
    window.originalTargetForReset = pair.target; // Store for reset functionality
    window.correctedWords = normalizeWords(pair.target); // Update global correctedWords
    window.selectedWordIndex = window.correctedWords.length > 0 ? 0 : -1; // Reset selection
    window.isEditingWord = false; // Ensure not in editing mode
    // renderCorrectionArea(); // selectWord will call this

    if (window.selectedWordIndex !== -1) {
      selectWord(window.selectedWordIndex); // This also calls renderCorrectionArea
    } else {
      renderCorrectionArea(); // If no words, still need to render the empty message
      window.correctionAreaEl.focus(); // Focus correction area if empty
    }

    window.statusTextEl.textContent = `Sentence ${index + 1} of ${
      window.sentencePairs.length
    }`;
  }
  window.loadSentence = loadSentence;

  function handleSubmit() {
    if (window.allCompleted || window.isEditingWord) return; // Prevent submit if editing

    // For PoC, just log the data. In a real app, this would send to a server.
    const currentData = {
      originalSource: window.sentencePairs[window.currentSentenceIndex].source,
      originalTarget: window.sentencePairs[window.currentSentenceIndex].target, // The LLM original
      correctedTarget: window.correctedWords.join(" "), // The user's version
    };
    // console.log("Submitted Data:", JSON.stringify(currentData));

    // Load the next sentence
    loadSentence(window.currentSentenceIndex + 1);
  }
  window.handleSubmit = handleSubmit;

  // jjj

  function handleReset() {
    if (window.allCompleted || window.isEditingWord) return; // Prevent reset if editing

    window.correctedWords = normalizeWords(window.originalTargetForReset);
    window.selectedWordIndex = window.correctedWords.length > 0 ? 0 : -1;
    window.isEditingWord = false; // Ensure not in editing mode

    if (window.selectedWordIndex !== -1) {
      selectWord(window.selectedWordIndex);
    } else {
      renderCorrectionArea(); // Render empty message
      // window.correctionAreaEl.focus(); // Focus call moved
    }
    window.correctionAreaEl.focus(); // MODIFIED: Always focus correctionAreaEl after reset logic
  }
  window.handleReset = handleReset;

  // jjj

  window.handleReset = handleReset;

  function showHelpModal() {
    elementThatHadFocusBeforeModal = document.activeElement;
    window.helpModal.classList.remove("hidden");
    window.helpModal.classList.add("flex"); // Use flex for centering
    isHelpModalOpen = true;
    window.closeHelpModalBtn.focus(); // Focus the close button in the modal
  }
  window.showHelpModal = showHelpModal;

  function hideHelpModal(force = false) {
    if (!isHelpModalOpen && !force) return; // Don't do anything if already hidden unless forced
    window.helpModal.classList.add("hidden");
    window.helpModal.classList.remove("flex");
    isHelpModalOpen = false;
    if (
      elementThatHadFocusBeforeModal &&
      typeof elementThatHadFocusBeforeModal.focus === "function"
    ) {
      elementThatHadFocusBeforeModal.focus();
    } else {
      window.correctionAreaEl.focus(); // Fallback focus
    }
  }
  window.hideHelpModal = hideHelpModal;

  function toggleHelpModal() {
    isHelpModalOpen ? hideHelpModal() : showHelpModal();
  }
  window.toggleHelpModal = toggleHelpModal;

  // --- START OF MODIFIED globalKeyHandler ---
  function globalKeyHandler(e) {
    if (window.allCompleted) return;

    // Handle modal-specific keys first if modal is open
    if (isHelpModalOpen) {
      if (e.key === "Escape" || e.key === "F1" || e.key === "?") {
        e.preventDefault();
        hideHelpModal();
      }
      return; // No other global keys should function when help modal is open
    }

    // Toggle help modal
    if (!window.isEditingWord && (e.key === "F1" || e.key === "?")) {
      e.preventDefault();
      showHelpModal();
      return;
    }

    // Submit
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
      return;
    }

    // If we are in word editing mode, and the active element IS the editable span,
    // then let the editable span's own handlers (Enter, Esc) deal with it.
    if (window.isEditingWord) {
      if (document.activeElement === window.activeEditableElement) {
        return;
      }
    }

    const activeTag = document.activeElement
      ? document.activeElement.tagName
      : null;
    const activeIsContentEditable = document.activeElement
      ? document.activeElement.isContentEditable
      : false;

    if (
      e.key === " " &&
      (activeTag === "BUTTON" ||
        ((activeTag === "INPUT" || activeTag === "TEXTAREA") &&
          document.activeElement !== window.activeEditableElement) ||
        (activeIsContentEditable &&
          document.activeElement !== window.activeEditableElement))
    ) {
      return;
    }

    switch (e.key) {
      case " ":
        e.preventDefault();
        e.stopImmediatePropagation();
        if (e.shiftKey) {
          moveSelection(-1);
        } else {
          moveSelection(1);
        }
        break;
      case "ArrowLeft":
        e.preventDefault();
        e.stopImmediatePropagation();
        moveSelection(-1);
        break;
      case "ArrowRight":
        e.preventDefault();
        e.stopImmediatePropagation();
        moveSelection(1);
        break;
      case "Enter": // Fall-through
      case "F2":
        if (window.selectedWordIndex !== -1 && !window.isEditingWord) {
          e.preventDefault();
          initiateWordEdit();
        }
        break;
      case "Delete": // Fall-through
      case "Backspace":
        if (window.selectedWordIndex !== -1 && !window.isEditingWord) {
          e.preventDefault();
          e.stopImmediatePropagation(); // MODIFIED: Added stopImmediatePropagation
          deleteSelectedWord();
        }
        break;
      case "Escape":
        if (!window.isEditingWord) {
          // Only if not editing (edit Esc is handled by contenteditable listener)
          e.preventDefault();
          handleReset();
        }
        break;
    }
  }
  window.globalKeyHandler = globalKeyHandler;
  // --- END OF MODIFIED globalKeyHandler ---

  // Event Listeners Setup
  window.submitBtn.addEventListener("click", handleSubmit);
  window.resetBtn.addEventListener("click", handleReset);
  window.helpToggleBtn.addEventListener("click", toggleHelpModal);
  window.closeHelpModalBtn.addEventListener("click", hideHelpModal);

  // Global key listener - make sure it's added only once if initializeApp can be called multiple times
  document.removeEventListener("keydown", globalKeyHandler); // Remove first to prevent duplicates
  document.addEventListener("keydown", globalKeyHandler);

  // Special handling for F1/F2 to prevent default browser actions (like help menu)
  // This needs to be a separate listener as globalKeyHandler might be prevented by stopPropagation
  // from contenteditable elements.
  window.removeEventListener("keydown", window._globalFKeyHandler); // Clean up previous if any
  window._globalFKeyHandler = function (e) {
    if (e.key === "F1") e.preventDefault(); // Always prevent F1 default
    if (
      e.key === "F2" &&
      !window.isEditingWord &&
      window.selectedWordIndex !== -1 &&
      !isHelpModalOpen // Only prevent F2 if we are going to use it for editing
    ) {
      e.preventDefault();
    }
  };
  window.addEventListener("keydown", window._globalFKeyHandler);

  // Load the initial sentence
  loadSentence(window.currentSentenceIndex);
}
// End of initializeApp

// Ensure initializeApp is available globally
if (typeof window !== "undefined") {
  window.initializeApp = initializeApp;
}

// Auto-initialize the app once the DOM is ready
// This handles the case where the script is in <head> or loaded async
if (
  typeof window !== "undefined" &&
  typeof window.initializeApp === "function" &&
  document.readyState !== "loading"
) {
  // DOM is already ready
  window.initializeApp();
} else if (
  typeof window !== "undefined" &&
  typeof window.initializeApp === "function"
) {
  // Wait for DOMContentLoaded
  document.addEventListener("DOMContentLoaded", window.initializeApp);
}
