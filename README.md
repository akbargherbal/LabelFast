# LabelFast (Proof of Concept)

[![Status: Proof of Concept](https://img.shields.io/badge/status-proof_of_concept-lightgrey)](https://shields.io/)

LabelFast is a single-page web application designed for efficient, low-friction labeling and correction of text. It's particularly aimed at reviewing and correcting machine-generated translations (e.g., from LLMs) sentence by sentence, with a focus on tasks requiring domain expertise, such as translating to rare languages or specific dialects.

The core philosophy is to **minimize context switching** and empower the annotator with a **keyboard-centric workflow** for maximum speed and comfort.

## The Problem

Reviewing and correcting Large Language Model (LLM) outputs, especially for nuanced tasks like dialectal translation (e.g., Arabic to Kuwaiti dialect), can be a tedious and time-consuming process. Traditional text editors or generic annotation tools might introduce unnecessary friction. This project aims to provide a streamlined interface tailored for this specific correction task.

## Key Features (Proof of Concept)

- **Single-Page Application:** All interactions happen on one page without reloads.
- **Sentence-by-Sentence Workflow:** Presents one source/target pair at a time.
- **Clear Visual Separation:**
  - Displays the original **Source Text**.
  - Displays the initial **LLM Target Text** (for reference).
  - Provides an interactive **Expert Correction Area**.
- **Keyboard-First Navigation:**
  - Cycle through words in the target sentence using `ArrowLeft` and `ArrowRight`.
  - Submit a corrected sentence or confirm it's correct using `Ctrl+Enter`.
- **Inline Word Correction:**
  - Select a word in the target sentence.
  - Activate correction mode (e.g., `Enter` key or double-click).
  - An inline input field appears for quick word replacement.
  - The main sentence updates instantly.
- **Mouse Support:** While keyboard-centric, mouse interactions (clicking words, buttons) are also supported.
- **Minimalist UI:** Clean interface styled with Tailwind CSS (via CDN).
- **Hardcoded Data:** For this PoC, sentence pairs are hardcoded in the JavaScript.
- **Instant Feedback:** Changes are reflected immediately in the UI.

## Visual (Placeholder)

_(Add a screenshot or a GIF of the interface in action once developed. e.g., `![LabelFast Interface](docs/screenshot.gif)`)_

## Technology Stack

- **HTML5**
- **Tailwind CSS** (via CDN for styling)
- **Vanilla JavaScript** (for all logic and interactivity)

## Getting Started / Usage

This is a self-contained single-page application.

1.  **Download/Clone:**
    - Simply download the `index.html` file.
    - Or, clone this repository:
      ```bash
      git clone [URL_OF_YOUR_REPO]
      cd [REPO_NAME]
      ```
2.  **Open in Browser:**

    - Open the `index.html` file in any modern web browser (e.g., Chrome, Firefox, Edge, Safari).

3.  **How to Use the Interface:**
    - The first source sentence and its LLM-generated target will be displayed.
    - The "Expert Correction Area" will be populated with the target sentence.
    - **If the sentence is correct:**
      - Press `Ctrl+Enter` or click "Submit & Next".
    - **If the sentence needs correction:**
      - Use `ArrowLeft` / `ArrowRight` keys or click to select a word in the "Expert Correction Area".
      - Press `Enter` (or your configured key/double-click) on the selected word to edit it. An input field will appear.
      - Type your correction and press `Enter` (in the input field) or click away. The word will be updated.
      - You can also use the `Delete` key to remove a selected word.
      - Once all corrections are made, press `Ctrl+Enter` or click "Submit & Next".
    - Use the "Reset Current Sentence" button to revert changes for the current sentence pair.
    - Progress through all available sentences. A "Completed" message will appear at the end.
    - Corrected data (for this PoC) is logged to the browser's developer console.

## Current Status

This project is currently a **Proof of Concept (PoC)**. The primary goal is to validate the core interaction model for low-friction text correction.

## Future Ideas / Potential Roadmap

- Dynamic loading of sentence data (e.g., from JSON, CSV, or an API).
- Backend integration for saving corrected annotations.
- User authentication and project management.
- Configuration options for keyboard shortcuts.
- Support for different types of annotations (e.g., named entity tagging within the correction).
- Inter-annotator agreement checks.
- Metrics and progress tracking.

## Contributing

As a PoC, contributions for bug fixes or minor improvements to the core interaction are welcome. For larger changes or features, please open an issue first to discuss.

1.  Fork the Project.
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the Branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## License

Distributed under the MIT License. See `LICENSE` file for more information (though for a single HTML file PoC, you might just state it here if you don't have a separate LICENSE file).
