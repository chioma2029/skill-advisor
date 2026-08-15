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

  window.QUIZ_QUESTIONS = [
    /* ==================================================================
       COMMUNICATION — 5 questions
       ================================================================== */
    {
      id: "comm-meeting-split",
      category: "Communication",
      type: "choice",
      prompt:
        "In your first group meeting, two teammates argue about whether the presentation should be a slide deck or a live demo, and neither will back down. The room goes quiet and people start looking at you. What do you do?",
      options: [
        {
          label:
            "Suggest the group spend ten minutes listing the pros and cons of each format, then take a vote.",
          categoryPoints: 5
        },
        {
          label:
            "Propose the live demo, but offer to build the slides yourself as a backup.",
          categoryPoints: 3
        },
        {
          label:
            "Side with the slide deck. It is the safer option and you want the argument to end.",
          categoryPoints: 2
        },
        {
          label:
            "Stay out of it. It is their disagreement, not yours.",
          categoryPoints: 1
        }
      ]
    },
    {
      id: "comm-unclear-brief",
      category: "Communication",
      type: "choice",
      prompt:
        "Your professor emails a one-line assignment description with a due date, and you cannot tell whether it wants an essay or a report. The deadline is in six days. What is your first move?",
      options: [
        {
          label:
            "Email the professor today, quoting the exact line you are unsure about and asking one specific question.",
          categoryPoints: 5
        },
        {
          label:
            "Wait to ask in person after the next lecture, even if that leaves only three days.",
          categoryPoints: 3
        },
        {
          label:
            "Message the class group chat and go with whatever the majority says.",
          categoryPoints: 2
        },
        {
          label:
            "Pick whichever format you are better at and hope for the best.",
          categoryPoints: 1
        }
      ]
    },
    {
      /* AUDIO QUESTION — the voice note is the prompt delivery mechanism;
         the text options below carry the scoring, exactly like a regular
         choice question. */
      id: "comm-audio-voicemail",
      category: "Communication",
      type: "audio",
      prompt:
        "Play the voice note from your project partner, then choose the reply that communicates best.",
      audioSrc: "/assets/audio-prompt-1.mp3",
      options: [
        {
          label:
            "Reply acknowledging what they said, restate their concern in your own words, then suggest a time to talk it through.",
          categoryPoints: 5
        },
        {
          label:
            "Wait a day for things to cool down, then send a short apology.",
          categoryPoints: 3
        },
        {
          label:
            "Reply right away defending your part of the work, point by point.",
          categoryPoints: 2
        },
        {
          label:
            "Forward the voice note to the rest of the group so everyone hears their tone.",
          categoryPoints: 1
        }
      ]
    },
    {
      id: "comm-ghosted-group",
      category: "Communication",
      type: "choice",
      prompt:
        "A week before the deadline, one teammate has stopped replying to the group chat for four days. Their section is the only missing part. What do you do?",
      options: [
        {
          label:
            "Message them privately to ask if everything is okay, and remind them the group is counting on their section by Friday.",
          categoryPoints: 5
        },
        {
          label:
            "Write their section yourself to protect the group's grade, without telling anyone.",
          categoryPoints: 2
        },
        {
          label:
            "Email the professor immediately to report the teammate.",
          categoryPoints: 1
        },
        {
          label:
            "Post in the group chat, tagging them, saying they are holding everyone up.",
          categoryPoints: 1
        }
      ]
    },
    {
      id: "comm-first-presentation",
      category: "Communication",
      type: "choice",
      prompt:
        "In week two, your tutor asks for a volunteer to summarise the reading to the whole class. You understood the reading well, but you have never spoken up in this class. What do you do?",
      options: [
        {
          label:
            "Volunteer, and spend ten minutes beforehand writing three bullet points to anchor yourself.",
          categoryPoints: 5
        },
        {
          label:
            "Volunteer only if nobody else does by the time the silence ends.",
          categoryPoints: 3
        },
        {
          label:
            "Arrange with a friend in the class to volunteer together.",
          categoryPoints: 2
        },
        {
          label:
            "Look down at your notes and hope the tutor picks someone else.",
          categoryPoints: 1
        }
      ]
    },

    /* ==================================================================
       CRITICAL THINKING — 5 questions
       ================================================================== */
    {
      id: "ct-perfect-source",
      category: "Critical Thinking",
      type: "choice",
      prompt:
        "Researching your first essay, you find a blog post that supports your argument perfectly. It has no author and no date, but it says exactly what you want to quote. What do you do?",
      options: [
        {
          label:
            "Keep searching for a source with an author and a date that makes the same point, even if it takes longer.",
          categoryPoints: 5
        },
        {
          label:
            "Paraphrase it instead of quoting it, so the weak source is less noticeable.",
          categoryPoints: 2
        },
        {
          label:
            "Quote it, but mention in a footnote that the source looks incomplete.",
          categoryPoints: 2
        },
        {
          label:
            "Quote it as-is. Finding something this perfect is rare.",
          categoryPoints: 1
        }
      ]
    },
    {
      /* IMAGE HOTSPOT QUESTION — the click IS the answer, so the image
         leads and the prompt sits below it (design.md §8). Region
         coordinates are percentages of the image, not fixed pixels, so
         they stay accurate at any responsive width. imageSrc is a
         placeholder path (see file header). */
      id: "ct-hotspot-board",
      category: "Critical Thinking",
      type: "hotspot",
      prompt:
        "This is your group's shared task board three days before the deadline. Click the spot that shows the biggest risk to your submission.",
      imageSrc: "/assets/task-board-scenario.png",
      imageAlt:
        "Photograph of a Kanban task board with three columns left-to-right: 'Done' (left) with completed tasks, 'In progress' (center) with claimed tasks, and 'To do' (right) with unassigned tasks; a narrow notes strip runs along the bottom of the board.",
      hotspots: [
        {
          x: 2,
          y: 5,
          width: 30,
          height: 80,
          categoryPoints: 2,
          label: "Done column (left) with completed tasks"
        },
        {
          x: 34,
          y: 5,
          width: 32,
          height: 80,
          categoryPoints: 3,
          label: "In progress column (center) with claimed tasks"
        },
        {
          x: 68,
          y: 5,
          width: 30,
          height: 80,
          categoryPoints: 5,
          label: "To do column (right) with unassigned tasks"
        },
        {
          x: 0,
          y: 85,
          width: 100,
          height: 15,
          categoryPoints: 1,
          label: "Notes strip along the bottom"
        }
      ]
    },
    {
      id: "ct-conflicting-advice",
      category: "Critical Thinking",
      type: "choice",
      prompt:
        "Your academic adviser suggests you take Statistics in your first semester, but two senior students say the same professor is impossible and you should delay it. What do you do?",
      options: [
        {
          label:
            "Ask the adviser why they suggest it now, and ask the seniors what exactly went wrong, then weigh both accounts.",
          categoryPoints: 5
        },
        {
          label:
            "Follow the adviser. They are the professional.",
          categoryPoints: 3
        },
        {
          label:
            "Follow the seniors. They actually took the course.",
          categoryPoints: 2
        },
        {
          label:
            "Drop Statistics from your plan entirely to avoid the risk.",
          categoryPoints: 1
        }
      ]
    },
    {
      id: "ct-essay-grade",
      category: "Critical Thinking",
      type: "choice",
      prompt:
        "You get your first essay back with a lower grade than you expected. The comments are brief and you do not fully understand them. What do you do?",
      options: [
        {
          label:
            "Book office hours, bring the essay, and ask the professor to walk through one comment at a time.",
          categoryPoints: 5
        },
        {
          label:
            "Compare your grade with classmates' to see if the marking was fair.",
          categoryPoints: 2
        },
        {
          label:
            "Reply to the feedback email asking for a higher grade because you worked hard on it.",
          categoryPoints: 1
        },
        {
          label:
            "Put it away and try harder on the next one, without changing anything specific.",
          categoryPoints: 1
        }
      ]
    },
    {
      id: "ct-requirements-change",
      category: "Critical Thinking",
      type: "choice",
      prompt:
        "Two days before the deadline, your professor announces the assignment now requires a reference list in a citation style you have never used. What do you do first?",
      options: [
        {
          label:
            "Find the library's short guide to that style and format one reference as a test before doing the rest.",
          categoryPoints: 5
        },
        {
          label:
            "Copy the citation formatting from a paper you found online.",
          categoryPoints: 2
        },
        {
          label:
            "Email the professor asking them to move the deadline for everyone.",
          categoryPoints: 2
        },
        {
          label:
            "Submit without the reference list and accept the penalty.",
          categoryPoints: 1
        }
      ]
    },

    /* ==================================================================
       TIME MANAGEMENT — 5 questions
       ================================================================== */
    {
      id: "tm-same-week",
      category: "Time Management",
      type: "choice",
      prompt:
        "In your first week, all four of your courses assign work due within the same seven days. Nothing is huge on its own, but together they stack up. How do you handle it?",
      options: [
        {
          label:
            "Write all four due dates into one calendar tonight and assign each task a specific time slot before the week starts.",
          categoryPoints: 5
        },
        {
          label:
            "Work on whichever feels most urgent each morning.",
          categoryPoints: 3
        },
        {
          label:
            "Start with the course you enjoy most and handle the rest as they come.",
          categoryPoints: 2
        },
        {
          label:
            "Decide which assignment is worth the least and plan to skip it.",
          categoryPoints: 1
        }
      ]
    },
    {
      id: "tm-night-before",
      category: "Time Management",
      type: "choice",
      prompt:
        "You planned to revise tonight for tomorrow morning's quiz, but your new friends invite you out, which is the first social invitation you have had this semester. What do you do?",
      options: [
        {
          label:
            "Decline tonight, revise as planned, and suggest doing something together this weekend instead.",
          categoryPoints: 5
        },
        {
          label:
            "Go out for one hour as a compromise, then return to a shorter, focused revision session.",
          categoryPoints: 3
        },
        {
          label:
            "Stay in, but spend the evening half-scrolling and half-looking at your notes.",
          categoryPoints: 2
        },
        {
          label:
            "Go out and revise later, even though you will be tired.",
          categoryPoints: 1
        }
      ]
    },
    {
      id: "tm-double-deadline",
      category: "Time Management",
      type: "choice",
      prompt:
        "Two assignments fall due on the same Friday, and the club you just joined is running its biggest event of the semester that same evening. What do you do at the start of the week?",
      options: [
        {
          label:
            "Plan to finish both assignments by Thursday, and tell the club you can help at the event once your submissions are in.",
          categoryPoints: 5
        },
        {
          label:
            "Tell the club you cannot come at all, and start both assignments on Friday morning.",
          categoryPoints: 2
        },
        {
          label:
            "Ask for an extension on one assignment because of the club event.",
          categoryPoints: 2
        },
        {
          label:
            "Attend the event. First impressions in the club matter more than one deadline.",
          categoryPoints: 1
        }
      ]
    },
    {
      id: "tm-three-week-project",
      category: "Time Management",
      type: "choice",
      prompt:
        "You have three weeks to write a 2,000-word report. The first week passes and you have not started. Every time you sit down, you open your phone instead. What do you do?",
      options: [
        {
          label:
            "Commit to writing just 200 words a day, phone in another room, until a rough draft exists.",
          categoryPoints: 5
        },
        {
          label:
            "Plan a full weekend marathon to write the whole thing in one sitting.",
          categoryPoints: 2
        },
        {
          label:
            "Re-read the assignment brief again, feeling productive without writing anything.",
          categoryPoints: 1
        },
        {
          label:
            "Wait for the pressure of the final week. You work best under it.",
          categoryPoints: 1
        }
      ]
    },
    {
      id: "tm-plan-collapse",
      category: "Time Management",
      type: "choice",
      prompt:
        "You made a careful weekly study plan, but by Wednesday it has already collapsed: a surprise test was announced and a family call ran long. What do you do?",
      options: [
        {
          label:
            "Spend ten minutes redrawing the plan for the days that remain, moving your two most important tasks into open slots.",
          categoryPoints: 5
        },
        {
          label:
            "Keep the original plan exactly and stay up late to catch up.",
          categoryPoints: 2
        },
        {
          label:
            "Ignore the plan for the rest of the week and start fresh on Monday.",
          categoryPoints: 2
        },
        {
          label:
            "Abandon the plan. Clearly planning does not work for you.",
          categoryPoints: 1
        }
      ]
    },

    /* ==================================================================
       LEADERSHIP — 5 questions
       ================================================================== */
    {
      id: "lead-no-volunteer",
      category: "Leadership",
      type: "choice",
      prompt:
        "Your group needs one person to present the findings to the class next week. After an awkward silence, everyone suddenly finds something interesting on their phone. What do you do?",
      options: [
        {
          label:
            "Break the silence by offering to present if someone else handles the Q&A, turning the decision into a trade instead of a sacrifice.",
          categoryPoints: 5
        },
        {
          label:
            "Suggest drawing lots so the choice is fair.",
          categoryPoints: 3
        },
        {
          label:
            "Wait. Someone more experienced will eventually step up.",
          categoryPoints: 1
        },
        {
          label:
            "Nominate the quietest member, since they need the practice.",
          categoryPoints: 1
        }
      ]
    },
    {
      id: "lead-uneven-work",
      category: "Leadership",
      type: "choice",
      prompt:
        "Halfway through the project, one group member is doing most of the work and is openly frustrated about it in meetings. What do you do?",
      options: [
        {
          label:
            "Acknowledge the imbalance in the next meeting, then propose splitting the remaining work by task and deadline rather than by who is fastest.",
          categoryPoints: 5
        },
        {
          label:
            "Take over coordination yourself and quietly redistribute tasks without announcing it.",
          categoryPoints: 3
        },
        {
          label:
            "Tell the strong member privately to slow down so the others can keep up.",
          categoryPoints: 2
        },
        {
          label:
            "Say nothing. The imbalance will sort itself out once the others notice.",
          categoryPoints: 1
        }
      ]
    },
    {
      id: "lead-derailed-meeting",
      category: "Leadership",
      type: "choice",
      prompt:
        "You are chairing the first meeting of a student society you founded. Ten minutes in, the discussion drifts into an off-topic argument between two members. What do you do?",
      options: [
        {
          label:
            "Name the off-topic point, park it for the end of the meeting if there is time, and guide the room back to the agenda.",
          categoryPoints: 5
        },
        {
          label:
            "Cut in immediately and call a vote on the original agenda item.",
          categoryPoints: 2
        },
        {
          label:
            "End the meeting early and reschedule for when people are more focused.",
          categoryPoints: 2
        },
        {
          label:
            "Let the argument run its course. Members need to feel heard in a new society.",
          categoryPoints: 1
        }
      ]
    },
    {
      id: "lead-your-mistake",
      category: "Leadership",
      type: "choice",
      prompt:
        "You emailed your group's draft to the professor, but you attached an old version with a missing section. The deadline passed an hour ago. What do you do?",
      options: [
        {
          label:
            "Send the correct file immediately, own the mistake in one plain sentence, and offer to handle any follow-up with the professor.",
          categoryPoints: 5
        },
        {
          label:
            "Send the correct file quietly, hoping nobody notices the swap.",
          categoryPoints: 2
        },
        {
          label:
            "Wait to see if the professor notices before saying anything.",
          categoryPoints: 1
        },
        {
          label:
            "Blame the shared folder for having confusing file names.",
          categoryPoints: 1
        }
      ]
    },
    {
      id: "lead-quiet-member",
      category: "Leadership",
      type: "choice",
      prompt:
        "One member of your group has not said a word in three meetings, even though their notes show they did the reading. What do you do?",
      options: [
        {
          label:
            "Send them the agenda the day before, and in the meeting ask their opinion on the one item that matches their notes.",
          categoryPoints: 5
        },
        {
          label:
            "Leave them be. Some people prefer to listen.",
          categoryPoints: 2
        },
        {
          label:
            "Give them a solo task so they never have to speak in meetings.",
          categoryPoints: 2
        },
        {
          label:
            "Ask them in front of everyone why they have been so quiet.",
          categoryPoints: 1
        }
      ]
    }
  ];
})();
