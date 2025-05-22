# LabelFast (Proof of Concept v003)

[![Status: Proof of Concept](https://img.shields.io/badge/status-proof_of_concept-lightgrey)](https://shields.io/)
[![Tech: Vanilla JS](https://img.shields.io/badge/tech-Vanilla_JS-yellow)](https://shields.io/)
[![Styling: Tailwind CSS](https://img.shields.io/badge/styling-Tailwind_CSS-38B2AC)](https://shields.io/)

LabelFast is a proof-of-concept, single-HTML-file web application designed for **efficient, low-friction labeling and correction of text**. It's specifically aimed at domain experts reviewing and correcting machine-generated translations (e.g., from LLMs) sentence by sentence, with a strong emphasis on tasks requiring nuanced understanding, such as translating to rare languages or specific dialects (e.g., Modern Standard Arabic to Kuwaiti dialect).

## Core Philosophy & Unnegotiable Features

The fundamental principle of LabelFast is to **drastically reduce friction and minimize context switching** for the expert annotator. This is achieved through:

1.  **Keyboard-Centric Supremacy:** The primary mode of interaction is designed around the keyboard for maximum speed. Mouse support is secondary but available.
    - **Unnegotiable:** Core navigation and editing actions must have intuitive, fast keyboard shortcuts.
2.  **Instantaneous Feedback:** All changes and selections must reflect immediately in the UI without perceptible delay.
    - **Unnegotiable:** No page reloads for common actions. UI updates are live.
3.  **Minimal Cognitive Load:** The interface must be clean, uncluttered, and present only the necessary information for the current task (source, LLM target reference, and correction area).
    - **Unnegotiable:** Avoid visual distractions and unnecessary clicks/keystrokes.
4.  **Focused Workflow:** One sentence pair (source/target) at a time, allowing the expert to concentrate fully on the immediate correction task.
5.  **Direct Manipulation:** Editing words should feel as close to typing directly into the sentence as possible.

## The Problem Being Solved

Reviewing and correcting Large Language Model (LLM) outputs, especially for tasks demanding deep linguistic expertise, can be a laborious process. Standard text editors or generic annotation tools often introduce inefficiencies, such as requiring excessive mouse use, lacking specialized navigation, or causing context switches. LabelFast aims to provide a highly streamlined interface tailored for rapid, accurate correction of sequential text data.

## Key Features (v003 - ContentEditable + Spacebar Navigation)

This version (v003) builds upon previous iterations to further enhance the low-friction experience:

- **Single HTML File:** All necessary HTML, CSS (via Tailwind CDN), and JavaScript are contained in one file for extreme portability and ease of deployment for this PoC stage.
- **Sentence-by-Sentence Workflow:**
  - Displays the original **Source Text** (non-editable).
  - Displays the initial **LLM Target Text** (non-editable, for reference).
  - Provides an interactive **Expert Correction Area** populated with the LLM target.
- **Enhanced Keyboard-First Navigation & Interaction:**
  - **Spacebar Navigation (New in v003):**
    - `Space`: Select next word (when not editing a word).
    - `Shift + Space`: Select previous word (when not editing a word).
  - `ArrowLeft` / `ArrowRight`: Select previous/next word.
  - `Enter` / `F2` (on selected word): Activate word correction mode.
  - `Delete` / `Backspace` (on selected word): Delete the word.
  - `Ctrl + Enter`: Submit current correction and advance to the next sentence.
  - `Escape`:
    - If help modal is open: Close help modal.
    - If editing a word: Cancel current word edit.
    - If not editing & help closed: Reset current sentence to original LLM target.
  - `?` / `F1`: Toggle help modal.
- **Inline Word Correction with `contenteditable` (Refined in v003):**
  - Selected words become directly editable `<span>` elements, offering a more seamless "type-in-place" experience compared to a separate input field.
  - The main sentence structure updates dynamically and instantly.
- **Mouse Support:** Click to select words, click buttons.
- **Minimalist UI:** Clean interface styled with Tailwind CSS.
- **Hardcoded Data:** Sentence pairs are currently hardcoded in JavaScript for PoC demonstration.
- **Help Modal:** On-demand instructions for keyboard shortcuts.

## Visual (Placeholder for v003)

![LabelFast v003 Interface Example - Word Edit](https://i.imgur.com/kEeVN7x.png)
_(Replace with an actual GIF/screenshot of v003 in action)_

## Technology Stack (PoC v003)

- **HTML5**
- **Tailwind CSS** (via CDN for styling)
- **Vanilla JavaScript** (for all logic and interactivity – no frameworks like React/Vue used for this PoC)

## Getting Started / Usage

This is a self-contained single-HTML-file application.

1.  **Download:**
    - Obtain the `index.html` (or version-specific, e.g., `labelfast_v003.html`) file.
2.  **Open in Browser:**
    - Open the HTML file in any modern web browser (e.g., Chrome, Firefox, Edge, Safari).
3.  **How to Use the Interface (v003):**
    - The first source sentence and its LLM-generated target are displayed. The "Your Correction" area is pre-filled.
    - **Navigation (when not editing a word):**
      - Use `Space` (next) / `Shift + Space` (previous) for rapid word selection.
      - Alternatively, use `ArrowLeft` / `ArrowRight` or click a word.
    - **Correction:**
      - Once a word is selected, press `Enter` or `F2` (or double-click) to edit it.
      - The word becomes directly editable. Type your changes. `Space` inserts a space.
      - Press `Enter` to confirm the word change (selection moves to the next word).
      - Press `Esc` to cancel the current word edit.
      - Use `Delete` or `Backspace` on a selected word (when not in edit mode) to remove it.
    - **Submission/Reset:**
      - If the sentence is correct or after corrections, press `Ctrl+Enter` or click "Submit & Next".
      - Use the "Reset Current (Esc)" button or press `Esc` (when not editing/help closed) to revert the current sentence.
    - A "Completed!" message appears after all sentences.
    - Corrected data is logged to the browser's developer console for this PoC.
    - Press `?` or `F1` for a shortcuts cheat sheet.

## Current Status & Next Steps (Beyond PoC)

This project (v003) is a robust **Proof of Concept** validating the core interaction model. The immediate next steps, should this proceed to a production tool, would involve:

1.  **Backend Integration:**
    - Loading sentence data dynamically (e.g., from JSON, CSV, or a database via an API).
    - Saving corrected annotations back to a persistent store.
    - Potential frameworks: Django/Flask (Python) with HTMX for dynamic HTML partials, or a lightweight API for a VanillaJS/AlpineJS frontend.
2.  **User Authentication & Management:** If multiple annotators or projects are involved.
3.  **Configuration:** Allow customization of shortcuts or UI elements.

## Future Ideas / Potential Roadmap

- Support for different types of annotations (e.g., span-based tagging, classification).
- Inter-annotator agreement tools.
- Progress tracking and project dashboards.
- Advanced search and filtering of sentences.
- Integration with version control for annotation datasets.

## Contributing

For this PoC stage, contributions focused on refining the core low-friction interaction model or fixing bugs are welcome. For larger features, please open an issue for discussion first.

1.  Fork the Project.
2.  Create your Feature Branch (`git checkout -b feature/CoolImprovement`).
3.  Commit your Changes (`git commit -m 'Add CoolImprovement'`).
4.  Push to the Branch (`git push origin feature/CoolImprovement`).
5.  Open a Pull Request.

## License

Distributed under the MIT License. (Assume MIT unless specified otherwise).
