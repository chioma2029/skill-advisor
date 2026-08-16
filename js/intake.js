/* ==========================================================================
   INTAKE.JS — conversational intake flow (quiz.html)
   Collects name, email, phone number, and student ID one question at a
   time — a guided conversation, never a form. Validation behavior follows
   design.md §8, all motion follows §6, and no alert()/browser popup is
   used anywhere: errors render inline as .error-message text.
   ========================================================================== */
(function () {
  "use strict";

  /* ---------------------------------------------------------------------
     Motion constants — mirror the tokens in tokens.css (§6). They are
     duplicated here because the question transition is orchestrated with
     the Web Animations API, which cannot read CSS custom properties.
     --------------------------------------------------------------------- */
  var EASE_OUT = "cubic-bezier(0.4, 0, 0.2, 1)"; /* anything appearing */
  var EASE_IN = "cubic-bezier(0.4, 0, 1, 1)";    /* anything leaving */
  var DURATION_OUT = 220;      /* outgoing question fade/slide */
  var DURATION_IN = 280;       /* incoming question settle */
  var DELAY_IN = 80;           /* incoming starts 80ms after outgoing */
  var DURATION_REDUCED = 100;  /* prefers-reduced-motion crossfade cap */
  var DURATION_THROUGHLINE = 400; /* draw-on arrival animation */

  /* Checked live each time so a setting change mid-session is respected. */
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    /* ---------------------------------------------------------------------
      Journey shape — the throughline spans the FULL journey (intake + quiz).
      Rather than hardcoding "24", compute the total steps from the number
      of intake questions (QUESTIONS.length) plus the actual quiz questions
      array length when available. This prevents drift if the quiz length
      changes in future. When QUIZ_QUESTIONS is not yet loaded (early in
      startup), fall back to the historical value of 20.
      --------------------------------------------------------------------- */
    function totalSteps() {
     var quizLen = window.QUIZ_QUESTIONS ? window.QUIZ_QUESTIONS.length : 20;
     return QUESTIONS.length + quizLen;
    }

  /* ---------------------------------------------------------------------
     The four intake questions. Each validate() returns true when the value
     passes, or a specific, plain error string when it fails (§8:
     "specific and plain", never just "Invalid input").
     --------------------------------------------------------------------- */
  var QUESTIONS = [
    {
      id: "name",
      prompt:
        "Hi! Welcome to Soft Skill Development. Before we begin, may I have your name?",
      placeholder: "Caleb",
      type: "text",
      autocomplete: "name",
      /* Letters and spaces only: letter-words separated by single spaces,
         at least 2 characters in total. Rejects digits, punctuation,
         leading/trailing spaces, and double spaces. */
      validate: function (value) {
        var name = value.trim();
        var pattern = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
        if (pattern.test(name) && name.length >= 2) {
          return true;
        }
        return "Enter your name using letters only. Do not use numbers or symbols.";
      }
    },
    {
      id: "email",
      prompt: "Thanks, {name}. What email address should we send your results to?",
      placeholder: "student.id@bse.ac.mu",
      type: "email",
      autocomplete: "email",
      /* Accepts EITHER a standard address (local@domain.tld) OR the
         institutional student format (student.id@bse.ac.mu) — either one
         passes. */
      validate: function (value) {
        var email = value.trim();
        var standard = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
        var institutional = /^[A-Za-z0-9.]+@bse\.ac\.mu$/;

        /* Block list of common personal/personal-provider domains. Kept
           local here so intake and contact can remain independent while
           using the same approach; the list is intentionally simple and
           extendable. */
        var blockedDomains = [
          "gmail.com",
          "yahoo.com",
          "outlook.com",
          "hotmail.com",
          "icloud.com",
          "aol.com",
          "live.com",
          "msn.com",
          "protonmail.com"
        ];

        // First check format.
        if (!(standard.test(email) || institutional.test(email))) {
          return "Enter a valid email. For example, name@example.com or student.id@bse.ac.mu.";
        }

        // Then check domain against block list.
        var parts = email.split("@");
        var domain = (parts[1] || "").toLowerCase();
        for (var i = 0; i < blockedDomains.length; i++) {
          var d = blockedDomains[i];
          if (domain === d || domain.endsWith("." + d)) {
            return "Thanks for checking — please use your institutional or organisational email address so we can reach you properly.";
          }
        }

        return true;
      }
    },
    {
      id: "phone",
      prompt: "Got it. And the best phone number to reach you on?",
      placeholder: "+230 5 123 4567",
      type: "tel",
      autocomplete: "tel",
      /* Accepts an optional leading + followed by digit groups separated by
         single spaces or dashes, then counts digits only and requires 8–15
         of them. Rejects letters, parentheses, dots, a + anywhere but the
         start, and too-short or too-long numbers. */
      validate: function (value) {
        var phone = value.trim();
        var shape = /^\+?[0-9]+(?:[ -][0-9]+)*$/;
        var digits = phone.replace(/[^0-9]/g, "");
        if (shape.test(phone) && digits.length >= 8 && digits.length <= 15) {
          return true;
        }
        return "Enter a valid phone number. Use 8 to 15 digits, with an optional + and spaces or dashes.";
      }
    },
    {
      id: "studentId",
      prompt: "Nearly done. Last one: what is your student ID?",
      placeholder: "104582",
      type: "text",
      inputmode: "numeric",
      autocomplete: "off",
      /* Exactly six digits — the standard student ID length. Rejects
         letters, spaces, and shorter or longer numbers. */
      validate: function (value) {
        if (/^[0-9]{6}$/.test(value.trim())) {
          return true;
        }
        return "Enter a valid student ID. It must be exactly 6 digits, numbers only.";
      }
    }
  ];

  var answers = {};     /* collected values, keyed by question id */
  var current = 0;      /* index of the question currently on screen */
  var failedOnce = {};  /* per-field flag: first validation already failed */

  // Shared progress tracker used by both intake and quiz to report the
  // furthest progress reached without reducing when a user reviews.
  window.AppProgress = window.AppProgress || { furthestIntake: -1, furthestQuiz: -1, computePercent: function (TOTAL_STEPS, INTAKE_STEPS, QUIZ_TOTAL) {
    var intakeAnswered = Math.max(0, Math.min(INTAKE_STEPS, this.furthestIntake + 1));
    var quizAnswered = Math.max(0, Math.min(QUIZ_TOTAL, this.furthestQuiz + 1));
    var filled = intakeAnswered + quizAnswered;
    return (filled / TOTAL_STEPS) * 100;
  } };

  var container = document.getElementById("question-container");
  var throughline = document.getElementById("throughline");
  var throughlineFill = document.getElementById("throughline-fill");

  /* ---------------------------------------------------------------------
     buildQuestion — builds the DOM for one intake question: the prompt in
     display typography, one .input-underline, one inline .error-message
     slot, and a single "Next" .btn-primary (§7: exactly one question, one
     input, one action on screen). Elements are created with
     document.createElement and filled with textContent, so no string is
     ever parsed as HTML. "{name}" in a prompt is replaced with the answer
     given so far, keeping the flow conversational.
     --------------------------------------------------------------------- */
  function buildQuestion(question) {
    var block = document.createElement("div");
    block.className = "question-block";

    var prompt = document.createElement("p");
    prompt.className = "question-prompt";
    prompt.textContent = question.prompt.replace("{name}", answers.name || "");

    var input = document.createElement("input");
    input.className = "input-underline";
    input.type = question.type;
    input.id = "input-" + question.id;
    input.placeholder = question.placeholder;
    input.setAttribute("aria-describedby", "error-" + question.id);
    if (question.autocomplete) {
      input.setAttribute("autocomplete", question.autocomplete);
    }
    if (question.inputmode) {
      input.setAttribute("inputmode", question.inputmode);
    }

    var error = document.createElement("p");
    error.className = "error-message";
    error.id = "error-" + question.id;
    error.setAttribute("aria-live", "polite");

    var next = document.createElement("button");
    next.className = "btn-primary";
    next.type = "button";
    next.textContent = "Next";

    var back = document.createElement("button");
    back.className = "btn-text btn-back";
    back.type = "button";
    back.textContent = "Back";
    if (current === 0) {
      back.setAttribute("disabled", "disabled");
    }

    // Restore previously-typed value when navigating back.
    if (answers[question.id]) {
      input.value = answers[question.id];
      // re-run validation to show state
      checkField(question, input, error);
    }

    /* §8 — validate on blur for the field's first attempt. An untouched,
       empty field is skipped here (tabbing past is not an attempt); the
       Next button catches that case instead. Once a field has failed once,
       blur always validates. */
    input.addEventListener("blur", function () {
      if (failedOnce[question.id] || input.value.trim() !== "") {
        checkField(question, input, error);
      }
    });

    /* §8 — after the first failure, validate live on every input event
       (real-time state toggling) until the field passes. */
    input.addEventListener("input", function () {
      if (failedOnce[question.id]) {
        checkField(question, input, error);
      }
    });

    /* Enter advances exactly like Next — the flow is a conversation. */
    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        tryAdvance(question, input, error, block);
      }
    });

    next.addEventListener("click", function () {
      tryAdvance(question, input, error, block);
    });

    back.addEventListener("click", function () {
      // Navigate back to previous intake question and restore value.
      if (current <= 0) return;
      var outgoing = container.querySelector('.question-block');
      current -= 1;
      var prevBlock = buildQuestion(QUESTIONS[current]);
      transitionSwap(outgoing, prevBlock, function () {
        focusFirstInteractive(prevBlock);
      });
    });

    block.appendChild(prompt);
    block.appendChild(input);
    block.appendChild(error);
    var controls = document.createElement('div');
    // Use the shared nav-controls container so Back/Next pairs are laid
    // out consistently with a guaranteed gap between them (see
    // components.css .nav-controls). This prevents visual collision.
    controls.className = 'nav-controls';
    controls.appendChild(back);
    controls.appendChild(next);
    block.appendChild(controls);
    return block;
  }

  /* ---------------------------------------------------------------------
     checkField — runs the current question's validator against the input
     and applies the §8 states: .is-invalid + the specific .error-message
     on failure (and flips the field into live-validation mode), .is-valid
     on success. Returns true when the value passes.
     --------------------------------------------------------------------- */
  function checkField(question, input, error) {
    var result = question.validate(input.value);
    if (result === true) {
      input.classList.remove("is-invalid");
      input.classList.add("is-valid");
      input.setAttribute("aria-invalid", "false");
      error.classList.remove("is-visible");
      error.textContent = "";
      return true;
    }
    failedOnce[question.id] = true;
    input.classList.remove("is-valid");
    input.classList.add("is-invalid");
    input.setAttribute("aria-invalid", "true");
    error.textContent = result;
    error.classList.add("is-visible");
    return false;
  }

  /* ---------------------------------------------------------------------
     tryAdvance — the gate behind Next/Enter: validates the field, and only
     when it passes stores the answer, swaps in the next question (or the
     confirmation screen after the fourth), then fills the throughline.
     --------------------------------------------------------------------- */
  function tryAdvance(question, input, error, block) {
    if (!checkField(question, input, error)) {
      input.focus({ preventScroll: true });
      return;
    }

    // Store the answer and mark furthest intake progress.
    answers[question.id] = input.value.trim();
    // Update shared furthest progress tracker for intake.
    window.AppProgress.furthestIntake = Math.max(window.AppProgress.furthestIntake, current);
    current += 1;

     /* §4/§6 — compute throughline progress using the real current total
       steps so the fill never drifts if the quiz length changes. */
     var progress = window.AppProgress.computePercent(totalSteps(), QUESTIONS.length, window.QUIZ_QUESTIONS ? window.QUIZ_QUESTIONS.length : 20);

    var nextBlock =
      current < QUESTIONS.length
        ? buildQuestion(QUESTIONS[current])
        : buildConfirmation();

    transitionSwap(block, nextBlock, function () {
      updateThroughline(progress);
      focusFirstInteractive(nextBlock);
    });
  }

  /* ---------------------------------------------------------------------
     buildConfirmation — the unnumbered screen after the fourth answer,
     addressing the user by the name they actually entered. The throughline
     is 4/24 filled at this point — the intake leg is complete, the quiz
     leg continues the same line (design.md §4).
     --------------------------------------------------------------------- */
  function buildConfirmation() {
    var block = document.createElement("div");
    block.className = "question-block";

    var prompt = document.createElement("p");
    prompt.className = "question-prompt";
    prompt.textContent =
      "Perfect, " +
      answers.name +
      ". I have everything I need. Are you ready to take your assessment?";

    var ready = document.createElement("button");
    ready.className = "btn-primary";
    ready.type = "button";
    ready.textContent = "I'm Ready";
    ready.addEventListener("click", startQuiz);

    block.appendChild(prompt);
    block.appendChild(ready);
    return block;
  }

  /* ---------------------------------------------------------------------
     startQuiz — persists the four intake answers to sessionStorage under
     the key "intakeData" (as a JSON string) for the quiz engine built in
     the next batch, then transitions to the #quiz-root placeholder stub.
     --------------------------------------------------------------------- */
  function startQuiz() {
    sessionStorage.setItem("intakeData", JSON.stringify(answers));
    // Mark the intake leg as fully reached for the throughline.
    if (window.AppProgress) {
      window.AppProgress.furthestIntake = Math.max(window.AppProgress.furthestIntake, QUESTIONS.length - 1);
    }

    var stub = document.createElement("div");
    stub.id = "quiz-root";
    stub.textContent = "Quiz questions will render here.";

    var outgoing = container.querySelector(".question-block");
    transitionSwap(outgoing, stub, function () {
      /* The throughline covers the full journey. Compute the real total
         steps dynamically and ask the shared tracker for the percent so
         intake and quiz remain in sync. */
      if (window.AppProgress && typeof window.AppProgress.computePercent === 'function') {
        updateThroughline(window.AppProgress.computePercent(totalSteps(), QUESTIONS.length, window.QUIZ_QUESTIONS ? window.QUIZ_QUESTIONS.length : 20));
      } else {
        updateThroughline((QUESTIONS.length / totalSteps()) * 100);
      }
    });
  }

  /* ---------------------------------------------------------------------
     transitionSwap — the §6 question transition. The outgoing question
     fades to 0 opacity and slides up 12px over 220ms (ease-in, for
     anything leaving); the incoming question starts at 0 opacity / +12px
     and settles over 280ms (ease-out, for anything appearing), beginning
     80ms after the outgoing animation starts — a slight overlap, not a
     hard cut. With prefers-reduced-motion the whole swap collapses to a
     100ms opacity crossfade. onDone fires once the incoming block has
     settled.
     --------------------------------------------------------------------- */
  function transitionSwap(outEl, inEl, onDone) {
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
          if (onDone) {
            onDone();
          }
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
        if (onDone) {
          onDone();
        }
      });
    }, DELAY_IN);
  }

  /* ---------------------------------------------------------------------
     updateThroughline — sets the fill proportion on the throughline. One
     custom property drives both responsive versions at once: the desktop
     rail animates height, the mobile bar animates width (components.css),
     so a single value survives viewport rotation. The 400ms fill animation
     itself lives in CSS (--duration-throughline). Progress is mirrored
     into the progressbar semantics so color is never the only signal
     (§10).
     --------------------------------------------------------------------- */
  function updateThroughline(percent) {
    throughlineFill.style.setProperty("--throughline-progress", percent + "%");
    throughline.setAttribute("aria-valuenow", String(Math.round(percent)));
  }

  /* ---------------------------------------------------------------------
     drawThroughlineOn — §4's one "arrival" moment: the throughline quietly
     draws itself on as the first intake question loads (top → bottom on
     desktop, left → right on mobile). Skipped entirely under
     prefers-reduced-motion, where it simply exists.
     --------------------------------------------------------------------- */
  function drawThroughlineOn() {
    if (reducedMotion.matches) {
      return;
    }
    var mobile = window.matchMedia("(max-width: 1023px)").matches;
    throughline.style.transformOrigin = "left top";
    throughline.animate(
      [
        { transform: mobile ? "scaleX(0)" : "scaleY(0)" },
        { transform: "none" }
      ],
      { duration: DURATION_THROUGHLINE, easing: EASE_OUT }
    );
  }

  /* ---------------------------------------------------------------------
     focusFirstInteractive — moves keyboard focus to the new block's input
     (or button, on the confirmation screen) so the conversation keeps
     flowing without a mouse. preventScroll keeps the centered layout
     still.
     --------------------------------------------------------------------- */
  function focusFirstInteractive(block) {
    var target = block.querySelector("input, button");
    if (target) {
      target.focus({ preventScroll: true });
    }
  }

  /* ---------------------------------------------------------------------
     init — draws the throughline on and renders the first question.
     --------------------------------------------------------------------- */
  function init() {
    drawThroughlineOn();
    var first = buildQuestion(QUESTIONS[0]);
    container.appendChild(first);
    focusFirstInteractive(first);
  }

  init();
})();
