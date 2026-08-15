Soft Skill Development
======================

A quiet, guided self-reflection web app that helps new students assess soft skills (communication, critical thinking, time management, leadership) and get pragmatic next steps.

Pages
- index.html — Landing: headline, short description, hero image placeholder, primary CTA to start the intake.
- quiz.html — Intake + Quiz: the conversational intake (name, email, phone, student ID) followed by a 20-question quiz. Throughline progress motif appears here.
- results.html — Results: personalised headline, feedback paragraph, responsive Canvas bar chart, and a text link to contact an adviser.
- contact.html — Contact & Feedback: traditional 3-field contact form (name, email, message), with inline validation and a simulated confirmation.

Tech
- Vanilla HTML5, CSS3, and modern ES6+ JavaScript.
- No frameworks, no component libraries, no charting libraries, no icon libraries — all UI and charting are hand-written per the assignment.

How to run
- No build step required. Open `index.html` in a browser, or serve the folder with a static file server (e.g., `python -m http.server 8000`) and visit `http://localhost:8000`.

Known placeholders to replace before submission
- `assets/hero-placeholder.jpg` — landing hero image. Replace with a real Creative Commons or Unsplash photograph (candid, human). Log attribution.
- `assets/hotspot-scenario.jpg` — hotspot question image. Replace with an appropriate photograph and log attribution.
- `assets/audio-prompt-1.mp3` — audio prompt for a communication question. Replace with a licensed/own recording and log attribution.
- `contact.html` — GitHub repository and live site hrefs currently `#` placeholders; fill with the real repository and GitHub Pages URL.

Notes
- All design tokens (colors, type sizes, spacing, motion timings) live in `css/tokens.css` and are used throughout.
- The throughline spans the full journey (4 intake + 20 quiz = 24 steps) and is animated via CSS + small orchestration in JS.

If you want, I can now run a local smoke-check of the interactive flow by opening the pages in a headless browser simulation and reporting any console errors; or I can proceed to the next prompt you mentioned.