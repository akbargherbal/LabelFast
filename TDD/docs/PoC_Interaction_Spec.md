## PoC Interaction Specification (`PoC_Interaction_Spec.md`)

**Version:** 1.0
**Date:** (Current Date)
**PoC File Reference:** `v003.html` (LabelFast Proof of Concept v003)

### 1. Key UI Components & Interactive DOM Elements

- **Main Display Areas:**
  - `#sourceSentence`: Displays the source text (non-editable).
  - `#llmTargetSentence`: Displays the original LLM target text (non-editable, reference).
  - `#statusText`: Displays current sentence number and total (e.g., "Sentence 1 of 7").
- **Correction Area:**
  - `#correctionArea`: The primary interactive area where users correct words. It's a `div` that dynamically hosts word `<span>` elements. Behaves as a `flex flex-wrap` container. `tabindex="0"` for focus.
  - Word Spans: Dynamically generated `<span>` elements within `#correctionArea`, each representing a word.
    - Attributes: `data-index` for word position.
    - Classes: Toggle for selection (`bg-sky-600`, `text-white`), hover effects.
  - ContentEditable Span: A dynamically created `<span>` with `contenteditable="true"` that temporarily replaces a word span during editing.
    - Class: `editable-word`.
- **Action Buttons:**
  - `#resetBtn`: "Reset Current (Esc)" button.
  - `#submitBtn`: "Submit & Next (Ctrl+Enter)" button.
- **Help System:**
  - `#helpToggleBtn`: Floating button to show/hide the help modal.
  - `#helpModal`: Modal dialog displaying keyboard shortcuts and help text.
  - `#closeHelpModalBtn`: Button within the modal to close it.
- **Application Container:**
  - `#appContainer`: Main wrapper for the application UI. Replaced with "Completed!" message at the end.

### 2. Core JavaScript Functions/Modules & Logic Areas

- **Data & State Management:**

  - `sentencePairs`: Hardcoded array of {source, target} objects.
  - `currentSentenceIndex`: Tracks the current sentence being processed.
  - `correctedWords`: Array of strings representing the words in the `#correctionArea`.
  - `selectedWordIndex`: Index of the currently selected word in `correctedWords`.
  - `isEditingWord`: Boolean flag, true if a word is currently in `contenteditable` mode.
  - `activeEditableElement`: Stores the DOM reference to the `contenteditable` span when active.
  - `originalTargetForReset`: Stores the initial `target` string for the current sentence, used by `handleReset()`.
  - `allCompleted`: Boolean flag, true when all sentences are processed.
  - `isHelpModalOpen`: Boolean flag for help modal visibility.
  - `elementThatHadFocusBeforeModal`: Stores DOM element to return focus to after help modal closes.

- **Core Logic Functions:**

  - `normalizeWords(sentence)`: Splits a sentence string into an array of words, filtering empty strings.
  - `renderCorrectionArea()`: Clears and re-populates `#correctionArea` with word spans based on `correctedWords` and `selectedWordIndex`. Handles empty state.
  - `selectWord(index)`: Updates `selectedWordIndex`, re-renders the correction area to highlight the new selection, and scrolls it into view.
  - `moveSelection(direction)`: Calculates the next/previous word index for selection, handling wrapping. Calls `selectWord()`.
  - `initiateWordEdit()`: Converts the selected word span into a `contenteditable` span, sets up its event listeners (Enter, Esc, blur), and focuses it.
  - `commitWordEdit()`: Finalizes the edit from `contenteditable`. Updates `correctedWords` with the new word. If the new word is empty, removes the word. Re-renders and attempts to select the next word (or current if it was the last).
  - `cancelWordEdit()`: Discards changes from `contenteditable`, reverts to the original word, and re-renders.
  - `deleteSelectedWord()`: Removes the `selectedWordIndex` word from `correctedWords`. Updates selection and re-renders.
  - `loadSentence(index)`:
    - Populates `#sourceSentence`, `#llmTargetSentence`.
    - Initializes `correctedWords` from `sentencePairs[index].target` (via `normalizeWords`).
    - Sets `originalTargetForReset`.
    - Resets `selectedWordIndex` (usually to 0 or -1 if empty).
    - Calls `renderCorrectionArea()`.
    - Updates `#statusText`.
    - Handles the "Completed!" state if `index` is out of bounds.
  - `handleSubmit()`: Logs current source, original target, and `correctedWords.join(" ")` to console. Increments `currentSentenceIndex` and calls `loadSentence()`.
  - `handleReset()`: Resets `correctedWords` to `originalTargetForReset`. Re-renders and re-selects.
  - `showHelpModal()`, `hideHelpModal()`, `toggleHelpModal()`: Manage visibility and focus for the help modal.

- **Event Handling:**
  - Button click listeners: `submitBtn`, `resetBtn`, `helpToggleBtn`, `closeHelpModalBtn`.
  - `globalKeyHandler(e)`: Centralized keyboard shortcut manager. Handles:
    - Help modal toggle (`?`, `F1`) and closing (`Esc` within modal).
    - Submit (`Ctrl+Enter`).
    - Word navigation (`Space`, `Shift+Space`, `ArrowLeft`, `ArrowRight`) - when not editing.
    - Initiate edit (`Enter`, `F2`) - when not editing and a word is selected.
    - Delete word (`Delete`, `Backspace`) - when not editing and a word is selected.
    - Reset sentence (`Esc`) - when not editing and help modal is closed.
    - Careful distinction between `isEditingWord` true/false for key behaviors.
    - Prevention of default spacebar actions if focus is on other interactive elements (e.g. buttons).
  - `contenteditable` span event listeners (keydown for Enter/Esc, blur).
  - Word span click/dblclick listeners (in `renderCorrectionArea`) for selection and initiating edit.
  - Window `keydown` listener (for F1/F2 `preventDefault`).

### 3. Observed User Interactions & Key State Variables

- **Initial Load:** First sentence pair is loaded. `correctedWords` initialized from LLM target. First word (if any) is selected.
- **Word Selection:**
  - Clicking a word selects it.
  - `Space` selects next word (wraps around).
  - `Shift+Space` selects previous word (wraps around).
  - `ArrowRight` selects next word (wraps around).
  - `ArrowLeft` selects previous word (wraps around).
  - State: `selectedWordIndex` updated, UI reflects selection.
- **Word Editing:**
  - Double-clicking selected word or pressing `Enter`/`F2` on selected word initiates edit.
  - State: `isEditingWord = true`, `activeEditableElement` points to the `contenteditable` span.
  - While editing:
    - Typing changes the word in `activeEditableElement`. `Space` inserts a space.
    - `Enter` commits change: `correctedWords` updated, `isEditingWord = false`, next word selected.
    - `Esc` cancels change: `correctedWords` unchanged (reverted), `isEditingWord = false`, original selection restored.
    - Blurring `activeEditableElement` (losing focus) commits the change.
- **Word Deletion:**
  - Pressing `Delete` or `Backspace` on a selected word (not in edit mode) removes it.
  - State: `correctedWords` updated, selection shifts.
- **Sentence Reset:**
  - Clicking "Reset Current" button or pressing `Esc` (when not editing, help closed) reverts `correctedWords` to `originalTargetForReset`.
  - State: `correctedWords` reset, selection reset (usually to first word).
- **Sentence Submission:**
  - Clicking "Submit & Next" button or pressing `Ctrl+Enter`.
  - Action: Current data logged to console. `currentSentenceIndex` increments. Next sentence loaded via `loadSentence()`.
- **Help Modal:**
  - Clicking "?" button or pressing `?`/`F1` toggles modal.
  - State: `isHelpModalOpen` toggled. Focus managed.
  - `Esc` or close button hides modal.
- **Completion:**
  - After submitting the last sentence, `allCompleted = true`. UI changes to "Completed!" message. Keyboard listeners potentially removed/disabled.
