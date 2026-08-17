/* ==========================================================================
   QUIZ-ENGINE.JS — renders the 10-question quiz and ties Timer + Scoring
   Responsibilities:
   - Start the QuizTimer and QuizScoring when the intake confirmation hands
     control to the quiz (the intake flow replaces the intake block with
     a #quiz-root stub; this engine watches for that node and starts).
   - Render one question at a time from QUIZ_QUESTIONS, show a mono
     counter (01 / 20), and let the user pick one answer per question.
   - Support `choice`, `hotspot`, and `audio` question types as described
     in the spec. Hotspot uses percentage coords and audio uses custom
     JS controls (play/pause/replay) with small inline SVGs.
   - On render, call QuizScoring.questionShown(); on answer, call
     QuizScoring.recordAnswer(category, categoryPoints) to accumulate.
   - Wire the QuizTimer: start it at quiz start, and handle its zero
     callback to gracefully finish the attempt (disable inputs, apply a
     subtle overlay, then persist results with any unanswered = 0).
   - Update the throughline fill after each answered question. The
     throughline spans TOTAL_STEPS = 24 (4 intake + 20 quiz).

   This file intentionally duplicates the small transition helper that
   other modules use because the web-animations API cannot read CSS
   custom properties and the project currently keeps its IIFEs closed.
   Every function is commented for auditability per the assignment.
   ========================================================================== */
(function () {
  "use strict";

  /* ---------------------- motion constants (mirror tokens.css) --------- */
  var EASE_OUT = "cubic-bezier(0.4, 0, 0.2, 1)";
  var EASE_IN = "cubic-bezier(0.4, 0, 1, 1)";
  var DURATION_OUT = 220;
  var DURATION_IN = 280;
  var DELAY_IN = 80;
  var DURATION_REDUCED = 100;

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------------------- DOM entry points ----------------------------- */
  var QUIZ_ROOT_ID = "quiz-root"; /* created by intake.js startQuiz() */
  var QUIZ_ROOT = null; /* will be the main render target */
  var THROUGHLINE = document.getElementById("throughline");
  var THROUGHLINE_FILL = document.getElementById("throughline-fill");

  /* ---------------------- journey shape -------------------------------- */
  var TOTAL_STEPS = 24; /* 4 intake + 20 quiz — the throughline spans all */
  var INTAKE_STEPS = 4;
  var QUIZ_TOTAL = window.QUIZ_QUESTIONS ? window.QUIZ_QUESTIONS.length : 20;

  /* ---------------------- runtime state -------------------------------- */
  var currentIndex = 0; /* 0-based index into QUIZ_QUESTIONS */
  var answers = {}; /* keyed by question id with selected option index or hotspot id */
  var disabled = false; /* when time runs out or finishing */
  var furthestIndex = -1; /* highest quiz index the user has reached; only increases */

  /* ---------------------- helpers: DOM creation ------------------------- */
  function el(tag, props, children) {
    var node = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        if (k === "className") node.className = props[k];
        else if (k === "html") node.innerHTML = props[k];
        else node.setAttribute(k, props[k]);
      });
    }
    if (children) {
      children.forEach(function (c) {
        if (typeof c === "string") node.appendChild(document.createTextNode(c));
        else node.appendChild(c);
      });
    }
    return node;
  }

  /* ---------------------- tiny transition helper ----------------------- */
  function transitionSwap(outEl, inEl, onDone) {
    if (!outEl) {
      // first render — simply append
      QUIZ_ROOT.appendChild(inEl);
      if (onDone) onDone();
      return;
    }
    if (reducedMotion.matches) {
      var fadeOut = outEl.animate(
        [{ opacity: 1 }, { opacity: 0 }],
        { duration: DURATION_REDUCED, easing: "linear", fill: "forwards" }
      );
      fadeOut.addEventListener("finish", function () {
        outEl.replaceWith(inEl);
        var fadeIn = inEl.animate(
          [{ opacity: 0 }, { opacity: 1 }],
          { duration: DURATION_REDUCED, easing: "linear", fill: "forwards" }
        );
        fadeIn.addEventListener("finish", function () {
          if (onDone) onDone();
        });
      });
      return;
    }

    outEl.animate(
      [
        { opacity: 1, transform: "translateY(0)" },
        { opacity: 0, transform: "translateY(-12px)" }
      ],
      { duration: DURATION_OUT, easing: EASE_IN, fill: "forwards" }
    );

    window.setTimeout(function () {
      outEl.replaceWith(inEl);
      var settle = inEl.animate(
        [
          { opacity: 0, transform: "translateY(12px)" },
          { opacity: 1, transform: "translateY(0)" }
        ],
        { duration: DURATION_IN, easing: EASE_OUT, fill: "forwards" }
      );
      settle.addEventListener("finish", function () {
        if (onDone) onDone();
      });
    }, DELAY_IN);
  }

  /* ---------------------- throughline update --------------------------- */
  function updateThroughline(progressPercent) {
    if (!THROUGHLINE_FILL || !THROUGHLINE) return;
    THROUGHLINE_FILL.style.setProperty("--throughline-progress", progressPercent + "%");
    THROUGHLINE.setAttribute("aria-valuenow", String(Math.round(progressPercent)));
  }

  function throughlineForIndex(ansCount) {
    var filled = INTAKE_STEPS + ansCount; /* answered steps so far */
    return (filled / TOTAL_STEPS) * 100;
  }

  /* computeThroughlinePercent — the throughline fill is driven by the
     furthest question index the user has reached (not the current view).
     This allows review without penalising progress. Prefer the shared
     AppProgress helper when present so intake and quiz stay in sync. */
  function computeThroughlinePercent() {
    if (window.AppProgress && typeof window.AppProgress.computePercent === 'function') {
      return window.AppProgress.computePercent(TOTAL_STEPS, INTAKE_STEPS, QUIZ_TOTAL);
    }
    var answered = Math.max(0, Math.min(QUIZ_TOTAL, furthestIndex + 1));
    return ((INTAKE_STEPS + answered) / TOTAL_STEPS) * 100;
  }

  /* ---------------------- counter element ------------------------------ */
  function buildCounter(index) {
    var counter = el("div", { className: "quiz-counter" });
    counter.textContent = String(index + 1).padStart(2, "0") + " / " + String(QUIZ_TOTAL).padStart(2, "0");
    return counter;
  }

  /* ---------------------- question renderers --------------------------- */
  function renderChoice(question) {
    var wrapper = el("div", { className: "quiz-question" });
    var prompt = el("p", { className: "question-prompt" }, [question.prompt]);
    wrapper.appendChild(prompt);

    var list = el("div", { className: "quiz-options" });
    question.options.forEach(function (opt, i) {
      var btn = el("button", { className: "quiz-option", type: "button" });
      btn.textContent = opt.label;
      btn.dataset.index = String(i);
      btn.addEventListener("click", function () {
        if (disabled) return;
        // Record the answer and advance immedately when choosing.
        handleAnswer(question, { type: "choice", index: i });
      });
      list.appendChild(btn);
    });
    wrapper.appendChild(list);
    return wrapper;
  }

  /* ---------------------- hotspot renderer ---------------------------- */
  function renderHotspot(question) {
    var wrapper = el("div", { className: "quiz-question quiz-hotspot" });

    // Image container — we cap max width in CSS (quiz.css) per spec; the
    // image leads the prompt for hotspot questions (design.md §8).
    var imgWrap = el("div", { className: "hotspot-image-wrap" });
    var img = document.createElement("img");
    img.src = question.imageSrc;
    img.alt = question.imageAlt || "Scenario image";
    img.className = "hotspot-image";
    imgWrap.appendChild(img);

    // Overlay container to host percentage-positioned interactive regions.
    var overlay = el("div", { className: "hotspot-overlay" });
    // Use relative positioning so percentage coords align to the image box.
    overlay.style.position = "absolute";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.right = "0";
    overlay.style.bottom = "0";

    // Create a positioned region for each hotspot.
    question.hotspots.forEach(function (hs, idx) {
      var region = el("button", { className: "hotspot-region", type: "button", 'aria-label': hs.label });
      // Coordinates are percentage values in the data.
      region.style.position = "absolute";
      region.style.left = hs.x + "%";
      region.style.top = hs.y + "%";
      region.style.width = hs.width + "%";
      region.style.height = hs.height + "%";
      region.style.background = "transparent";
      region.style.border = "none";
      region.style.cursor = "pointer";

      // No inline outline manipulation — hover/focus styles are handled
      // in CSS so keyboard focus-visible rules are not overridden.
      region.addEventListener("click", function () {
        if (disabled) return;
        // Add a transient selected class for visual confirmation.
        region.classList.add("hotspot-selected");
        window.setTimeout(function () {
          region.classList.remove("hotspot-selected");
        }, 250);
        handleAnswer(question, { type: "hotspot", index: idx });
      });

      overlay.appendChild(region);
    });

    // image container is positioned relative for the overlay to align
    var container = el("div", { className: "hotspot-container" });
    container.style.position = "relative";
    container.appendChild(img);
    container.appendChild(overlay);

    wrapper.appendChild(container);
    var prompt = el("p", { className: "question-prompt" }, [question.prompt]);
    wrapper.appendChild(prompt);
    return wrapper;
  }

  /* ---------------------- audio renderer ------------------------------ */
  function renderAudio(question) {
    var wrapper = el("div", { className: "quiz-question quiz-audio" });
    var prompt = el("p", { className: "question-prompt" }, [question.prompt]);

    // Create the underlying audio element (no native controls). The
    // custom controls below call play/pause/seek on it.
    var audio = document.createElement("audio");
    audio.src = question.audioSrc;
    audio.preload = "none";
    audio.className = "audio-element";

    // Custom controls row: play, pause, replay — small inline SVGs.
    var controls = el("div", { className: "audio-controls" });

    /* Use currentColor for SVG strokes so button color can reflect
       active state via `color`. svgPlay/svgPause/svgReplay return
       SVG markup that uses `currentColor` for stroke. */
    function svgPlay() {
      return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 5v14l11-7L8 5z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
    function svgPause() {
      return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 5h4v14H6zM14 5h4v14h-4z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
    function svgReplay() {
      return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 10v6h-6" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 10a8 8 0 10-2.3 5.6" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }

    // Single Play/Pause toggle + Replay. Track real playback state via
    // audio element events so UI never drifts from reality.
    var btnPlayPause = el("button", { className: "audio-playpause", type: "button", title: "Play", "aria-label": "Play" });
    btnPlayPause.innerHTML = svgPlay();
    // Replay button remains separate.
    var btnReplay = el("button", { className: "audio-replay", type: "button", title: "Replay", "aria-label": "Replay" });
    btnReplay.innerHTML = svgReplay();

    // Helper to set visual state when audio is playing vs paused.
    function setPlayingVisual(isPlaying) {
      if (isPlaying) {
        btnPlayPause.innerHTML = svgPause();
        btnPlayPause.setAttribute("aria-label", "Pause");
        // Use computed --moss color for active state to respect tokens.
        var moss = getComputedStyle(document.documentElement).getPropertyValue("--moss").trim();
        btnPlayPause.style.color = moss || "#3F5D48";
      } else {
        btnPlayPause.innerHTML = svgPlay();
        btnPlayPause.setAttribute("aria-label", "Play");
        var ink = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim();
        btnPlayPause.style.color = ink || "#1C1F1B";
      }
    }

    // Listen to the audio element's real events so state cannot drift.
    audio.addEventListener("play", function () {
      setPlayingVisual(true);
    });
    audio.addEventListener("pause", function () {
      setPlayingVisual(false);
    });
    audio.addEventListener("ended", function () {
      // ended should behave like paused for the UI
      setPlayingVisual(false);
    });

    // Toggle play/pause based on actual audio state.
    btnPlayPause.addEventListener("click", function () {
      if (disabled) return;
      if (audio.paused) {
        audio.play().catch(function (err) {
          // swallow play errors (autoplay policy shouldn't apply on user click)
          console.warn("Audio play failed:", err);
        });
      } else {
        audio.pause();
      }
    });

    // Replay resets to 0 and starts playback; the audio 'play' event will
    // flip the visual state to playing immediately after.
    btnReplay.addEventListener("click", function () {
      audio.currentTime = 0;
      audio.play().catch(function (err) {
        console.warn("Audio play failed:", err);
      });
    });

    // Show options alongside the audio controls immediately (chosen
    // to let users read answers before/while listening). Comment: the
    // assignment permits either approach; showing them improves
    // accessibility by exposing choices to screen readers early.
    var optionsList = el("div", { className: "quiz-options" });
    question.options.forEach(function (opt, i) {
      var btn = el("button", { className: "quiz-option", type: "button" });
      btn.textContent = opt.label;
      btn.dataset.index = String(i);
      btn.addEventListener("click", function () {
        if (disabled) return;
        handleAnswer(question, { type: "choice", index: i });
      });
      optionsList.appendChild(btn);
    });

    var controlsRow = el("div", { className: "audio-control-row" });
    // Ensure the initial visual state matches a paused audio element.
    setPlayingVisual(false);
    controlsRow.appendChild(btnPlayPause);
    controlsRow.appendChild(btnReplay);

    wrapper.appendChild(prompt);
    wrapper.appendChild(audio);
    wrapper.appendChild(controlsRow);
    wrapper.appendChild(optionsList);

    return wrapper;
  }

  /* ---------------------- central render function ---------------------- */
  function renderQuestion(index) {
    var questions = window.QUIZ_QUESTIONS;
    if (!questions || !Array.isArray(questions)) {
      console.error("QuizEngine: QUIZ_QUESTIONS is not loaded or invalid.");
      return el("div", { className: "quiz-error" }, ["Quiz data not available."]);
    }
    var q = questions[index];
    if (!q) {
      console.warn("QuizEngine: no question at index", index);
      return el("div", { className: "quiz-empty" }, ["No question available."]);
    }

    var container = el("div", { className: "quiz-block" });
    var counter = buildCounter(index);
    container.appendChild(counter);

    var content;
    if (q.type === "choice") content = renderChoice(q);
    else if (q.type === "hotspot") content = renderHotspot(q);
    else if (q.type === "audio") content = renderAudio(q);
    else content = renderChoice(q); /* fallback */

    container.appendChild(content);

    /* Controls row: only Back remains on quiz questions. Next is
       intentionally removed — selecting an option auto-advances the
       quiz to the next question (see Fix 2). We still place the Back
       button inside the shared .nav-controls container so spacing is
       consistent with intake where Back/Next appear together. */
    var controls = el("div", { className: "nav-controls" });
    var btnBack = el("button", { className: "btn-text btn-back", type: "button" });
    btnBack.textContent = "Back";

    if (index === 0) {
      btnBack.setAttribute("disabled", "disabled");
      btnBack.classList.add("is-hidden");
    }

    // Restore any previously chosen answer visually so review shows state.
    function restoreSelection() {
      if (!window.QuizScoring || typeof window.QuizScoring.getAnswerForQuestion !== "function") return;
      var stored = window.QuizScoring.getAnswerForQuestion(question.id);
      if (!stored) {
        return;
      }
      // choice/hotspot restoration
      if (stored.selection && stored.selection.type === "choice") {
        var opt = QUIZ_ROOT.querySelector('.quiz-option[data-index="' + stored.selection.index + '"]');
        if (opt) opt.style.outline = "2px solid var(--moss)";
      } else if (stored.selection && stored.selection.type === "hotspot") {
        var regions = QUIZ_ROOT.querySelectorAll('.hotspot-region');
        var r = regions[stored.selection.index];
        if (r) r.classList.add('hotspot-selected');
      }
    }

    btnBack.addEventListener("click", function () {
      if (disabled) return;
      if (index <= 0) return;
      // Navigates to the previous question without altering the history.
      currentIndex = index - 1;
      // Show the previous question; do not reduce furthestIndex.
      showQuestion(currentIndex);
    });

    controls.appendChild(btnBack);
    container.appendChild(controls);

    // Restore selection visual state after the node is attached to DOM
    // so querySelector calls find the elements.
    window.setTimeout(restoreSelection, 0);

    return container;
  }

  /* ---------------------- orchestration: question lifecycle ------------ */
  function showQuestion(index) {
    var out = QUIZ_ROOT.querySelector(".quiz-block");
    var next = renderQuestion(index);
    transitionSwap(out, next, function () {
      // After the incoming has settled, stamp the scoring timer and
      // perform any DOM wiring needed (e.g. focus). QuizScoring uses
      // questionShown() to mark the display time.
      if (window.QuizScoring && typeof window.QuizScoring.questionShown === "function") {
        window.QuizScoring.questionShown();
      }
      // Focus the first interactive element so keyboard users can act.
      var first = QUIZ_ROOT.querySelector("button, [tabindex]");
      if (first) first.focus({ preventScroll: true });
    });
  }

  /* ---------------------- answer handling ----------------------------- */
  function handleAnswer(question, selection) {
    // Map selection to the categoryPoints value.
    var points = 0;
    if (selection.type === "choice") {
      var opt = question.options[selection.index];
      points = opt ? opt.categoryPoints : 0;
      // mark UI selected state briefly
      markSelectedOption(selection.index);
    } else if (selection.type === "hotspot") {
      var hs = question.hotspots[selection.index];
      points = hs ? hs.categoryPoints : 0;
      // UI handled by hotspot region visual already
    }

    // Record the answer with QuizScoring (it measures time-to-answer
    // against the earlier questionShown() stamp). recordAnswer returns
    // a breakdown; we store the raw selected index for traceability.
    if (window.QuizScoring && typeof window.QuizScoring.recordAnswer === "function") {
      // recordAnswer(questionId, category, categoryPoints, selection)
      window.QuizScoring.recordAnswer(question.id, question.category, points, selection);
    }

    // Prevent duplicate clicks while the selected-state is shown and
    // during the transition. We intentionally do NOT pause the shared
    // quiz timer while reviewing or during this delay.
    disabled = true;

    // Keep the selected visual state briefly so the user sees confirmation
    // (150-200ms) before the screen transitions; this avoids an abrupt
    // jump and gives clear feedback that the click registered.
    window.setTimeout(function () {
      // Update the furthest index reached when a new question is answered.
      if (currentIndex > furthestIndex) {
        furthestIndex = currentIndex;
      }
      if (window.AppProgress) {
        window.AppProgress.furthestQuiz = Math.max(window.AppProgress.furthestQuiz || -1, currentIndex);
      }

      answers[question.id] = selection;
      currentIndex += 1;

      // Update throughline based on the furthest progress.
      var progress = computeThroughlinePercent();
      var outgoing = QUIZ_ROOT.querySelector(".quiz-block");
      var nextBlock = currentIndex < QUIZ_TOTAL ? renderQuestion(currentIndex) : buildFinishStub();
      transitionSwap(outgoing, nextBlock, function () {
        // Re-enable interactions for the next question. If we've
        // finished the quiz, finishQuiz() will set disabled=true.
        disabled = false;
        updateThroughline(progress);
        if (currentIndex < QUIZ_TOTAL) {
          if (window.QuizScoring && typeof window.QuizScoring.questionShown === "function") {
            window.QuizScoring.questionShown();
          }
        } else {
          // finished the last question — finalize the quiz
          finishQuiz();
        }
      });
    }, 175);
  }

  function markSelectedOption(optionIndex) {
    // briefly highlight the selected .quiz-option in the current view
    var opts = QUIZ_ROOT.querySelectorAll(".quiz-option");
    opts.forEach(function (b) {
      b.style.border = "none";
    });
    var chosen = QUIZ_ROOT.querySelector('.quiz-option[data-index="' + optionIndex + '"]');
    if (chosen) {
      chosen.style.outline = "2px solid var(--moss)";
      window.setTimeout(function () {
        chosen.style.outline = "none";
      }, 250);
    }
  }

  /* ---------------------- finish & timeout handling ------------------- */
  function buildFinishStub() {
    var stub = el("div", { className: "quiz-finish-stub" });
    stub.textContent = "Results will render here";
    return stub;
  }

  function finishQuiz() {
    if (disabled) return; // prevent double-run
    disabled = true;

    // Stop and hide the timer.
    if (window.QuizTimer && typeof window.QuizTimer.stop === "function") {
      window.QuizTimer.stop();
      window.QuizTimer.hide();
    }

    // Ask QuizScoring for the final tally and persist to sessionStorage
    // under the required key "quizResults". Then replace the UI with
    // the results placeholder (results.js will later render the full
    // experience when the user navigates to results.html).
    var tally = (window.QuizScoring && typeof window.QuizScoring.getFinalTally === "function") ? window.QuizScoring.getFinalTally() : null;
    try {
      sessionStorage.setItem("quizResults", JSON.stringify(tally || {}));
    } catch (e) {
      // ignore storage errors — still redirect to results placeholder
    }

    // Replace the UI with the final stub and navigate the user to
    // results.html after a short delay so they see the completion.
    var out = QUIZ_ROOT.querySelector(".quiz-block");
    var finish = buildFinishStub();
    transitionSwap(out, finish, function () {
      // Also resolve the throughline to full completion visually (100%)
      updateThroughline(100);
      // Move to results.html after a tiny pause to let the animation
      // settle; this keeps the flow obvious to users.
      window.setTimeout(function () {
        window.location.href = "results.html";
      }, 400);
    });
  }

  function onTimerZero() {
    // When the timer hits zero mid-quiz, disable interactions, apply
    // a subtle overlay, then finalize the attempt using whatever
    // answers were submitted so far (unanswered = 0 contribution).
    disabled = true;
    var overlay = el("div", { className: "quiz-timeout-overlay" });
    overlay.style.position = "absolute";
    overlay.style.inset = "0";
    overlay.style.background = "rgba(240,238,232,0.6)"; // muted --paper tint
    overlay.style.pointerEvents = "none";
    var block = QUIZ_ROOT.querySelector(".quiz-block");
    if (block) block.appendChild(overlay);

    // Wait 600ms for the subtle overlay to register, then finish.
    window.setTimeout(function () {
      finishQuiz();
    }, 600);
  }

  /* ---------------------- engine lifecycle ---------------------------- */
  function startEngine() {
    if (QUIZ_ROOT) return; // already started
    QUIZ_ROOT = document.getElementById(QUIZ_ROOT_ID);
    if (!QUIZ_ROOT) return;

    // Render-order guard: ensure any placeholder content inserted by the
    // intake flow (e.g. "Quiz questions will render here.") is cleared
    // before we render the first real question. This prevents stale
    // placeholder text from appearing above the quiz UI.
    QUIZ_ROOT.innerHTML = "";

    // Ensure quiz data is present before launching; retry briefly if it's not.
    if (!window.QUIZ_QUESTIONS || !Array.isArray(window.QUIZ_QUESTIONS)) {
      console.warn("QuizEngine: QUIZ_QUESTIONS not yet available — delaying start.");
      window.setTimeout(startEngine, 50);
      return;
    }

    // Ensure scoring timer knows when the attempt begins.
    if (window.QuizScoring && typeof window.QuizScoring.startTotalTimer === "function") {
      window.QuizScoring.startTotalTimer();
    }

    // Start the shared quiz timer and pass the zero callback.
    if (window.QuizTimer && typeof window.QuizTimer.start === "function") {
      window.QuizTimer.start(onTimerZero);
    }

    // Launch the first question. The intake filled the throughline to
    // INTAKE_STEPS / TOTAL_STEPS already; quiz begins at currentIndex = 0.
    showQuestion(currentIndex);
  }

  /* ---------------------- mutation observer to detect start ----------- */
  var bodyObserver = new MutationObserver(function () {
    if (!document.getElementById(QUIZ_ROOT_ID)) return;
    // Small delay so intake's transitionSwap completes and quiz-root is
    // firmly in the DOM.
    window.setTimeout(startEngine, 30);
  });
  bodyObserver.observe(document.body, { childList: true, subtree: true });

  /* If the stub already exists (e.g., user reload or intake ran earlier),
     start immediately. */
  if (document.readyState === "complete" || document.readyState === "interactive") {
    if (document.getElementById(QUIZ_ROOT_ID)) startEngine();
  } else {
    window.addEventListener("DOMContentLoaded", function () {
      if (document.getElementById(QUIZ_ROOT_ID)) startEngine();
    });
  }

  /* Expose for testing/debugging in the console in a read-only way. */
  window.QuizEngine = {
    _startEngine: startEngine
  };
})();
