// app.js

function initializeApp() {
  // --- START OF ORIGINAL app.js CONTENT ---

  const sentencePairs = [
    {
      source: "لماذا فعلت هذا الشيء يا رجل",
      target: "ليش عملت هذا الشيء يا رجال",
    },
    { source: "أين كنت عندما حدث ذلك؟", target: "وينك يوم صار هالشي؟" },
    { source: "هذا الطعام لذيذ جدا.", target: "هالأكل وايد حلو." },
    {
      source: "هل يمكنك مساعدتي من فضلك؟",
      target: "تقدر تساعدني لو سمحت؟",
    },
    { source: "سأراك لاحقاً.", target: "أشوفك بعدين." },
    { source: "ما هو اسمك؟", target: "شنو اسمك؟" },
    { source: "أنا بخير، شكراً لك.", target: "أنا زين، مشكور." },
  ];

  let currentSentenceIndex = 0;
  let correctedWords = [];
  let selectedWordIndex = -1;
  let isEditingWord = false;
  let activeEditableElement = null;
  let originalTargetForReset = "";
  let allCompleted = false;

  // DOM elements MUST be selected *inside* initializeApp, after HTML is loaded
  // And they should ideally be re-queried each time initializeApp runs if the DOM is reset.
  // For testing, where we reset document.body.innerHTML, this is important.

  // To make them accessible to tests or other parts of the app if needed later,
  // we can attach them to the window object, or return them from initializeApp.
  // For now, let's make them accessible on window for the tests.

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
  let isHelpModalOpen = false; // This can remain local to the closure if not directly tested
  let elementThatHadFocusBeforeModal; // Same for this

  // Expose necessary variables/functions to the window object for tests
  // and for event handlers if they are not defined within the scope of initializeApp
  // or are used by inline HTML event attributes (which is not the case here).
  window.sentencePairs = sentencePairs; // Make sentencePairs available globally for tests
  window.currentSentenceIndex = currentSentenceIndex; // For test inspection
  window.correctedWords = correctedWords; // For test inspection
  window.selectedWordIndex = selectedWordIndex; // For test inspection
  window.isEditingWord = isEditingWord; // For test inspection
  window.activeEditableElement = activeEditableElement; // For test inspection
  window.originalTargetForReset = originalTargetForReset; // For test inspection
  window.allCompleted = allCompleted; // For test inspection

  function normalizeWords(sentence) {
    return sentence.split(/\s+/).filter((word) => word.length > 0);
  }
  window.normalizeWords = normalizeWords; // Expose for tests

  function renderCorrectionArea() {
    window.correctionAreaEl.innerHTML = ""; // Use window.correctionAreaEl
    if (window.correctedWords.length === 0 && !window.isEditingWord) {
      // Use window globals
      window.correctionAreaEl.innerHTML = `<span class="text-gray-400 italic">Sentence is empty. Use controls if needed.</span>`;
      window.selectedWordIndex = -1;
      return;
    }
    window.correctedWords.forEach((word, index) => {
      const wordSpan = document.createElement("span");
      wordSpan.textContent = word;
      wordSpan.dataset.index = index;
      wordSpan.className = `p-1 rounded cursor-pointer hover:bg-sky-100 transition-colors duration-150 ease-in-out inline-block`;
      if (index === window.selectedWordIndex && !window.isEditingWord) {
        wordSpan.classList.add("bg-sky-600", "text-white");
        wordSpan.classList.remove("hover:bg-sky-100");
      }
      wordSpan.addEventListener("click", () => {
        if (window.isEditingWord) return;
        selectWord(index);
      });
      wordSpan.addEventListener("dblclick", () => {
        if (window.isEditingWord) return;
        selectWord(index);
        initiateWordEdit();
      });
      window.correctionAreaEl.appendChild(wordSpan);
    });
    const flexGapFix = document.createElement("span");
    flexGapFix.className = "w-0 h-0 p-0 m-0";
    window.correctionAreaEl.appendChild(flexGapFix);
  }
  window.renderCorrectionArea = renderCorrectionArea; // Expose for tests

  // app.js
  function selectWord(index) {
    console.log(
      `[APP] selectWord called with index: ${index}. Current window.isEditingWord: ${window.isEditingWord}`
    ); // DEBUG
    if (window.isEditingWord) {
      console.log("[APP] selectWord returning because isEditingWord is true."); // DEBUG
      return;
    }

    console.log(
      `[APP] Before update, window.selectedWordIndex was: ${window.selectedWordIndex}`
    ); // DEBUG
    if (window.correctedWords.length === 0) {
      window.selectedWordIndex = -1;
    } else if (index >= 0 && index < window.correctedWords.length) {
      window.selectedWordIndex = index;
    } else if (index < 0 && window.correctedWords.length > 0) {
      window.selectedWordIndex = 0;
    } else if (window.correctedWords.length > 0) {
      window.selectedWordIndex = window.correctedWords.length - 1;
    } else {
      window.selectedWordIndex = -1;
    }
    console.log(
      `[APP] After update, window.selectedWordIndex is now: ${window.selectedWordIndex}`
    ); // DEBUG

    renderCorrectionArea();

    const selectedSpan = window.correctionAreaEl.querySelector(
      `span[data-index='${window.selectedWordIndex}']`
    );
    if (selectedSpan) {
      console.log(
        `[APP] Scrolling span with text "${selectedSpan.textContent}" into view.`
      ); // DEBUG
      selectedSpan.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    } else {
      console.log(
        `[APP] No span found to scroll for index ${window.selectedWordIndex}.`
      ); // DEBUG
    }
  }
  // window.selectWord = selectWord; // Already exposed
  function moveSelection(direction) {
    if (window.isEditingWord || window.correctedWords.length === 0) return;
    let newIndex = window.selectedWordIndex + direction;
    if (newIndex < 0) newIndex = window.correctedWords.length - 1;
    if (newIndex >= window.correctedWords.length) newIndex = 0;
    selectWord(newIndex);
  }
  window.moveSelection = moveSelection; // Expose

  function initiateWordEdit() {
    if (
      window.isEditingWord ||
      window.selectedWordIndex < 0 ||
      window.selectedWordIndex >= window.correctedWords.length
    )
      return;
    window.isEditingWord = true;
    const wordToEdit = window.correctedWords[window.selectedWordIndex];
    const wordSpanToReplace = window.correctionAreaEl.querySelector(
      `span[data-index='${window.selectedWordIndex}']`
    );
    if (!wordSpanToReplace) {
      window.isEditingWord = false;
      return;
    }

    window.activeEditableElement = document.createElement("span");
    window.activeEditableElement.contentEditable = "true";
    window.activeEditableElement.textContent = wordToEdit;
    window.activeEditableElement.className =
      "editable-word p-1 border border-blue-700 rounded shadow-sm focus:ring-2 focus:ring-blue-500 text-lg bg-white";
    window.activeEditableElement.dir = window.correctionAreaEl.dir;

    window.activeEditableElement.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        commitWordEdit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        cancelWordEdit();
      }
    });
    window.activeEditableElement.addEventListener("blur", () => {
      setTimeout(() => {
        if (window.isEditingWord && window.activeEditableElement)
          commitWordEdit();
      }, 0);
    });
    wordSpanToReplace.replaceWith(window.activeEditableElement);
    window.activeEditableElement.focus();
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
    if (newWord) window.correctedWords[window.selectedWordIndex] = newWord;
    else {
      window.correctedWords.splice(window.selectedWordIndex, 1);
      if (
        window.selectedWordIndex >= window.correctedWords.length &&
        window.correctedWords.length > 0
      )
        window.selectedWordIndex = window.correctedWords.length - 1;
      else if (window.correctedWords.length === 0)
        window.selectedWordIndex = -1;
    }
    window.isEditingWord = false;
    window.activeEditableElement = null;
    renderCorrectionArea();
    if (window.correctedWords.length === 0) window.selectedWordIndex = -1;
    else {
      if (newWord) {
        if (originalIndexOfEditedWord + 1 < window.correctedWords.length)
          window.selectedWordIndex = originalIndexOfEditedWord + 1;
        else {
          window.selectedWordIndex = originalIndexOfEditedWord;
          if (window.selectedWordIndex >= window.correctedWords.length)
            window.selectedWordIndex = window.correctedWords.length - 1;
        }
      }
      selectWord(window.selectedWordIndex);
    }
    window.correctionAreaEl.focus();
  }
  window.commitWordEdit = commitWordEdit;

  function cancelWordEdit() {
    if (!window.isEditingWord) return;
    window.isEditingWord = false;
    window.activeEditableElement = null;
    renderCorrectionArea();
    if (window.selectedWordIndex !== -1 && window.correctedWords.length > 0)
      selectWord(window.selectedWordIndex);
    else if (window.correctedWords.length === 0) window.selectedWordIndex = -1;
    window.correctionAreaEl.focus();
  }
  window.cancelWordEdit = cancelWordEdit;

  function deleteSelectedWord() {
    if (
      window.isEditingWord ||
      window.selectedWordIndex < 0 ||
      window.selectedWordIndex >= window.correctedWords.length
    )
      return;
    window.correctedWords.splice(window.selectedWordIndex, 1);
    if (window.correctedWords.length === 0) window.selectedWordIndex = -1;
    else if (window.selectedWordIndex >= window.correctedWords.length)
      window.selectedWordIndex = window.correctedWords.length - 1;
    renderCorrectionArea();
    if (window.selectedWordIndex !== -1) selectWord(window.selectedWordIndex);
    else window.correctionAreaEl.focus();
  }
  window.deleteSelectedWord = deleteSelectedWord;

  function loadSentence(index) {
    // Update global currentSentenceIndex for test inspection
    window.currentSentenceIndex = index;

    if (index >= window.sentencePairs.length) {
      // Use window.sentencePairs
      window.allCompleted = true;
      document.removeEventListener("keydown", globalKeyHandler); // globalKeyHandler is now on window
      window.helpToggleBtn.classList.add("hidden");
      if (isHelpModalOpen) hideHelpModal(true); // isHelpModalOpen is local, hideHelpModal is on window
      window.appContainer.innerHTML = `<div class="text-center p-10"><h2 class="text-3xl font-bold text-green-600">Completed!</h2><p class="text-gray-700 mt-4">All sentences have been processed.</p></div>`;
      return;
    }
    const pair = window.sentencePairs[index];
    window.sourceSentenceEl.textContent = pair.source;
    window.llmTargetSentenceEl.textContent = pair.target;
    window.originalTargetForReset = pair.target;
    window.correctedWords = normalizeWords(pair.target);
    window.selectedWordIndex = window.correctedWords.length > 0 ? 0 : -1;
    window.isEditingWord = false;
    renderCorrectionArea();
    if (window.selectedWordIndex !== -1) selectWord(window.selectedWordIndex);
    window.statusTextEl.textContent = `Sentence ${index + 1} of ${
      window.sentencePairs.length
    }`;
    window.correctionAreaEl.focus();
  }
  window.loadSentence = loadSentence;

  function handleSubmit() {
    if (window.allCompleted || window.isEditingWord) return;
    const currentData = {
      originalSource: window.sentencePairs[window.currentSentenceIndex].source,
      originalTarget: window.sentencePairs[window.currentSentenceIndex].target,
      correctedTarget: window.correctedWords.join(" "),
    };
    console.log("Submitted Data:", JSON.stringify(currentData));
    // window.currentSentenceIndex++; // loadSentence will update this
    loadSentence(window.currentSentenceIndex + 1);
  }
  window.handleSubmit = handleSubmit;

  function handleReset() {
    if (window.allCompleted || window.isEditingWord) return;
    window.correctedWords = normalizeWords(window.originalTargetForReset);
    window.selectedWordIndex = window.correctedWords.length > 0 ? 0 : -1;
    window.isEditingWord = false;
    renderCorrectionArea();
    if (window.selectedWordIndex !== -1) selectWord(window.selectedWordIndex);
    window.correctionAreaEl.focus();
  }
  window.handleReset = handleReset;

  function showHelpModal() {
    elementThatHadFocusBeforeModal = document.activeElement;
    window.helpModal.classList.remove("hidden");
    window.helpModal.classList.add("flex");
    isHelpModalOpen = true; // Local variable
    window.closeHelpModalBtn.focus();
  }
  window.showHelpModal = showHelpModal;

  function hideHelpModal(force = false) {
    if (!isHelpModalOpen && !force) return; // Local variable
    window.helpModal.classList.add("hidden");
    window.helpModal.classList.remove("flex");
    isHelpModalOpen = false; // Local variable
    if (
      elementThatHadFocusBeforeModal &&
      typeof elementThatHadFocusBeforeModal.focus === "function"
    )
      elementThatHadFocusBeforeModal.focus();
    else window.correctionAreaEl.focus();
  }
  window.hideHelpModal = hideHelpModal;

  function toggleHelpModal() {
    isHelpModalOpen ? hideHelpModal() : showHelpModal(); // Local variable
  }
  window.toggleHelpModal = toggleHelpModal;

  function globalKeyHandler(e) {
    if (window.allCompleted) return;
    if (isHelpModalOpen) {
      // Local variable
      if (e.key === "Escape" || e.key === "F1" || e.key === "?") {
        e.preventDefault();
        hideHelpModal();
      }
      return;
    }
    if (!window.isEditingWord && (e.key === "F1" || e.key === "?")) {
      e.preventDefault();
      showHelpModal();
      return;
    }
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
      return;
    }

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
        if (e.shiftKey) {
          moveSelection(-1);
        } else {
          moveSelection(1);
        }
        break;
      case "ArrowLeft":
        e.preventDefault();
        moveSelection(-1);
        break;
      case "ArrowRight":
        e.preventDefault();
        moveSelection(1);
        break;
      case "Enter":
      case "F2":
        if (window.selectedWordIndex !== -1) {
          e.preventDefault();
          initiateWordEdit();
        }
        break;
      case "Delete":
      case "Backspace":
        if (window.selectedWordIndex !== -1) {
          e.preventDefault();
          deleteSelectedWord();
        }
        break;
      case "Escape":
        e.preventDefault();
        handleReset();
        break;
    }
  }
  window.globalKeyHandler = globalKeyHandler;

  // Add event listeners
  // Ensure these are only added once, or manage removal if initializeApp can be called multiple times.
  // For the test setup, we'll rely on the fact that fresh DOM elements are created.
  // A more robust way would be to remove old listeners before adding new ones if elements persist.
  window.submitBtn.addEventListener("click", handleSubmit);
  window.resetBtn.addEventListener("click", handleReset);
  window.helpToggleBtn.addEventListener("click", toggleHelpModal);
  window.closeHelpModalBtn.addEventListener("click", hideHelpModal);
  document.addEventListener("keydown", globalKeyHandler);

  window.addEventListener("keydown", function (e) {
    if (e.key === "F1") e.preventDefault();
    if (
      e.key === "F2" &&
      !window.isEditingWord &&
      window.selectedWordIndex !== -1 &&
      !isHelpModalOpen // Check local isHelpModalOpen
    )
      e.preventDefault();
  });

  // Initial load
  loadSentence(window.currentSentenceIndex); // Use window.currentSentenceIndex which is 0 initially

  // --- END OF ORIGINAL app.js CONTENT ---
}

// Expose the main initialization function to the window object
// so that tests can call it.
if (typeof window !== "undefined") {
  window.initializeApp = initializeApp;
}

// Automatically initialize the app when the script loads in a browser context
// but not necessarily when just loaded for testing before HTML is ready.
// For tests, we will call window.initializeApp() explicitly in beforeEach.
// For browser, this ensures it runs after the script is parsed.
// However, since we moved app.js to be loaded with `defer`,
// it will run after the DOM is parsed anyway.
// So, an immediate call might be fine, or wrap it in DOMContentLoaded.
// To be safe and align with test strategy, let's only call it from tests
// OR ensure it's called after DOM is ready in v003.html.
// For now, let's remove the auto-call here and rely on tests or v003.html to call it.

// Commenting out the direct call:
// initializeApp();
// Instead, if you want it to run in the browser automatically, v003.html's script tag
// or a DOMContentLoaded listener here should call window.initializeApp().
// For example, at the end of app.js:
// document.addEventListener('DOMContentLoaded', initializeApp);

// app.js (at the very end)
if (
  typeof window !== "undefined" &&
  typeof window.initializeApp === "function" &&
  document.readyState !== "loading"
) {
  // If document is already loaded, call it directly
  window.initializeApp();
} else if (
  typeof window !== "undefined" &&
  typeof window.initializeApp === "function"
) {
  // Otherwise, wait for DOMContentLoaded
  document.addEventListener("DOMContentLoaded", window.initializeApp);
}
