## PoC Hardening Iteration Guide (`PoC_Hardening_Guide.md`)

**Version:** 1.0
**Date:** (Current Date)
**PoC File Reference:** `v003.html` (after JS extraction to `app.js`)

The following modules/interactions will be hardened iteratively. For each, tests will be generated, executed against the current code, and the code refined until all tests pass.

---

**Module 1: Initial State & Sentence Loading**
*   **Target JS:** `loadSentence()`, `normalizeWords()`, initial setup logic. DOM elements: `#sourceSentence`, `#llmTargetSentence`, `#correctionArea`, `#statusText`.
*   **Key Test Scenarios/Objectives:**
    *   Verify correct display of source, LLM target, and initial correction area content for the first sentence.
    *   Verify `statusText` shows "Sentence 1 of X".
    *   Verify first word is selected by default if sentence is not empty.
    *   Verify no word is selected if the initial target sentence is empty.
    *   Verify handling of `sentencePairs` with varying content (empty strings, multi-space words).
    *   Verify "Completed!" state is correctly displayed when `loadSentence` is called with an out-of-bounds index.
    *   Verify `originalTargetForReset` is correctly set.
*   **Status:** Verified & Hardened

---

**Module 2: Word Tokenization & Rendering in Correction Area**
*   **Target JS:** `normalizeWords()`, `renderCorrectionArea()`. DOM element: `#correctionArea`.
*   **Key Test Scenarios/Objectives:**
    *   `normalizeWords()`: Correctly splits sentences with single/multiple spaces, leading/trailing spaces, and filters empty words.
    *   `renderCorrectionArea()`:
        *   Displays the "Sentence is empty..." message when `correctedWords` is empty and not editing.
        *   Correctly creates `<span>` elements for each word in `correctedWords`.
        *   Each word `<span>` has the correct `textContent` and `data-index`.
        *   Correctly applies selection classes (`bg-sky-600`, `text-white`) to the `selectedWordIndex` span.
        *   Hover classes are present on unselected words.
        *   Word spans have click and dblclick listeners attached (existence, not necessarily full behavior here).
*   **Status:** Verified & Hardened

---

**Module 3: Word Selection & Navigation**
*   **Target JS:** `selectWord()`, `moveSelection()`, click/dblclick listeners on word spans (from `renderCorrectionArea`), relevant parts of `globalKeyHandler()` (`ArrowLeft`, `ArrowRight`, `Space`, `Shift+Space`).
*   **Key Test Scenarios/Objectives:**
    *   Clicking a word span updates `selectedWordIndex` and UI.
    *   `ArrowLeft`/`ArrowRight` keys:
        *   Select previous/next word.
        *   Wrap around from first to last and last to first.
        *   No action if only one word or no words.
    *   `Space`/`Shift+Space` keys (when not editing):
        *   Select next/previous word.
        *   Wrap around.
        *   No action if only one word or no words.
    *   `selectWord()` correctly scrolls the selected word into view (mock scrollIntoView or check focus).
    *   Selection is cleared (`selectedWordIndex = -1`) if `correctedWords` becomes empty.
*   **Status:** Verified & Hardened

---

**Module 4: Word Editing Flow (ContentEditable)**
*   **Target JS:** `initiateWordEdit()`, `commitWordEdit()`, `cancelWordEdit()`, event listeners on the dynamically created `contenteditable` span.
*   **Key Test Scenarios/Objectives:**
    *   **Initiation:**
        *   `Enter`/`F2`/Double-click on a selected word triggers `initiateWordEdit()`.
        *   `isEditingWord` becomes true.
        *   A `contenteditable` span replaces the original word span.
        *   `contenteditable` span contains the original word text and gets focus.
        *   `activeEditableElement` is set.
        *   Cannot initiate edit if no word is selected or already editing.
    *   **Editing & Committing:**
        *   Typing into `contenteditable` span updates its `textContent`.
        *   Pressing `Enter` in `contenteditable`:
            *   Calls `commitWordEdit()`.
            *   `correctedWords` is updated with trimmed `textContent`.
            *   If new word is empty, it's removed from `correctedWords`.
            *   `isEditingWord` becomes false, `activeEditableElement` is null.
            *   Selection moves to the next word (or stays if last, or updates if word was deleted).
            *   `#correctionArea` re-renders.
        *   Losing focus (blur) from `contenteditable` span also calls `commitWordEdit()`.
    *   **Cancelling Edit:**
        *   Pressing `Esc` in `contenteditable`:
            *   Calls `cancelWordEdit()`.
            *   `correctedWords` remains unchanged (original word restored).
            *   `isEditingWord` becomes false, `activeEditableElement` is null.
            *   Original selection is restored.
            *   `#correctionArea` re-renders.
    *   Editing edge cases: making a word empty (should delete), adding multiple spaces (should be trimmed on commit).
*   **Status:** Verified & Hardened

---

**Module 5: Word Deletion**
*   **Target JS:** `deleteSelectedWord()`, relevant part of `globalKeyHandler()` (`Delete`, `Backspace`).
*   **Key Test Scenarios/Objectives:**
    *   Pressing `Delete` or `Backspace` on a selected word (not editing) calls `deleteSelectedWord()`.
    *   Word at `selectedWordIndex` is removed from `correctedWords`.
    *   If words remain, selection moves to the new word at `selectedWordIndex` (or previous if last was deleted).
    *   If last word is deleted, `selectedWordIndex` becomes -1 (or `correctionArea` shows empty message).
    *   `#correctionArea` re-renders.
    *   Cannot delete if no word selected or if `isEditingWord` is true.
*   **Status:** Pending Tests

---

**Module 6: Sentence Reset Functionality**
*   **Target JS:** `handleReset()`, `resetBtn` click listener, relevant part of `globalKeyHandler()` (`Esc`).
*   **Key Test Scenarios/Objectives:**
    *   Clicking `#resetBtn` calls `handleReset()`.
    *   Pressing `Esc` (when not editing and help modal closed) calls `handleReset()`.
    *   `correctedWords` is reverted to `originalTargetForReset`.
    *   `selectedWordIndex` is reset (typically to first word or -1 if empty).
    *   `#correctionArea` re-renders with original words.
    *   `isEditingWord` is false.
*   **Status:** Pending Tests

---

**Module 7: Sentence Submission & Progression**
*   **Target JS:** `handleSubmit()`, `submitBtn` click listener, relevant part of `globalKeyHandler()` (`Ctrl+Enter`), interaction with `loadSentence()`.
*   **Key Test Scenarios/Objectives:**
    *   Clicking `#submitBtn` or pressing `Ctrl+Enter` calls `handleSubmit()`.
    *   `console.log` is called with correct data (mock/spy on `console.log`).
    *   `currentSentenceIndex` is incremented.
    *   `loadSentence()` is called with the new index.
    *   Verify UI updates to reflect the next sentence (or "Completed!" state).
    *   Cannot submit if `isEditingWord` is true or `allCompleted` is true.
*   **Status:** Pending Tests

---

**Module 8: Help Modal Interaction**
*   **Target JS:** `showHelpModal()`, `hideHelpModal()`, `toggleHelpModal()`, listeners on `#helpToggleBtn`, `#closeHelpModalBtn`, relevant parts of `globalKeyHandler()` (`?`, `F1`, `Esc`).
*   **Key Test Scenarios/Objectives:**
    *   Clicking `#helpToggleBtn` calls `toggleHelpModal()`:
        *   Opens modal if closed, sets `isHelpModalOpen = true`, modal becomes visible, focus moves to close button.
        *   Closes modal if open, sets `isHelpModalOpen = false`, modal becomes hidden, focus returns to `elementThatHadFocusBeforeModal` or `#correctionArea`.
    *   Pressing `?` or `F1` (when not editing, help closed) calls `showHelpModal()`.
    *   Clicking `#closeHelpModalBtn` calls `hideHelpModal()`.
    *   Pressing `Esc` (when help modal is open) calls `hideHelpModal()`.
    *   `elementThatHadFocusBeforeModal` is correctly stored and used.
*   **Status:** Pending Tests

---

**Module 9: Global Keyboard Handler Robustness**
*   **Target JS:** `globalKeyHandler()`, interaction with `isEditingWord`, `isHelpModalOpen`.
*   **Key Test Scenarios/Objectives:**
    *   Ensure spacebar navigation (`Space`, `Shift+Space`) is disabled when `isEditingWord` is true (handled by contenteditable itself) or when help modal is open.
    *   Ensure spacebar navigation does not trigger if focus is on a `BUTTON` or other (hypothetical) input elements.
    *   Ensure `Enter`/`F2` only trigger edit mode when appropriate (not editing, word selected, help closed).
    *   Ensure `Esc` correctly prioritizes: close help modal -> cancel word edit -> reset sentence.
    *   Ensure `Ctrl+Enter` works correctly regardless of focus as long as not editing.
    *   Verify `preventDefault()` is used correctly to stop unwanted default browser actions for handled keys.
*   **Status:** Pending Tests

---