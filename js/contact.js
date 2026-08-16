/* ==========================================================================
   CONTACT.JS — Contact & Feedback form (contact.html)
   A traditional three-field support form (design.md §7 relaxes the
   one-at-a-time discipline here) that reuses the exact input, validation,
   and error components from the intake flow: .input-underline controls,
   .is-valid / .is-invalid states, and inline .error-message text. No
   alert() or browser popup is used anywhere — errors render inline.

   Validation behaviour matches design.md §8 exactly: validate on blur for a
   field's first attempt, then live on every input event once that field has
   failed once. Submitting runs a final check across ALL fields regardless.
   ========================================================================== */
(function () {
  "use strict";

  /* ---------------------------------------------------------------------
     Motion constants — identical to intake.js and tokens.css (§6). They are
     duplicated here because the confirmation swap is orchestrated with the
     Web Animations API, which cannot read CSS custom properties.
     --------------------------------------------------------------------- */
  var EASE_OUT = "cubic-bezier(0.4, 0, 0.2, 1)"; /* anything appearing */
  var EASE_IN = "cubic-bezier(0.4, 0, 1, 1)";    /* anything leaving */
  var DURATION_OUT = 220;      /* outgoing form fade/slide */
  var DURATION_IN = 280;       /* incoming confirmation settle */
  var DELAY_IN = 80;           /* incoming starts 80ms after outgoing */
  var DURATION_REDUCED = 100;  /* prefers-reduced-motion crossfade cap */

  /* Checked live each time so a setting change mid-session is respected. */
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------------------------------------------------------------------
     Validators.

     validateName and validateEmail are INTENTIONALLY the same rules as the
     intake flow's name and email fields (intake.js). intake.js is a closed
     IIFE that exports nothing, so there is no clean way to import them;
     they are duplicated here verbatim to guarantee the contact form and the
     intake flow never drift apart in what they accept. If a shared module
     is introduced later, both should point at it.
     --------------------------------------------------------------------- */

  /* validateName — letters and spaces only: letter-words separated by single
     spaces, at least 2 characters. Same rule as the intake name field. */
  function validateName(value) {
    var name = value.trim();
    var pattern = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
    if (pattern.test(name) && name.length >= 2) {
      return true;
    }
    return "Enter your name using letters only. Do not use numbers or symbols.";
  }

  /* validateEmail — accepts EITHER a standard address (local@domain.tld) OR
     the institutional student format (student.id@bse.ac.mu). Same rule as
     the intake email field. */
  function validateEmail(value) {
    var email = value.trim();
    var standard = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
    var institutional = /^[A-Za-z0-9.]+@bse\.ac\.mu$/;

    /* Block list of common personal/personal-provider domains. This list
       intentionally lives here as an array so it can be extended later
       without changing validation logic. Only the domain portion is
       compared; subdomains of a blocked provider are also rejected. */
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

    // First, ensure the email matches an accepted format.
    if (!(standard.test(email) || institutional.test(email))) {
      return "Enter a valid email. For example, name@example.com or student.id@bse.ac.mu.";
    }

    // Extract domain and check the block list (case-insensitive).
    var parts = email.split("@");
    var domain = (parts[1] || "").toLowerCase();
    for (var i = 0; i < blockedDomains.length; i++) {
      var d = blockedDomains[i];
      if (domain === d || domain.endsWith("." + d)) {
        return "Thanks for checking, please use your institutional mail address so we can reach you properly.";
      }
    }

    return true;
  }

  /* validateMessage — required, and at least 10 characters once trimmed.
     Empty and too-short get distinct, specific messages (§8: "specific and
     plain"). */
  function validateMessage(value) {
    var message = value.trim();
    if (message.length === 0) {
      return "Write a message so the adviser knows how to help.";
    }
    if (message.length < 10) {
      return "Add a little more detail. At least 10 characters.";
    }
    return true;
  }

  /* ---------------------------------------------------------------------
     Field registry — one entry per control. `failedOnce` mirrors intake.js:
     it flips a field into live-validation mode after its first failure.
     --------------------------------------------------------------------- */
  var FIELDS = [
    { id: "contact-name", validate: validateName },
    { id: "contact-email", validate: validateEmail },
    { id: "contact-message", validate: validateMessage }
  ];
  var failedOnce = {};

  /* Attach the live DOM references (input + error slots) to each field and
     wire the §8 blur/input behaviour. */
  FIELDS.forEach(function (field) {
    field.input = document.getElementById(field.id);
    field.error = document.getElementById(field.id + "-error");

    /* §8 — validate on blur for the field's first attempt. An untouched,
       empty field is skipped (tabbing past is not an attempt); the Send
       button catches that case instead. Once a field has failed once, blur
       always validates. */
    field.input.addEventListener("blur", function () {
      if (failedOnce[field.id] || field.input.value.trim() !== "") {
        checkField(field);
      }
    });

    /* §8 — after the first failure, validate live on every input event
       (real-time state toggling) until the field passes. */
    field.input.addEventListener("input", function () {
      if (failedOnce[field.id]) {
        checkField(field);
      }
    });
  });

  /* ---------------------------------------------------------------------
     checkField — runs one field's validator and applies the §8 states:
     .is-invalid + the specific .error-message on failure (and flips the
     field into live-validation mode), .is-valid on success. Returns true
     when the value passes.
     --------------------------------------------------------------------- */
  function checkField(field) {
    var result = field.validate(field.input.value);
    if (result === true) {
      field.input.classList.remove("is-invalid");
      field.input.classList.add("is-valid");
      field.input.setAttribute("aria-invalid", "false");
      field.error.classList.remove("is-visible");
      field.error.textContent = "";
      return true;
    }
    failedOnce[field.id] = true;
    field.input.classList.remove("is-valid");
    field.input.classList.add("is-invalid");
    field.input.setAttribute("aria-invalid", "true");
    field.error.textContent = result;
    field.error.classList.add("is-visible");
    return false;
  }

  /* ---------------------------------------------------------------------
     Submit — the final gate. It re-validates EVERY field regardless of the
     blur/input history (the task requires not relying on those events alone
     for the final check). If anything is invalid, the first invalid field
     is focused and nothing is submitted. Otherwise the form is swapped for
     a confirmation.

     NOTE ON SUBMISSION: this is a static site with no backend, so a real
     deployment would POST these three values to a server or a form service
     such as Formspree here. Per the assignment's static-site constraint the
     network request is simulated on the front end only — the confirmation
     below is what a successful response would show.
     --------------------------------------------------------------------- */
  var form = document.getElementById("contact-form");
  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var allValid = true;
    var firstInvalid = null;
    FIELDS.forEach(function (field) {
      var valid = checkField(field);
      if (!valid && firstInvalid === null) {
        firstInvalid = field;
      }
      allValid = allValid && valid;
    });

    if (!allValid) {
      if (firstInvalid) {
        firstInvalid.input.focus({ preventScroll: true });
      }
      return;
    }

    showConfirmation();
  });

  /* ---------------------------------------------------------------------
     showConfirmation — replaces the whole form with a short, warm
     confirmation that uses the name the user entered, via the same §6
     transition as the intake flow. The confirmation is focusable
     (tabindex="-1") so screen readers and keyboard users land on it.
     --------------------------------------------------------------------- */
  function showConfirmation() {
    var fullName = document.getElementById("contact-name").value.trim();
    var firstName = fullName.split(/\s+/)[0] || "";

    var confirmation = document.createElement("p");
    confirmation.className = "contact-confirmation";
    confirmation.setAttribute("tabindex", "-1");
    confirmation.textContent = firstName
      ? "Thanks, " + firstName + ". An adviser will get back to you soon."
      : "Thanks. An adviser will get back to you soon.";

    transitionSwap(form, confirmation, function () {
      confirmation.focus({ preventScroll: true });
    });
  }

  /* ---------------------------------------------------------------------
     transitionSwap — the §6 transition, identical to intake.js. The outgoing
     element fades to 0 opacity and slides up 12px over 220ms (ease-in, for
     anything leaving); the incoming element starts at 0 opacity / +12px and
     settles over 280ms (ease-out, for anything appearing), beginning 80ms
     after the outgoing animation starts — a slight overlap, not a hard cut.
     With prefers-reduced-motion the whole swap collapses to a 100ms opacity
     crossfade. onDone fires once the incoming element has settled.
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
})();
