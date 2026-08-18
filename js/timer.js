/* ==========================================================================
   TIMER.JS — the single countdown timer for the whole quiz
   One timer for the entire quiz attempt, set to 120 seconds (2 minutes)
   per the requirement. Displayed top-right of the quiz viewport in the
   mono/data typography role (design.md §5/§8): plain MM:SS numerals,
   --ink at 60% opacity, switching to --clay (full opacity) once remaining
   time drops below 20% of the total. This is intentional: the 20% rule
   scales with duration, so a 2-minute quiz warns at 24 seconds remaining,
   not at a fixed 24-second threshold that would be unrelated to the full
   duration. No flashing, no shaking (§8).

   INTERVAL LOGIC (assignment requirement: setInterval / clearInterval)
   ---------------------------------------------------------------------
   start() records a wall-clock end time (endsAt = now + 120s) and opens
   ONE setInterval that ticks four times a second. Every tick re-derives
   the remaining time from the wall clock instead of decrementing a
   counter, so the display can never drift even if a tick runs late (a
   background tab, a busy frame). When the remaining time reaches zero
   the interval is closed with clearInterval BEFORE the zero callback
   fires, so the callback can never be invoked twice.

   CLEANUP
   ---------------------------------------------------------------------
   clearInterval happens in exactly two places: stop() (called by the
   quiz engine when the attempt finishes early, and internally at zero)
   and the pagehide listener (the user navigating away mid-quiz). Both
   guarantee no interval is ever left running without its display.
   ========================================================================== */
(function () {
  "use strict";

  var TOTAL_SECONDS = 120;                    /* 2 minutes for the whole quiz */
  var WARNING_SECONDS = TOTAL_SECONDS * 0.2;  /* 24s — the <20% color switch */
  var TICK_MS = 250;                          /* 4 ticks/second keeps the display crisp */

  var intervalId = null;      /* the live setInterval id, or null when stopped */
  var endsAt = 0;             /* wall-clock ms at which the attempt times out */
  var display = null;         /* the MM:SS element, created on first start() */
  var onZeroCallback = null;  /* fired exactly once when time runs out */

  /* formatSeconds — renders whole seconds as MM:SS with zero padding
     (e.g. 480 → "08:00", 95 → "01:35", 0 → "00:00"). */
  function formatSeconds(totalSeconds) {
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;
    return (minutes < 10 ? "0" : "") + minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
  }

  /* ensureDisplay — builds the timer element once and pins it top-right of
     the viewport (quiz.css positions it). role="timer" with aria-live off:
     a ticking live region would spam screen readers every second; the
     numeral itself stays fully legible, per §10. */
  function ensureDisplay() {
    if (display) {
      return;
    }
    display = document.createElement("div");
    display.className = "quiz-timer";
    display.id = "quiz-timer";
    display.setAttribute("role", "timer");
    display.setAttribute("aria-live", "off");
    display.setAttribute("aria-label", "Time remaining");
    document.body.appendChild(display);
  }

  /* render — writes the MM:SS numerals and toggles the warning state.
     The warning compares the exact remaining milliseconds against 20% of
     the total, so the color flips the moment time genuinely drops under
     96 seconds — not a second early or late. */
  function render(remainingMs) {
    var shownSeconds = Math.ceil(remainingMs / 1000);
    display.textContent = formatSeconds(shownSeconds);
    if (remainingMs < WARNING_SECONDS * 1000) {
      display.classList.add("is-warning"); /* --ink → --clay, nothing more */
    } else {
      display.classList.remove("is-warning");
    }
  }

  /* tick — one interval beat: recompute remaining time from the wall
     clock, repaint, and if the attempt has expired, close the interval
     first and then fire the zero callback exactly once. */
  function tick() {
    var remainingMs = Math.max(0, endsAt - Date.now());
    render(remainingMs);
    if (remainingMs <= 0) {
      stop();
      var callback = onZeroCallback;
      onZeroCallback = null; /* never fire twice */
      if (callback) {
        callback();
      }
    }
  }

  /* start — opens the single countdown for the whole quiz. onZero fires
     once when time runs out. Calling start() while a timer is already
     running cleanly replaces it (old interval cleared first). */
  function start(onZero) {
    stop();
    onZeroCallback = onZero || null;
    ensureDisplay();
    endsAt = Date.now() + TOTAL_SECONDS * 1000;
    render(TOTAL_SECONDS * 1000);
    intervalId = window.setInterval(tick, TICK_MS);
  }

  /* stop — the clearInterval half of the pair: closes the interval if it
     is open. Safe to call any number of times. */
  function stop() {
    if (intervalId !== null) {
      window.clearInterval(intervalId);
      intervalId = null;
    }
  }

  /* hide — removes the timer element from the page (the engine calls this
     when the attempt is over and the numeral is no longer relevant). */
  function hide() {
    stop();
    if (display && display.parentNode) {
      display.parentNode.removeChild(display);
      display = null;
    }
  }

  /* Navigation away mid-quiz: never leave an interval running behind the
     page. pagehide covers both navigation and tab closure. */
  window.addEventListener("pagehide", stop);

  window.QuizTimer = {
    start: start,
    stop: stop,
    hide: hide,
    TOTAL_SECONDS: TOTAL_SECONDS
  };
})();
