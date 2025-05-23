// app.js

function initializeApp() {
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
  let isEditingWord = false;
  let activeEditableElement = null;
  let originalTargetForReset = "";
  let allCompleted = false;

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
  let isHelpModalOpen = false;
  let elementThatHadFocusBeforeModal;

  window.sentencePairs = sentencePairs;
  window.currentSentenceIndex = currentSentenceIndex;
  window.correctedWords = correctedWords;
  window.selectedWordIndex = -1;
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
      window.selectedWordIndex = -1;
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
          return;
        }
        selectWord(index_in_foreach);
      });

      wordSpan.addEventListener("dblclick", function handleDblClick() {
        if (window.isEditingWord) {
          return;
        }
        selectWord(index_in_foreach);
        initiateWordEdit();
      });
      window.correctionAreaEl.appendChild(wordSpan);
    });

    const flexGapFix = document.createElement("span");
    flexGapFix.className = "w-0 h-0 p-0 m-0";
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

    renderCorrectionArea();
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
      newIndex = window.correctedWords.length - 1;
    } else if (newIndex >= window.correctedWords.length) {
      newIndex = 0;
    }
    selectWord(newIndex);
  }
  window.moveSelection = moveSelection;

  // START OF CLEANED initiateWordEdit FUNCTION
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
      window.isEditingWord = false; // Reset if span not found
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
    window.activeEditableElement.focus(); // Attempt to focus
    const range = document.createRange();
    range.selectNodeContents(window.activeEditableElement);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
  // END OF CLEANED initiateWordEdit FUNCTION
  window.initiateWordEdit = initiateWordEdit;

  function commitWordEdit() {
    if (!window.isEditingWord || !window.activeEditableElement) return;
    const newWord = window.activeEditableElement.textContent.trim();
    const originalIndexOfEditedWord = window.selectedWordIndex;
    if (newWord) {
      window.correctedWords[originalIndexOfEditedWord] = newWord;
    } else {
      window.correctedWords.splice(originalIndexOfEditedWord, 1);
      // This logic for selectedWordIndex after deletion might need review for all edge cases,
      // but current tests cover the main scenarios.
      if (
        originalIndexOfEditedWord >= window.correctedWords.length &&
        window.correctedWords.length > 0
      ) {
        window.selectedWordIndex = window.correctedWords.length - 1;
      } else if (window.correctedWords.length === 0) {
        window.selectedWordIndex = -1;
      } else if (originalIndexOfEditedWord >= window.correctedWords.length) {
        // This case is likely similar to the one above it or means original was last and deleted
        window.selectedWordIndex =
          window.correctedWords.length > 0
            ? window.correctedWords.length - 1
            : -1;
      }
      // If a word was deleted, and it wasn't the last one, selectedWordIndex might need to stay same
      // or be originalIndexOfEditedWord if it's still valid.
      // The selectWord calls below will handle final selection.
    }
    window.isEditingWord = false;
    window.activeEditableElement = null;
    renderCorrectionArea();

    // Determine new selection after commit
    if (window.correctedWords.length === 0) {
      selectWord(-1);
    } else {
      if (newWord) {
        // Word was edited (not made empty)
        if (originalIndexOfEditedWord + 1 < window.correctedWords.length) {
          selectWord(originalIndexOfEditedWord + 1); // Move to next word
        } else {
          selectWord(originalIndexOfEditedWord); // Stay on current (possibly new text, same index)
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
    window.isEditingWord = false;
    window.activeEditableElement = null;
    renderCorrectionArea();
    if (window.selectedWordIndex !== -1 && window.correctedWords.length > 0) {
      selectWord(window.selectedWordIndex);
    } else if (window.correctedWords.length === 0) {
      selectWord(-1);
    }
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
    if (window.correctedWords.length === 0) {
      window.selectedWordIndex = -1;
    } else if (window.selectedWordIndex >= window.correctedWords.length) {
      // If the deleted word was the last one, select the new last one
      window.selectedWordIndex = window.correctedWords.length - 1;
    }
    // If a word in the middle was deleted, selectedWordIndex remains the same,
    // and the word at that index is now the one that was after the deleted one.
    renderCorrectionArea();
    selectWord(window.selectedWordIndex); // Re-select to ensure UI update and scroll
    window.correctionAreaEl.focus();
  }
  window.deleteSelectedWord = deleteSelectedWord;

  function loadSentence(index) {
    window.currentSentenceIndex = index;
    if (index >= window.sentencePairs.length) {
      window.allCompleted = true;
      document.removeEventListener("keydown", globalKeyHandler);
      window.helpToggleBtn.classList.add("hidden");
      if (isHelpModalOpen) hideHelpModal(true);
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
    if (window.selectedWordIndex !== -1) {
      selectWord(window.selectedWordIndex);
    } else {
      window.correctionAreaEl.focus();
    }
    window.statusTextEl.textContent = `Sentence ${index + 1} of ${
      window.sentencePairs.length
    }`;
  }
  window.loadSentence = loadSentence;

  function handleSubmit() {
    if (window.allCompleted || window.isEditingWord) return;
    const currentData = {
      originalSource: window.sentencePairs[window.currentSentenceIndex].source,
      originalTarget: window.sentencePairs[window.currentSentenceIndex].target,
      correctedTarget: window.correctedWords.join(" "),
    };
    // console.log("Submitted Data:", JSON.stringify(currentData));
    loadSentence(window.currentSentenceIndex + 1);
  }
  window.handleSubmit = handleSubmit;

  function handleReset() {
    if (window.allCompleted || window.isEditingWord) return;
    window.correctedWords = normalizeWords(window.originalTargetForReset);
    window.selectedWordIndex = window.correctedWords.length > 0 ? 0 : -1;
    window.isEditingWord = false;
    renderCorrectionArea();
    if (window.selectedWordIndex !== -1) {
      selectWord(window.selectedWordIndex);
    } else {
      window.correctionAreaEl.focus();
    }
  }
  window.handleReset = handleReset;

  function showHelpModal() {
    elementThatHadFocusBeforeModal = document.activeElement;
    window.helpModal.classList.remove("hidden");
    window.helpModal.classList.add("flex");
    isHelpModalOpen = true;
    window.closeHelpModalBtn.focus();
  }
  window.showHelpModal = showHelpModal;

  function hideHelpModal(force = false) {
    if (!isHelpModalOpen && !force) return;
    window.helpModal.classList.add("hidden");
    window.helpModal.classList.remove("flex");
    isHelpModalOpen = false;
    if (
      elementThatHadFocusBeforeModal &&
      typeof elementThatHadFocusBeforeModal.focus === "function"
    ) {
      elementThatHadFocusBeforeModal.focus();
    } else {
      window.correctionAreaEl.focus();
    }
  }
  window.hideHelpModal = hideHelpModal;

  function toggleHelpModal() {
    isHelpModalOpen ? hideHelpModal() : showHelpModal();
  }
  window.toggleHelpModal = toggleHelpModal;

  function globalKeyHandler(e) {
    if (window.allCompleted) return;
    if (isHelpModalOpen) {
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
      case "Enter":
      case "F2":
        if (window.selectedWordIndex !== -1 && !window.isEditingWord) {
          e.preventDefault();
          // e.stopImmediatePropagation(); // Consider if Enter/F2 also misbehaves later
          initiateWordEdit();
        }
        break;
      case "Delete":
      case "Backspace":
        if (window.selectedWordIndex !== -1 && !window.isEditingWord) {
          e.preventDefault();
          deleteSelectedWord();
        }
        break;
      case "Escape":
        if (!window.isEditingWord) {
          e.preventDefault();
          handleReset();
        }
        break;
    }
  }
  window.globalKeyHandler = globalKeyHandler;

  window.submitBtn.addEventListener("click", handleSubmit);
  window.resetBtn.addEventListener("click", handleReset);
  window.helpToggleBtn.addEventListener("click", toggleHelpModal);
  window.closeHelpModalBtn.addEventListener("click", hideHelpModal);

  document.removeEventListener("keydown", globalKeyHandler);
  document.addEventListener("keydown", globalKeyHandler);

  window.removeEventListener("keydown", window._globalFKeyHandler);
  window._globalFKeyHandler = function (e) {
    if (e.key === "F1") e.preventDefault();
    if (
      e.key === "F2" &&
      !window.isEditingWord &&
      window.selectedWordIndex !== -1 &&
      !isHelpModalOpen
    )
      e.preventDefault();
  };
  window.addEventListener("keydown", window._globalFKeyHandler);

  loadSentence(window.currentSentenceIndex);
}

if (typeof window !== "undefined") {
  window.initializeApp = initializeApp;
}

if (
  typeof window !== "undefined" &&
  typeof window.initializeApp === "function" &&
  document.readyState !== "loading"
) {
  window.initializeApp();
} else if (
  typeof window !== "undefined" &&
  typeof window.initializeApp === "function"
) {
  document.addEventListener("DOMContentLoaded", window.initializeApp);
}
