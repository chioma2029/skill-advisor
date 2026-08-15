/* ==========================================================================
   RESULTS.JS — renders the results experience (results.html)
   Reads the intake and quiz data from sessionStorage, converts each
   category total into a percentage of its maximum possible raw score, and
   builds the full results screen: personalised headline → feedback
   paragraph → hand-rolled Canvas 2D bar chart → next-step recommendation
   → "Contact an Adviser" text link (the §7 order).

   design.md §7 is explicit that this is the ONE screen allowed to show the
   full picture at once, so everything below is rendered together — no
   one-at-a-time flow here.
   ========================================================================== */
(function () {
  "use strict";

  /* ---------------------------------------------------------------------
     GUARD — this page only makes sense after the intake and quiz have both
     run and written their data. If either key is missing (e.g. someone
     navigated here directly), redirect to the landing page immediately
     instead of rendering a broken page. location.replace is used so the
     dead-end results page is not left in the back-button history.
     --------------------------------------------------------------------- */
  var intakeRaw = sessionStorage.getItem("intakeData");
  var resultsRaw = sessionStorage.getItem("quizResults");
  if (!intakeRaw || !resultsRaw) {
    window.location.replace("index.html");
    return;
  }

  /* Parse defensively: malformed JSON is treated the same as missing data. */
  var intake;
  var results;
  try {
    intake = JSON.parse(intakeRaw);
    results = JSON.parse(resultsRaw);
  } catch (err) {
    window.location.replace("index.html");
    return;
  }

  /* ---------------------------------------------------------------------
     Fixed category order — the chart, the sr-only table, and the feedback
     lookup all iterate this exact sequence (design.md §8).
     --------------------------------------------------------------------- */
  var CATEGORIES = [
    "Communication",
    "Critical Thinking",
    "Time Management",
    "Leadership"
  ];

  /* ---------------------------------------------------------------------
     Feedback + next-step copy. Four distinct, specific paragraphs per
     possible highest category — written in advance, never generated, never
     generic ("Great job!"). The next step is always one concrete, small
     action.
     --------------------------------------------------------------------- */
  var FEEDBACK = {
    Communication:
      "You communicate clearly and put people at ease. You address disagreements head-on, ask the questions that keep a group aligned, and explain yourself so others actually follow. This is the kind of presence that makes teamwork feel less like a tug-of-war.",
    "Critical Thinking":
      "You question before you accept. You weigh sources, find the weak spot in a plan, and hold back from the easy answer until the evidence holds up. These habits will carry you through every essay and every group decision you make.",
    "Time Management":
      "You treat time like something you can actually shape. You break big work into smaller steps, protect the hours that matter, and plan far enough ahead that deadlines rarely catch you off guard.",
    Leadership:
      "You step in when a group stalls. You notice who is carrying too much, who has gone quiet, and you steer toward the fair way forward. This is the quiet, steady kind of leadership people choose to follow."
  };

  var NEXT_STEPS = {
    Communication:
      "This week, practise summarising someone else's point back to them before you add your own. It turns good communication into real dialogue.",
    "Critical Thinking":
      "Next time you read a source, pause and ask who wrote it and what they gain from you believing it. This is one habit that sharpens everything.",
    "Time Management":
      "Try planning your week in fixed blocks rather than a single to-do list. Giving each task a real slot makes it far more likely to happen.",
    Leadership:
      "In your next group, volunteer to run one meeting. Setting the agenda is the fastest way to grow your leadership."
  };

  /* ---------------------------------------------------------------------
     maxRawForCategory — the maximum possible RAW score for one category:
     the sum of the single highest-value option across each of that
     category's 5 questions in quiz-questions.js. No speed or streak
     multiplier is applied here — this is the calm, un-multiplied ceiling
     the user's score is measured against.

     Choice and audio questions keep their options in `options`; the image
     hotspot question keeps them in `hotspots` — both shapes carry a
     `categoryPoints` value, so we read whichever array is present.
     --------------------------------------------------------------------- */
  function maxRawForCategory(category) {
    var total = 0;
    var questions = window.QUIZ_QUESTIONS || [];
    for (var i = 0; i < questions.length; i += 1) {
      var question = questions[i];
      if (question.category !== category) {
        continue;
      }
      var choices = question.options || question.hotspots || [];
      var best = 0;
      for (var j = 0; j < choices.length; j += 1) {
        if (choices[j].categoryPoints > best) {
          best = choices[j].categoryPoints;
        }
      }
      total += best;
    }
    return total;
  }

  /* ---------------------------------------------------------------------
     percentForCategory — expresses the user's actual category total as a
     percentage of that category's maximum raw score, rounded to the nearest
     whole number and clamped to 0–100.

     Why the clamp: the stored totals include the speed (1.2x) and streak
     (up to 1.5x) multipliers from scoring.js, so a fast, streaky run can
     push a category ABOVE its un-multiplied raw maximum. Clamping keeps the
     chart bar inside the canvas and honours the 0–100 contract.
     --------------------------------------------------------------------- */
  function percentForCategory(category) {
    var max = maxRawForCategory(category);
    var actual = 0;
    if (results && results.categories && typeof results.categories[category] === "number") {
      actual = results.categories[category];
    }
    if (max <= 0) {
      return 0;
    }
    var percent = Math.round((actual / max) * 100);
    return Math.max(0, Math.min(100, percent));
  }

  /* Compute every category percentage once, up front. */
  var percentages = {};
  for (var c = 0; c < CATEGORIES.length; c += 1) {
    percentages[CATEGORIES[c]] = percentForCategory(CATEGORIES[c]);
  }

  /* ---------------------------------------------------------------------
     highestCategory — the category with the largest percentage. A tie
     resolves to whichever appears first in CATEGORIES, which keeps the
     result deterministic.
     --------------------------------------------------------------------- */
  var highestCategory = CATEGORIES[0];
  for (var h = 0; h < CATEGORIES.length; h += 1) {
    if (percentages[CATEGORIES[h]] > percentages[highestCategory]) {
      highestCategory = CATEGORIES[h];
    }
  }

  /* ---------------------------------------------------------------------
     firstName — the intake stores the full validated name; we greet with
     the first token only. Falls back gracefully if the name is absent.
     --------------------------------------------------------------------- */
  var fullName = (intake && typeof intake.name === "string") ? intake.name.trim() : "";
  var firstName = fullName.split(/\s+/)[0] || "";

  /* =====================================================================
     DOM CONSTRUCTION — every node is created with createElement and filled
     with textContent, so no string is ever parsed as HTML.
     ===================================================================== */
  var root = document.getElementById("results-root");

  /* buildSrTable — the screen-reader alternative to the canvas chart: a
     real, navigable text table of category → percentage. Canvas content is
     invisible to assistive tech by default (§10), so this carries the same
     information in structured form. */
  function buildSrTable() {
    var wrapper = document.createElement("div");
    wrapper.className = "sr-only";

    var table = document.createElement("table");
    var caption = document.createElement("caption");
    caption.textContent = "Your assessment results by skill category.";
    table.appendChild(caption);

    var tbody = document.createElement("tbody");
    for (var i = 0; i < CATEGORIES.length; i += 1) {
      var row = document.createElement("tr");
      var name = document.createElement("th");
      name.setAttribute("scope", "row");
      name.textContent = CATEGORIES[i];
      var value = document.createElement("td");
      value.textContent = percentages[CATEGORIES[i]] + " percent";
      row.appendChild(name);
      row.appendChild(value);
      tbody.appendChild(row);
    }
    table.appendChild(tbody);
    wrapper.appendChild(table);
    return wrapper;
  }

  /* buildPage — assembles the §7 sequence into #results-root and returns
     the canvas element so the chart code can drive it. */
  function buildPage() {
    /* 1. Headline — Spectral page headline via base.css, personalised. */
    var headline = document.createElement("h1");
    headline.textContent = firstName
      ? "Here's what we found, " + firstName + "."
      : "Here's what we found.";

    /* 2. Feedback paragraph tied to the highest-scoring category. */
    var feedback = document.createElement("p");
    feedback.className = "results-feedback";
    feedback.textContent = FEEDBACK[highestCategory];

    /* 3. The canvas chart. aria-hidden="true" is set because the sr-only
          table immediately after it already conveys every data point in a
          structured, navigable form. This is the more correct of the two
          options: role="img" + aria-label would flatten four distinct
          values into one unreadable string, whereas a hidden canvas plus a
          real table gives assistive tech the full, per-category data. */
    var canvas = document.createElement("canvas");
    canvas.className = "results-chart";
    canvas.id = "results-chart";
    canvas.setAttribute("aria-hidden", "true");

    /* 4. Next-step recommendation for the highest category. */
    var nextStep = document.createElement("p");
    nextStep.className = "results-nextstep";
    nextStep.textContent = NEXT_STEPS[highestCategory];

    /* 5. Secondary "Contact an Adviser" text link (never a button, §7).
       Wrap each bottom link in its own block-level container so they
       never run together as adjacent inline nodes. Spacing is driven
       by the --space scale in tokens.css. */
    var contactLink = document.createElement("a");
    contactLink.className = "btn-text";
    contactLink.href = "contact.html";
    contactLink.textContent =
      "Need help understanding your results? Contact an Adviser.";

    var contactWrapper = document.createElement("div");
    contactWrapper.className = "results-contact";
    contactWrapper.appendChild(contactLink);

    // Retake link group — visually separated from the contact link by a
    // 1px hairline divider with ample vertical margin (at least
    // --space-6 above and below per the user's request). This group
    // contains ONLY the Retake action; the site-wide Home action is
    // rendered separately at the top-left of the viewport.
    var retakeLink = document.createElement("a");
    retakeLink.className = "btn-text";
    retakeLink.href = "#";
    retakeLink.textContent = "Retake the assessment";
    retakeLink.addEventListener("click", function (e) {
      e.preventDefault();
      try {
        sessionStorage.removeItem("intakeData");
        sessionStorage.removeItem("quizResults");
      } catch (err) {
        /* ignore storage errors */
      }
      window.location.href = "index.html";
    });

    var retakeGroup = document.createElement("div");
    retakeGroup.className = "results-retake-group";
    var divider = document.createElement("div");
    divider.className = "results-divider";
    retakeGroup.appendChild(divider);
    retakeGroup.appendChild(retakeLink);

    root.appendChild(headline);
    root.appendChild(feedback);
    root.appendChild(canvas);
    root.appendChild(buildSrTable());
    root.appendChild(nextStep);
    root.appendChild(contactWrapper);
    root.appendChild(retakeGroup);

    return canvas;
  }

  var canvas = buildPage();
  var ctx = canvas.getContext("2d");

  /* =====================================================================
     CANVAS BAR CHART — plain Canvas 2D, no charting library (design.md §8).
     Horizontal bars, one per category, in the fixed CATEGORIES order. The
     only "visual interest" is opacity: the strongest category is --moss at
     full opacity, the other three are --moss at 55%.
     ===================================================================== */

  /* Read the real hex values from the CSS custom properties at runtime —
     never hard-code a second color value (§8 / task requirement). */
  var rootStyles = getComputedStyle(document.documentElement);
  var MOSS = rootStyles.getPropertyValue("--moss").trim();
  var INK = rootStyles.getPropertyValue("--ink").trim();
  var LINE = rootStyles.getPropertyValue("--line").trim();

  /* Chart geometry, in CSS pixels. The label gutter is sized from the
     widest rendered label so long names ("Critical Thinking") never clip. */
  var PAD_TOP = 8;
  var PAD_BOTTOM = 8;
  var BAR_HEIGHT = 20;
  var LABEL_GAP = 12;      /* air between a right-aligned label and the baseline */
  var RIGHT_GUTTER = 56;   /* room for the "100%" numeral after the longest bar */
  var LABEL_FONT = "400 15px Archivo, sans-serif";
  var NUMERAL_FONT = "500 14px 'IBM Plex Mono', monospace";

  /* sizeCanvas — matches the backing store to the element's CSS box times
     devicePixelRatio, so text and 1px lines stay crisp on high-DPI screens.
     All drawing afterwards happens in CSS-pixel coordinates. */
  function sizeCanvas() {
    var dpr = window.devicePixelRatio || 1;
    var cssWidth = canvas.clientWidth;
    var cssHeight = canvas.clientHeight;
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* render — draws the whole chart at a given animation progress (0–1).
     Bar lengths are multiplied by progress so the same function serves both
     the 400ms grow-in and the final static frame. */
  function render(progress) {
    var width = canvas.clientWidth;
    var height = canvas.clientHeight;
    if (width <= 0 || height <= 0) {
      return; /* not laid out yet — skip this frame */
    }
    ctx.clearRect(0, 0, width, height);

    /* Measure labels at the label font to size the left gutter. */
    ctx.font = LABEL_FONT;
    var maxLabelWidth = 0;
    for (var i = 0; i < CATEGORIES.length; i += 1) {
      var w = ctx.measureText(CATEGORIES[i]).width;
      if (w > maxLabelWidth) {
        maxLabelWidth = w;
      }
    }
    var baselineX = Math.ceil(maxLabelWidth) + LABEL_GAP;
    var barMaxLength = Math.max(0, width - baselineX - RIGHT_GUTTER);
    var rowHeight = (height - PAD_TOP - PAD_BOTTOM) / CATEGORIES.length;

    /* Thin 1px --line baseline along the left edge where the bars start.
       The +0.5 offset aligns the stroke to a physical pixel for crispness.
       This line is the visual echo of the resolved throughline (§4): same
       hairline weight, same palette, no DOM morphing needed. */
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(baselineX + 0.5, PAD_TOP);
    ctx.lineTo(baselineX + 0.5, height - PAD_BOTTOM);
    ctx.stroke();

    /* One bar per category. */
    for (var b = 0; b < CATEGORIES.length; b += 1) {
      var category = CATEGORIES[b];
      var centerY = PAD_TOP + rowHeight * b + rowHeight / 2;
      var barLength = barMaxLength * (percentages[category] / 100) * progress;

      /* Bar fill: --moss at full opacity for the strongest category, 55%
         for the rest. globalAlpha gives the opacity variation without
         introducing a second color value. Sharp rectangle — no rounded
         ends, no shadow (§8). */
      if (barLength > 0) {
        ctx.fillStyle = MOSS;
        ctx.globalAlpha = category === highestCategory ? 1 : 0.55;
        ctx.fillRect(baselineX, centerY - BAR_HEIGHT / 2, barLength, BAR_HEIGHT);
        ctx.globalAlpha = 1;
      }

      /* Category label — Archivo 15px, right-aligned to the baseline. */
      ctx.fillStyle = INK;
      ctx.font = LABEL_FONT;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(category, baselineX - LABEL_GAP, centerY);

      /* Score numeral — IBM Plex Mono, just past the bar's end. */
      ctx.font = NUMERAL_FONT;
      ctx.textAlign = "left";
      ctx.fillText(percentages[category] + "%", baselineX + barLength + 8, centerY);
    }
  }

  /* easeOutCubic — the grow-in easing. It follows the §6 rule that anything
     appearing decelerates into place (ease-out), with no bounce or spring. */
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  /* animateChart — the single 400ms width grow-in. Under
     prefers-reduced-motion (§6/§10) the chart is rendered at full width
     immediately, with no animation at all. */
  function animateChart() {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      render(1);
      return;
    }
    var DURATION = 400;
    var startTime = null;
    function frame(timestamp) {
      if (startTime === null) {
        startTime = timestamp;
      }
      var t = Math.min(1, (timestamp - startTime) / DURATION);
      render(easeOutCubic(t));
      if (t < 1) {
        window.requestAnimationFrame(frame);
      }
    }
    window.requestAnimationFrame(frame);
  }

  /* ---------------------------------------------------------------------
     Responsiveness — on resize (debounced) re-measure the canvas box and
     redraw at full width. The debounce avoids re-laying-out on every pixel
     of a drag-resize.
     --------------------------------------------------------------------- */
  var resizeTimer = null;
  window.addEventListener("resize", function () {
    if (resizeTimer) {
      window.clearTimeout(resizeTimer);
    }
    resizeTimer = window.setTimeout(function () {
      sizeCanvas();
      render(1);
    }, 150);
  });

  /* Re-render once the webfonts are ready, so label/numeral metrics (and
     therefore the label gutter) are measured against the real Archivo and
     IBM Plex Mono faces rather than fallbacks. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      sizeCanvas();
      render(1);
    });
  }

  /* ---------------------------------------------------------------------
     Init — size the backing store once the element is laid out, then run
     the grow-in. Wrapped in requestAnimationFrame so clientWidth/Height are
     measured after the browser has laid the appended nodes out.
     --------------------------------------------------------------------- */
  window.requestAnimationFrame(function () {
    sizeCanvas();
    animateChart();
  });
})();
