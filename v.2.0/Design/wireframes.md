### The Contract group

**1. wire-contract-input-default** (✓)  
The everyday state. A returning user who has used Flowivate before invokes the shortcut. The agent line shows a normal returning-user message ("Ready when you are" or a recent-activity summary). Empty input, controls at last-used defaults. This is what the user sees 95% of the time.

**2. wire-contract-input-first-session** (✓) 
The _very first time ever_, immediately after onboarding completes. The difference from default is entirely the agent line and the emotional framing. Here the agent says "I don't know you yet. Start a session and I'll start learning." The controls are at true defaults (Standard mode, no project, no duration) because there's no history to draw from. This wireframe exists separately because it's the one moment where the agent admits it knows nothing — and that admission is a deliberate trust-building beat. After the first completed session, the user never sees this state again. It's a one-time screen, and one-time screens are easy to forget to design, which is why it gets its own wireframe.

**3. wire-contract-input-typing-short** (✓)
The user has started typing — a few characters in. This wireframe shows what changes the moment input exists: the placeholder disappears, the "↵ to start" hint appears at the right edge, but nothing has been parsed yet because there isn't enough text. You're designing the transition from empty to active.

**4. wire-contract-input-typing-parsed** (✓)
The user has typed a full natural-language task like "finish the pricing page hero, 90 minutes." This wireframe shows the agent's parsing made visible: the Duration control now shows "90 min" and if "pricing page" matches a known project, the Project control updates too. This is the moment the user feels the agent is paying attention. It's distinct from typing-short because the controls have changed state in response to the input — that's the behavior you're designing here.

**5. wire-contract-input-multiline** (✓)  
The user typed a long task that wraps to two or three lines. This wireframe exists because the input field has to grow gracefully, and the controls below have to move down to accommodate it without the window feeling broken. You're designing how the window breathes when content exceeds one line. Easy to forget, annoying to retrofit.

**6. wire-contract-input-returning-gap** (✓)
The user hasn't opened Flowivate in two weeks. The agent line reads "Welcome back. 14 days since your last session." Everything else is like default. This is distinct because it's the specific copy and treatment for the gap-acknowledgment moment from Layer 4 Q18 — the agent noticing absence without judgment. It's a different agent line than default, serving a different relational moment.

**7. wire-contract-input-memory-reference** (✓)
The user types a task similar to one they recently abandoned. A small dismissible note appears _between_ the agent line and the input: "You abandoned a similar session yesterday after 12 minutes." This wireframe exists to design where that note sits, how it looks, and how the user dismisses it. It's a new element that none of the other contract wireframes have — an inline memory surface that appears conditionally.

**8. wire-contract-input-renegotiate** (✓)
The user is mid-session and hits the shortcut (or clicks Renegotiate on an intervention). The contract input appears, but pre-filled with the _current_ session's task and duration, and visually marked as different (maybe an accent border) so the user knows they're editing the active session, not starting a new one. Distinct because it's pre-populated and visually signals "you are changing something that already exists," which is a different mental model from "you are starting fresh."

**9. wire-contract-input-offline** (✓)
The user is on a plane with no internet. The agent line falls back to a simple message, parsing still works for basic things (duration, known projects) via local logic, and the session can still start. This wireframe proves the contract never depends on the network. Distinct because it shows the degraded-but-functional state.

### The Session-Started Transition

**10. wire-session-started-toast** (✓)
After the user hits Return, the window closes and a small toast appears briefly: "Session started. 90 min on the Verdyct pricing page." This is its own wireframe because it's a separate UI element with its own position (top of screen), its own timing (fades after 1.5s), and its own minimal content. It's the confirmation that the contract was accepted.

### The Menubar group

**11. wire-menubar-glyph-states** (✓)  
Not a screen — a comparison sheet. You draw the menubar glyph in all five states side by side: idle (dim), in-session (filled, pulsing), paused (filled, static), drift (amber tint), debrief-available (dot indicator). This wireframe exists so you can see all states together and make sure they're distinguishable at a glance. It's a reference artifact, not a user-facing screen.

**12. wire-menubar-dropdown-in-session** (✓)
The user clicks the menubar glyph while a session is running. The dropdown shows current task, elapsed time, an End button, today's summary, and links. Distinct from the idle dropdown because the top block shows live session data.

**13. wire-menubar-dropdown-idle** (✓)
The user clicks the glyph with no active session. The dropdown shows a compact way to start a session, today's summary, and links. Distinct from the in-session version because there's no live session to show — the top block is an entry point, not a status display.

### The Intervention group

**14, 15, 16. wire-intervention-gentle / standard / strict** (✓)
Three wireframes for the same overlay in three modes. They're separate because the copy and the available actions differ:

- Gentle: soft copy, "Still on [task]?", just a dismiss and renegotiate.
- Standard: direct copy, "You drifted to [app]. Back to [task]?", back and renegotiate.
- Strict: terse copy, "That's drift. Back to [task] now.", and the Back button closes the off-task app.

You design all three because the firmness has to be visible in the copy and the button treatment, and seeing them together ensures the escalation feels coherent.

**17. wire-renegotiation-dialog** (✓)  
The small dialog that opens when the user clicks Renegotiate from an intervention. It lets them change task, duration, or mode mid-session. Distinct from the renegotiate contract input (wireframe 8) because this is the _dialog_ version triggered specifically from an intervention — smaller, more focused, fewer options.

(Note: you may find wireframe 8 and 17 converge into one pattern as you design. That's fine — discovering that is part of why you wireframe.)

### The Session-Active States

**18. wire-ambient-overlay** (✓) 
The optional, subtle corner element that shows a session is in progress while the user works. Off by default. This wireframe exists to design what "subtle presence" looks like — a small element that reminds without distracting. You're designing restraint here.

**19. wire-time-elapsed-prompt** (✓)
When the user's estimated duration runs out, a quiet prompt appears: "Time's up — done, or keep going?" with two buttons. Distinct because it's a specific moment with specific copy, and it's the embodiment of the "time-estimated-but-not-enforced" decision from Layer 1 Q9 — the session doesn't end, it asks.

### The Reflection group

**20. wire-reflection-prompt** (✓)
Session ends. The two-question prompt: "Did you finish what you set out to do?" (yes/partial/no buttons) and "What actually happened?" (optional text field). The core reflection surface.

**21. wire-reflection-followup** (✓)
The rare state where, based on what the user typed, the agent asks one follow-up question ("Third partial in a row on Verdyct. Anything blocking?"). Distinct because it adds a conditional element to the reflection — a follow-up that only appears sometimes. You design it separately so you know how it fits without making the common case feel like a quiz.

**22. wire-post-reflection-note** (✓)
After submitting, the agent shows one line of its updated notes for 3 seconds ("Noted: shipped the pricing page. Third completion this week"), then it fades. This is Option C from Layer 3 Q26. Distinct because it's a separate moment after the reflection closes — the "you've been seen" beat.

### The Dashboard

**25. wire-dashboard** (✓)
The bento-grid visual summary: focus score average with sparkline, completion count, the time-of-day-by-day-of-week heatmap as the centerpiece, active projects with completion rates, and three recent agent observations in mono. One wireframe, but a dense one — this is the most component-heavy surface.

### The Technical Memory group

**26. wire-memory-file-tree**  (✓)
The Obsidian-style file tree on the left, main pane on the right, showing the folder structure (sessions by month, projects, patterns).

**27. wire-memory-file-view** (✓)  
A single session file rendered in the main pane — what a markdown session record looks like when read inside the app.

**28. wire-memory-file-editing** (-)
The inline-edit state when the user clicks into a prose note to correct it. Distinct from file-view because it shows the editable state — cursor in the text, the note become editable in place.

### The Sunday Debrief group

**29. wire-debrief**  
The single scrollable card: week date range, session count, and 1-3 prose observations in mono. The letter-from-the-agent format from Layer 5 Q32.

**30. wire-debrief-archive**  
The list of past debriefs the user can scroll back through. Distinct because it's a navigation surface (a list), not a content surface (a single debrief).

### The Onboarding group

**31-37. wire-onboarding-[welcome / name / work-context / projects / defaults / permissions / first-session]**  
Seven wireframes, one per onboarding step. Each is simple — usually one question or one choice per screen. They're separate because onboarding is a sequence, and you need to see each step and the transitions between them. The welcome screen sets the agent's voice, the middle steps gather the five fields, the permissions step handles the macOS dialogs, and the final step hands the user into their first real session. You wireframe these last among the major surfaces because they onboard _into_ the product, so you need the product designed first.

### Settings group

**38-43. wire-settings-[general / modes / privacy / inference / notifications / about]**  
Six wireframes, one per settings section. Mostly straightforward forms. The privacy one is the most important because it holds the reset confirmation, the export, and the GitHub sync — the surfaces where the user feels their data ownership. The others are standard preference panels.

### Edge & System States

**44. wire-permission-denied**  
What the app shows when macOS accessibility permission is missing or got revoked (which happens after some OS updates). This needs a real recovery flow — an explanation and a button to re-grant. It exists because if you don't design it, the app silently breaks after an update and the user has no idea why.

**45. wire-loading-streaming**  
The rare cloud-wait moments where the agent's text streams in word by word instead of showing a spinner. You design what streaming text looks like in context.

**46. wire-empty-no-internet**  
If there's any surface that genuinely can't function offline (probably the debrief generation or a fresh contract parse on cold start), this shows the graceful degraded state. May turn out to be unnecessary if everything degrades inline — you'll find out.