/* ==========================================================================
   SCORING.JS — the quiz scoring rubric
   One running total per category, a fast-answer streak counter, and two
   multipliers. Every function is commented and the math is written out
   step by step so the rubric can be audited line by line.

   THE RULES, PLAINLY
   ---------------------------------------------------------------------
   1. Running totals — one total per category (Communication, Critical
      Thinking, Time Management, Leadership), all starting at 0.

   2. Fast answers — an answer is "fast" when it arrives within
      FAST_THRESHOLD_MS (6000ms = 6 seconds) of the moment the question
      was displayed. Time-to-answer is measured with performance.now()
      (a monotonic high-resolution clock), falling back to Date.now()
      where performance is unavailable.

   3. Speed multiplier — a fast answer multiplies its option's
      categoryPoints by SPEED_MULTIPLIER (1.2). A slow answer is worth
      its bare categoryPoints (multiplier 1.0).

   4. Streak — the streak counts CONSECUTIVE fast answers.
        - a fast answer increments the streak by 1;
        - the moment any answer takes longer than 6 seconds, the streak
          resets to 0 immediately.

   5. Streak multiplier — once the streak reaches STREAK_THRESHOLD (3)
      or more, an extra STREAK_BONUS (0.1) per streak point is added ON
      TOP of the speed multiplier, and the combined multiplier is capped
      at MAX_MULTIPLIER (1.5).

      multiplier = min(1.2 + 0.1 * streak, 1.5)      (streak >= 3, fast)

   WORKED EXAMPLES (auditable)
   ---------------------------------------------------------------------
   - Fast answer, option worth 4, streak becomes 1:
       streak 1 < 3  → multiplier = 1.2        → awarded = 4 * 1.2 = 4.8
   - Fast answer, option worth 4, streak becomes 2:
       streak 2 < 3  → multiplier = 1.2        → awarded = 4 * 1.2 = 4.8
   - Fast answer, option worth 4, streak becomes 3:
       min(1.2 + 0.1 * 3, 1.5) = min(1.5, 1.5) → awarded = 4 * 1.5 = 6.0
   - Fast answer, option worth 5, streak becomes 4:
       min(1.2 + 0.1 * 4, 1.5) = min(1.6, 1.5) → capped at 1.5
                                                 → awarded = 5 * 1.5 = 7.5
   - Slow answer (>6s), option worth 5, streak was 4:
       multiplier = 1.0, streak resets to 0    → awarded = 5 * 1.0 = 5.0
   ========================================================================== */
(function () {
  "use strict";

  /* The four categories, in fixed order. Fixed order also settles ties in
     the final tally deterministically: the first category in this list
     with the highest total wins. */
  var CATEGORIES = [
    "Communication",
    "Critical Thinking",
    "Time Management",
    "Leadership"
  ];

  var FAST_THRESHOLD_MS = 6000; /* answer within 6s of display = fast */
  var SPEED_MULTIPLIER = 1.2;   /* any fast answer: points * 1.2 */
  var STREAK_THRESHOLD = 3;     /* streak bonus starts at 3 consecutive */
  var STREAK_BONUS = 0.1;       /* extra multiplier per streak point */
  var MAX_MULTIPLIER = 1.5;     /* hard cap on the combined multiplier */

  // ANSWER HISTORY MODEL — core correctness change
  // We maintain an ordered array of answer records instead of multiple
  // independently mutated running totals. All derived values (totals,
  // streak, maxStreak) are produced by `recalculateTotals()` which
  // computes them from scratch by iterating `answerHistory` in order.
  var answerHistory = []; // ordered array of { questionId, category, categoryPoints, elapsedMs, selection }
  var totals = {}; // derived per-category totals (numbers)
  var streak = 0; // derived current streak (recomputed)
  var maxStreak = 0; // derived max streak (recomputed)
  var questionShownAt = null; /* timestamp when the current question appeared */
  var quizStartedAt = null; /* timestamp when the attempt began */

  /* now — monotonic timestamp in milliseconds. performance.now() is the
     preferred clock (never jumps with system time changes); Date.now()
     is the documented fallback. */
  function now() {
    if (typeof performance !== "undefined" && typeof performance.now === "function") {
      return performance.now();
    }
    return Date.now();
  }

  /* reset — returns every piece of state to its start-of-attempt values.
     Called once on load; exposed so a future retry flow can reuse the
     module. */
  function reset() {
    // Clear the authoritative answer history and derived state.
    answerHistory = [];
    totals = {};
    for (var i = 0; i < CATEGORIES.length; i += 1) {
      totals[CATEGORIES[i]] = 0;
    }
    streak = 0;
    maxStreak = 0;
    questionShownAt = null;
    quizStartedAt = null;
  }

  /* startTotalTimer — stamps the beginning of the attempt; the final
     tally's total time is measured from here. */
  function startTotalTimer() {
    quizStartedAt = now();
  }

  /* questionShown — stamps the moment a question is displayed. The
     quiz engine calls this once per question; the next recordAnswer()
     measures time-to-answer against this stamp. */
  function questionShown() {
    questionShownAt = now();
  }

  /* recordAnswer — the heart of the rubric. Called once per answered
     question with the question's category and the chosen option's
     categoryPoints. Applies the speed and streak rules above, adds the
     result to that category's running total, and returns a full
     breakdown object so the engine (or a grader) can inspect exactly
     what was applied and why. Unanswered questions are simply never
     passed in, so they contribute 0. */
  /* recordAnswer — record or replace one answer in the ordered
     `answerHistory`. This function accepts the identifying question id,
     the question's category, the raw `categoryPoints` for the chosen
     option (before any multiplier), and the `selection` object (which
     carries either an `index` for choice/hotspot or other identifying
     data). The elapsedMs is computed against the last questionShown()
     stamp. If an entry for the same questionId already exists, it is
     replaced in-place. After the change we call `recalculateTotals()` to
     rebuild all derived scoring values from the authoritative history. */
  function recordAnswer(questionId, category, categoryPoints, selection) {
    var elapsedMs = questionShownAt === null ? Infinity : now() - questionShownAt;

    // Build the record to store (elapsedMs rounded for stability).
    var record = {
      questionId: questionId,
      category: category,
      categoryPoints: categoryPoints,
      elapsedMs: Math.round(elapsedMs),
      selection: selection
    };

    // Replace in-place if the question was already answered.
    var replaced = false;
    for (var i = 0; i < answerHistory.length; i += 1) {
      if (answerHistory[i].questionId === questionId) {
        answerHistory[i] = record;
        replaced = true;
        break;
      }
    }
    if (!replaced) {
      answerHistory.push(record);
    }

    // Recalculate all derived totals/streaks from the full history.
    recalculateTotals();

    // Return the stored record for auditing.
    return record;
  }

  /* recalculateTotals — derive `totals`, `streak`, and `maxStreak` by
     iterating `answerHistory` from the start. This guarantees that any
     overwrite or reorder is correctly reflected, removing any chance of
     incrementally drifting state. */
  function recalculateTotals() {
    // reset derived values
    var tempTotals = {};
    for (var t = 0; t < CATEGORIES.length; t += 1) {
      tempTotals[CATEGORIES[t]] = 0;
    }
    var tempStreak = 0;
    var tempMaxStreak = 0;

    // Walk the history in order and apply the original multiplier rules
    // deterministically for each entry.
    for (var k = 0; k < answerHistory.length; k += 1) {
      var r = answerHistory[k];
      var fast = r.elapsedMs <= FAST_THRESHOLD_MS;
      if (fast) {
        tempStreak += 1;
        if (tempStreak > tempMaxStreak) tempMaxStreak = tempStreak;
      } else {
        tempStreak = 0;
      }

      var multiplier = 1;
      if (fast) {
        multiplier = SPEED_MULTIPLIER;
        if (tempStreak >= STREAK_THRESHOLD) {
          multiplier = Math.min(SPEED_MULTIPLIER + STREAK_BONUS * tempStreak, MAX_MULTIPLIER);
        }
      }

      var awarded = r.categoryPoints * multiplier;
      tempTotals[r.category] = (tempTotals[r.category] || 0) + awarded;
    }

    // Commit derived values back into module-scope variables.
    totals = tempTotals;
    streak = tempStreak;
    maxStreak = tempMaxStreak;
  }

  /* round2 — trims floating-point noise (e.g. 3.6000000000000005) to two
     decimal places for anything that leaves this module. */
  function round2(value) {
    return Math.round(value * 100) / 100;
  }

  /* getFinalTally — the export the engine saves to sessionStorage:
     per-category totals (rounded), the highest-scoring category (first
     in CATEGORIES wins a tie), total time taken in whole seconds, and
     the max streak achieved. */
  function getFinalTally() {
    // Ensure totals reflect the latest history before returning.
    recalculateTotals();
    var roundedTotals = {};
    var highestCategory = CATEGORIES[0];
    for (var i = 0; i < CATEGORIES.length; i += 1) {
      var category = CATEGORIES[i];
      roundedTotals[category] = round2(totals[category]);
      if (roundedTotals[category] > roundedTotals[highestCategory]) {
        highestCategory = category;
      }
    }

    var totalTimeSeconds =
      quizStartedAt === null ? 0 : Math.round((now() - quizStartedAt) / 1000);

    return {
      categories: roundedTotals,
      highestCategory: highestCategory,
      totalTimeSeconds: totalTimeSeconds,
      maxStreak: maxStreak
    };
  }

  reset();

  window.QuizScoring = {
    startTotalTimer: startTotalTimer,
    questionShown: questionShown,
    recordAnswer: recordAnswer,
    getFinalTally: getFinalTally,
    /* getAnswerForQuestion(questionId) — returns the stored answer
       record for a particular question, or null if none exists. */
    getAnswerForQuestion: function (questionId) {
      for (var i3 = 0; i3 < answerHistory.length; i3 += 1) {
        if (answerHistory[i3].questionId === questionId) return answerHistory[i3];
      }
      return null;
    },
    /* getHistory() — returns a shallow copy of the ordered answer history. */
    getHistory: function () {
      return answerHistory.slice();
    },
    reset: reset
  };
})();
