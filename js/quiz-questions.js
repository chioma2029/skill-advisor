/* ==========================================================================
   QUIZ-QUESTIONS.JS — the 20-question assessment data
   Five questions per category: Communication, Critical Thinking, Time
   Management, Leadership. Every question is scenario-based and grounded in
   situations a new university student actually meets (group projects,
   deadlines, disagreements, unclear instructions) — never trivia, never
   yes/no, never abstract self-description.

   Question shape:
     id             — unique string; the two media questions are named so
                      their type is obvious at a glance.
     category       — the ONE category this question scores into.
     type           — "choice" | "hotspot" | "audio".
     prompt         — the question text (Spectral, the screen's hero).
     options        — choice/audio questions: 3–4 options, each with a
                      label and categoryPoints (1–5) awarded for picking it.
                      Points are varied realistically: strong answers earn
                      more, weak ones fewer — never a flat scale.
     imageSrc/alt   — hotspot question only (see placeholder note below).
     hotspots       — hotspot question only: percentage-based regions
                      (x, y, width, height relative to the image, so they
                      stay accurate at any responsive size) plus the
                      categoryPoints clicking that region awards and a
                      label used as the region's accessible name.
     audioSrc       — audio question only (see placeholder note below).

   PLACEHOLDER ASSETS — replace before submission:
     (none remain in this file) — audio prompt has been provided at /assets/audio-prompt-1.mp3
   ========================================================================== */
(function () {
  "use strict";

  // Reduce the quiz to 10 questions total: keep the two media items and
  // select 8 choice questions (2 per category) from the existing set.
  window.QUIZ_QUESTIONS = [
    /* COMMUNICATION (keep 2 choice + 1 audio media preserved elsewhere) */
    {
      id: "comm-meeting-split",
      category: "Communication",
      type: "choice",
      prompt:
        "In your first group meeting, two teammates argue about whether the presentation should be a slide deck or a live demo, and neither will back down. The room goes quiet and people start looking at you. What do you do?",
      options: [
        { label: "Suggest the group spend ten minutes listing the pros and cons of each format, then take a vote.", categoryPoints: 5 },
        { label: "Propose the live demo, but offer to build the slides yourself as a backup.", categoryPoints: 3 },
        { label: "Side with the slide deck. It is the safer option and you want the argument to end.", categoryPoints: 2 },
        { label: "Stay out of it. It is their disagreement, not yours.", categoryPoints: 1 }
      ]
    },
    {
      id: "comm-unclear-brief",
      category: "Communication",
      type: "choice",
      prompt:
        "Your professor emails a one-line assignment description with a due date, and you cannot tell whether it wants an essay or a report. The deadline is in six days. What is your first move?",
      options: [
        { label: "Email the professor today, quoting the exact line you are unsure about and asking one specific question.", categoryPoints: 5 },
        { label: "Wait to ask in person after the next lecture, even if that leaves only three days.", categoryPoints: 3 },
        { label: "Message the class group chat and go with whatever the majority says.", categoryPoints: 2 },
        { label: "Pick whichever format you are better at and hope for the best.", categoryPoints: 1 }
      ]
    },
    /* Preserve audio media question (Communication) */
    {
      id: "comm-audio-voicemail",
      category: "Communication",
      type: "audio",
      prompt: "Play the voice note from your project partner, then choose the reply that communicates best.",
      audioSrc: "/assets/audio-prompt-1.mp3",
      options: [
        { label: "Reply acknowledging what they said, restate their concern in your own words, then suggest a time to talk it through.", categoryPoints: 5 },
        { label: "Wait a day for things to cool down, then send a short apology.", categoryPoints: 3 },
        { label: "Reply right away defending your part of the work, point by point.", categoryPoints: 2 },
        { label: "Forward the voice note to the rest of the group so everyone hears their tone.", categoryPoints: 1 }
      ]
    },

    /* CRITICAL THINKING (keep 2 choice + hotspot media preserved) */
    {
      id: "ct-perfect-source",
      category: "Critical Thinking",
      type: "choice",
      prompt: "Researching your first essay, you find a blog post that supports your argument perfectly. It has no author and no date, but it says exactly what you want to quote. What do you do?",
      options: [
        { label: "Keep searching for a source with an author and a date that makes the same point, even if it takes longer.", categoryPoints: 5 },
        { label: "Paraphrase it instead of quoting it, so the weak source is less noticeable.", categoryPoints: 2 },
        { label: "Quote it, but mention in a footnote that the source looks incomplete.", categoryPoints: 2 },
        { label: "Quote it as-is. Finding something this perfect is rare.", categoryPoints: 1 }
      ]
    },
    /* Preserve hotspot media question (Critical Thinking) */
    {
      id: "ct-hotspot-board",
      category: "Critical Thinking",
      type: "hotspot",
      prompt: "This is your group's shared task board three days before the deadline. Click the spot that shows the biggest risk to your submission.",
      imageSrc: "/assets/task-board-scenario.png",
      imageAlt: "Photograph of a Kanban task board with three columns left-to-right: 'Done' (left) with completed tasks, 'In progress' (center) with claimed tasks, and 'To do' (right) with unassigned tasks; a narrow notes strip runs along the bottom of the board.",
      hotspots: [
        { x: 2, y: 5, width: 30, height: 80, categoryPoints: 2, label: "Done column (left) with completed tasks" },
        { x: 34, y: 5, width: 32, height: 80, categoryPoints: 3, label: "In progress column (center) with claimed tasks" },
        { x: 68, y: 5, width: 30, height: 80, categoryPoints: 5, label: "To do column (right) with unassigned tasks" },
        { x: 0, y: 85, width: 100, height: 15, categoryPoints: 1, label: "Notes strip along the bottom" }
      ]
    },
    {
      id: "ct-conflicting-advice",
      category: "Critical Thinking",
      type: "choice",
      prompt: "Your academic adviser suggests you take Statistics in your first semester, but two senior students say the same professor is impossible and you should delay it. What do you do?",
      options: [
        { label: "Ask the adviser why they suggest it now, and ask the seniors what exactly went wrong, then weigh both accounts.", categoryPoints: 5 },
        { label: "Follow the adviser. They are the professional.", categoryPoints: 3 },
        { label: "Follow the seniors. They actually took the course.", categoryPoints: 2 },
        { label: "Drop Statistics from your plan entirely to avoid the risk.", categoryPoints: 1 }
      ]
    },

    /* TIME MANAGEMENT (keep 2 choice) */
    {
      id: "tm-same-week",
      category: "Time Management",
      type: "choice",
      prompt: "In your first week, all four of your courses assign work due within the same seven days. Nothing is huge on its own, but together they stack up. How do you handle it?",
      options: [
        { label: "Write all four due dates into one calendar tonight and assign each task a specific time slot before the week starts.", categoryPoints: 5 },
        { label: "Work on whichever feels most urgent each morning.", categoryPoints: 3 },
        { label: "Start with the course you enjoy most and handle the rest as they come.", categoryPoints: 2 },
        { label: "Decide which assignment is worth the least and plan to skip it.", categoryPoints: 1 }
      ]
    },
    {
      id: "tm-three-week-project",
      category: "Time Management",
      type: "choice",
      prompt: "You have three weeks to write a 2,000-word report. The first week passes and you have not started. Every time you sit down, you open your phone instead. What do you do?",
      options: [
        { label: "Commit to writing just 200 words a day, phone in another room, until a rough draft exists.", categoryPoints: 5 },
        { label: "Plan a full weekend marathon to write the whole thing in one sitting.", categoryPoints: 2 },
        { label: "Re-read the assignment brief again, feeling productive without writing anything.", categoryPoints: 1 },
        { label: "Wait for the pressure of the final week. You work best under it.", categoryPoints: 1 }
      ]
    },

    /* LEADERSHIP (keep 2 choice) */
    {
      id: "lead-uneven-work",
      category: "Leadership",
      type: "choice",
      prompt: "Halfway through the project, one group member is doing most of the work and is openly frustrated about it in meetings. What do you do?",
      options: [
        { label: "Acknowledge the imbalance in the next meeting, then propose splitting the remaining work by task and deadline rather than by who is fastest.", categoryPoints: 5 },
        { label: "Take over coordination yourself and quietly redistribute tasks without announcing it.", categoryPoints: 3 },
        { label: "Tell the strong member privately to slow down so the others can keep up.", categoryPoints: 2 },
        { label: "Say nothing. The imbalance will sort itself out once the others notice.", categoryPoints: 1 }
      ]
    },
    {
      id: "lead-derailed-meeting",
      category: "Leadership",
      type: "choice",
      prompt: "You are chairing the first meeting of a student society you founded. Ten minutes in, the discussion drifts into an off-topic argument between two members. What do you do?",
      options: [
        { label: "Name the off-topic point, park it for the end of the meeting if there is time, and guide the room back to the agenda.", categoryPoints: 5 },
        { label: "Cut in immediately and call a vote on the original agenda item.", categoryPoints: 2 },
        { label: "End the meeting early and reschedule for when people are more focused.", categoryPoints: 2 },
        { label: "Let the argument run its course. Members need to feel heard in a new society.", categoryPoints: 1 }
      ]
    }
  ];
})();
