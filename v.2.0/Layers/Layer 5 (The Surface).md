 The goal of this layer is to define what the user sees, hears, and touches. By the end of it, a designer (Julius, on June 3rd) should be able to open Figma and start producing screens that already feel like Flowivate rather than like a productivity app in general.

The design is not decoration. Every surface decision in this layer is downstream of the philosophy, the user, the mechanic, and the memory. The product's design is the most visible expression of its posture — and the audience can tell from the first screenshot whether the posture exists.

---
### Surfaces

#### 1. The full surface catalogue.

Flowivate has 27 surfaces across six categories.

**Pre-install**

- **Landing page** (web) — the marketing surface; sells month three, not day one.
- **Download / install screen** — standard macOS installer flow; no Flowivate branding choices required.

**Onboarding (first launch only)**

- **Welcome screen** — single screen with the agent's first line and one CTA.
- **Onboarding step 1: name** — one field, used in greetings.
- **Onboarding step 2: work context** — one sentence describing what the user does.
- **Onboarding step 3: active projects** — optional, multi-line free text.
- **Onboarding step 4: defaults** — mode, ambient sound, inference choice.
- **Onboarding step 5: permissions** — macOS accessibility and notifications request.
- **Onboarding step 6: first session prompt** — the contract input, pre-loaded with a suggested task.

**Core loop**

- **Contract input** — the primary surface; what the user sees on invocation.
- **Session-started toast** — brief confirmation that fades after 1.5 seconds.
- **Menubar indicator** — always visible when the app is running; conveys state via glyph color and motion.
- **Menubar dropdown** — three-block stack (current status, today's summary, links).
- **Ambient overlay** (optional, off by default) — subtle corner element showing session in progress.
- **Intervention overlay** — top-right, fifteen-second auto-dismiss, mode-dependent copy.
- **Renegotiation dialog** — small modal triggered from intervention or menubar.
- **Time-elapsed prompt** — "Time's up — done, or keep going?" with two buttons.
- **Reflection prompt** — two-question prompt at session end.
- **Post-reflection note** — single line from the agent, visible 3 seconds, then fades.

**Out of session**

- **Main panel** — the contract input plus the agent's current read of the user; opened via shortcut.
- **Dashboard** — the visual artifact; bento-style, one screen.
- **Technical memory view** — markdown vault with file tree and main pane.
- **Sunday debrief** — single scrollable card, rendered from markdown, exportable.
- **Debrief archive** — list view of past debriefs.

**Settings & infrastructure**

- **Settings — General** — keyboard shortcut, theme.
- **Settings — Modes & defaults** — intervention firmness, audio.
- **Settings — Privacy & memory** — GitHub sync, export, reset.
- **Settings — Inference** — cloud or BYOK, model selection if BYOK.
- **Settings — Notifications & sound** — debrief day, sound character, sound enabled.
- **About / version** — Flowivate version, license, credits, support link.

#### 2. The primary surface.

The primary surface is the contract input. It is what defines Flowivate visually and behaviorally — the thing the user opens the app to see, the thing that becomes muscle memory, the thing that _is_ Flowivate in the user's mind. Everything else in the product is downstream of this one component. The contract is the most important and most mechanical thing in the product, and it has to become a habit.

#### 3. What the primary surface refuses to contain.

The primary surface deliberately refuses:

- No dashboard or progress graphs at the top.
- No streak counter or completion badge.
- No quick-action shortcuts to a dozen features.
- No AI chat box.
- No tips, no "what's new," no upsells.
- No widgets borrowed from Flowivate v1 (water intake, mood, journaling, book log).
- No tutorial overlay or product tour.

Progress is a long-term concept that belongs in the dashboard. The primary surface exists to make the user _do_ the task, not to look at how they're doing.

### Invocation

#### 4. How the user invokes a session.

The primary invocation is a global keyboard shortcut. Secondary is a click on the menubar icon. Voice invocation via Siri is a possible v2 addition; it is not part of v1 because voice commands are friction-heavy in shared workspaces, calls, and offices — environments where the user works often.

#### 5. The default keyboard shortcut.

**⇧+⌥+Space (shift + option + space).**

This combination is uncommon as a global shortcut, sits in a comfortable hand position, and borrows muscle memory from Raycast and Spotlight (which use ⌘+space and ⌥+space respectively). It does not conflict with major IDEs, browsers, or system shortcuts.

The shortcut is remappable in settings. Most users will keep the default.

#### 6. The first 300 milliseconds.

The contract appears in the center of the user's primary display, immediately. No animation, no loading state, no fade-in. The input is in focus the instant the surface renders; the keyboard is ready to accept characters with no delay.

The window position is fixed at center on first launch and remembered across launches if the user moves it. The user can move and resize the window; the new position persists.

The contract is _blazing fast_ — perceptibly instant. Speed at this moment is one of the most important design decisions in the product. Any delay here teaches the user that Flowivate is heavy, and they will start to dread invoking it.

### Visual Language

#### 7. Light or dark.

System-following by default — Flowivate respects the user's macOS appearance setting. Dark mode is the default for new users who have not set a system preference.

The visual system uses **Apple's Liquid Glass** texture as a foundational treatment across all surfaces. Liquid Glass is appropriate for native 2026 macOS design, gives the product a distinctive material feel without becoming gimmicky, and works equally well in both modes. The design system supports both light and dark with equivalent care — neither is a port of the other.

#### 8. Accent color.

Flowivate's accent is a **deeply desaturated blue** that aligns with the existing Flowivate logo while staying intentionally restrained — not the saturated blue of competent SaaS dashboards, but a deeper, almost-grey blue that reads as architectural rather than corporate.

The accent appears sparingly: focus states on the contract input, active session indicators, the menubar glyph when a session is running, and the single most important number on the dashboard. It is never used decoratively, never used to color category labels, never used on more than one element per screen.

The visual interest in Flowivate comes from the Liquid Glass texture, the typography, and the spacing — not from color. The accent is a punctuation mark, not a paragraph.

#### 9. References.

**From Linear:** the pixel-perfect micro-animations on hover and click; the way command palettes feel weightless; the discipline of one accent color and no decorative iconography.

**From Raycast (current Liquid Glass beta):** the way the invocation surface appears instantly without ceremony; the keyboard-first navigation throughout; the typographic hierarchy in command lists.

**From Obsidian:** the file tree, the vault structure, the markdown-first content model, the graph-view aesthetic of linked notes. This carries directly into the technical memory view.

Three references, three distinct schools. Linear and Raycast share a school; Obsidian sits outside it and prevents Flowivate from becoming "Linear but smaller."

#### 10. Anti-references.

**Flowivate v1.** The all-in-one wellness-adjacent dashboard with too many widgets and no center. The new product refuses every visual habit that produced the old one.

**Notion.** The integration sprawl, the database-as-UI aesthetic, the steep learning curve, the surface-area-without-opinion design language.

**ChatGPT and Claude.app.** The conversational chat interface, the bubble UI, the "tell me anything" framing. Flowivate's agent is intelligent, but the product is not a chatbot, and it must not look like one.

#### 11. Density.

Density varies by surface. The contract input and the reflection prompt are **spacious** — single elements with breathing room, designed to be encountered without friction. The dashboard and the technical memory are **dense** — information-rich, considered packing, the user is here to look at data. The Sunday debrief sits in the middle, leaning spacious but with enough structure to feel substantive.

The dashboard's density is the highest in the product. The contract's density is the lowest. The trajectory between them mirrors the user's intent: tight focus when starting, expansive reflection when reviewing.

### Typography

#### 12. Typefaces.

Three faces. No more, no exceptions.

- **Display & body: Geist.** Modern, free, distinctive enough to avoid feeling generic, neutral enough to age well. Used for headings, the contract input, settings labels, all UI text.
- **Mono: Geist Mono.** Same family, monospaced. Used for the agent's prose, the technical memory view, and the Sunday debrief.

A single family with both proportional and monospaced cuts keeps the visual system disciplined and the licensing simple. Geist is free, well-maintained by Vercel, and aligns with the modern Linear/Raycast/Vercel typographic school the product borrows from.

#### 13. The agent's voice in type.

The agent's prose is set in **Geist Mono**. Everything else in the UI is in Geist (proportional).

This is a small decision with outsized brand consequence. Setting the agent's voice in mono gives every observation a journal-entry quality — typed into a terminal, recorded into a record, not rendered as another piece of app chrome. Rize's commentary is set in standard sans. Raycast's is set in standard sans. Flowivate's agent speaks in monospace, and the agent becomes instantly recognizable anywhere it appears in the product.

Mono also signals to the user that the agent's prose is _fact_, not marketing — terminals and journals tell the truth.

### Motion

#### 14. Motion language.

Flowivate's motion is **sharp and instant** for primary actions, **soft and damped** for state transitions, and **absent** for everything decorative.

- The contract input appears without animation. It is just suddenly there.
- The intervention overlay slides in from the top-right with a brief easing, taking ~200ms. It does not bounce.
- The post-reflection note fades in over ~300ms, holds for 3 seconds, fades out.
- Menubar glyph state changes (idle → in-session → paused) cross-fade gently.

No spring physics, no decorative tweens, no "delight" animations. Motion serves clarity, not personality.

#### 15. Motion budget.

**Moderate.** Less motion than Arc, more than Linear at its strictest. The product does not want to feel inert, but it must not feel performative.

macOS trackpad haptics are used selectively — at session end, on intervention dismissal, on debrief open — to give those moments a tactile signature. Most users won't consciously notice the haptics; they'll just feel that Flowivate is _crafted_.

### Sound

#### 16. When the product makes sound.

Default is silence. Sound is allowed in two moments:

- **Intervention fired**, if the user has opted into intervention sound during onboarding.
- **Session ended by the user** (not auto-ended, not idle-closed). A single brief tone signals "the work is done."

Everything else — session start, post-reflection, debrief arrival, settings interactions, errors — is silent. Sound is rare enough that when it happens, it means something.

#### 17. The character of the sound.

A **single, slightly digital chime** — modeled on the Linear "issue closed" tone. Brief (~200ms), single note, faintly synthetic but not harsh, no resonance tail. Recognizable but not precious.

This character matches Flowivate's posture: modern, restrained, native to the developer's environment without being sentimental. The user hears the chime and knows the moment is acknowledged without being celebrated.

### States

#### 18. The empty state.

The user has just finished onboarding and invokes Flowivate for the first time. The main panel opens.

At the top, a single line in Geist Mono:

> _"I don't know you yet. Start a session and I'll start learning."_

Below the line, the contract input. Standard placeholder: _"What would you like to get done right now?"_ Cursor focused, ready.

Below the input, the three optional controls (Duration, Project, Mode) in default state.

Nothing else. No tutorial overlay, no tips sidebar, no zeroed-out graphs, no preview of the dashboard, no welcome banner.

The tone is _quiet anticipation_. The user is not greeted; they are met. The agent's opening line admits what it doesn't know — which earns trust — and promises what it will become — which earns engagement. The user types a task, hits return, and the loop begins.

#### 19. The month-three state.

The user invokes Flowivate via ⇧+⌥+Space. The main panel opens.

The contract input is in **exactly the same place**. Same size, same focus state, same placeholder. The continuity is the design promise — the user's muscle memory for the contract should never change.

What's different: above the input, the agent's line has filled in. One or two sentences in Geist Mono:

> _"11 sessions this week, 7 completed. You shipped the Verdyct pricing page on Tuesday — mornings remain your strongest window."_

Below the input, the three controls. Defaults reflect the user's patterns — if they always run Standard mode in the morning, that's pre-selected at 9am.

Below that, a single small element if applicable: _"Last week's debrief →"_ if there's an unread one, or _"Open dashboard →"_ otherwise. One link. Never more.

The user can ignore the agent's prose and just type a task. They can read it and feel seen. They can click the link and dive deeper. The product gives them all three options without forcing any.

The continuity test: a user who used Flowivate for a day, then took two months off, then returned, should recognize the screen instantly. The input is where it was. The Mode dropdown is where it was. What's filled in around it is new, but the core action is unchanged. That continuity is what makes month-three feel like compounding rather than complexity.

#### 20. The off state.

When the user is not in a session and not actively in the app, Flowivate is dormant. No floating window. No persistent dock icon — Flowivate does not occupy the dock. The menubar indicator is the only sign the app is running.

The menubar indicator is visible at all times when the app is running. This lets the user reach the app from anywhere on the system without searching for it. Clicking the indicator opens the dropdown (Q23). Pressing ⇧+⌥+Space opens the main panel.

#### 21. Loading and waiting.

Cloud-dependent operations happen in the background. The contract parses asynchronously while the session is already starting; the post-reflection note generates while the user is reading the reflection prompt; the Sunday debrief is composed in the background overnight and is already complete when the user opens it.

For the small number of moments where the user _must_ wait on the model (a manually requested debrief regeneration, a cold-start contract parse on a slow connection), the agent **types its response in real time** — token-streaming in Geist Mono, sub-second total time. The waiting _is_ the agent thinking. The user sees the prose appear word by word.

Spinners are never used. A spinner is the lazy answer. The streaming text is Flowivate's answer.

### Menubar

#### 22. The menubar icon.

The menubar icon is a single **glyph** — Flowivate's logo simplified to one stroke, recognizable at 16px. The glyph never carries text labels.

State is conveyed through color and motion:

- **Idle**: dim outlined glyph, no motion.
- **In session**: filled glyph in the accent color, with a slow breathing pulse (~5-second cycle).
- **Paused**: filled glyph, no pulse.
- **Drift detected (intervention firing)**: filled glyph with a brief amber tint, lasting ~3 seconds.
- **Debrief available**: idle glyph with a small dot indicator in the corner; the dot is dismissed when the debrief is opened.

The glyph's visual quietness is intentional. A user glancing at their menubar should be able to tell the state of Flowivate in under half a second without parsing any text.

#### 23. The menubar dropdown.

Clicking the menubar icon opens a small dropdown with three blocks, in this order:

**Top — Current status.** If a session is active: task name, time elapsed, an End button. If no session is active: a compact version of the contract input that triggers the full main panel on focus.

**Middle — Today's summary.** Two lines: completion count for the day ("3 completed, 1 partial"), and a single agent observation if memory has surfaced one ("Strongest run of the week so far.").

**Bottom — Links.** Three text links: _Dashboard_, _Settings_, _Quit_.

That's it. Three blocks. No more. The dropdown is for at-a-glance state and quick navigation; deeper interactions happen in the full main panel.

### Onboarding

#### 24. The first 90 seconds.

From the moment the user finishes installing Flowivate to the moment they hit return on their first session:

1. The welcome screen appears. The agent's first line shows. The user clicks "Begin."
2. Step 1: name. One field. The user types. Click "Next."
3. Step 2: work context. One sentence. The user types. Click "Next."
4. Step 3: active projects (optional). Skippable. Click "Next" or skip.
5. Step 4: defaults. Three button choices (mode, sound, inference). Click "Next."
6. Step 5: permissions. macOS accessibility and notifications. The user clicks through the native dialogs.
7. Step 6: first session prompt. The contract input appears with a pre-loaded suggested task based on their work context. The user can edit it or accept it. They hit return. The session begins.

Total time: 90 seconds to 3 minutes depending on how much the user types.

The first session is the actual onboarding. Reading about the contract loop is not onboarding; running it is.

#### 25. What the agent says.

The agent's lines across the onboarding flow:

**Welcome:** _"I'm Flowivate. I'll be here when you sit down to work. The more sessions we run, the more I'll learn about how you actually focus. Want to start?"_

**After step 1 (name captured):** _"Nice to meet you, Julius."_

**After step 5 (permissions granted):** _"Okay. Let's run your first session."_

**Step 6 (pre-loaded contract):** _"I noticed you mentioned [work context]. Try something like: [suggested task]. Or write your own."_

The voice is direct, brief, and warm without being sentimental. No exclamation marks. No "Welcome aboard!" No "Let's get started on your productivity journey!" The agent says less than the user expects, and that restraint is itself the introduction.

#### 26. What the user is asked to provide.

Five inputs across the onboarding steps, in order:

1. **Name** — one text field. Used in greetings and notifications.
2. **Work context** — one sentence, free text, ~200 characters max. Placeholder: _"Building a customs compliance SaaS and a focus app."_ This is the agent's first model of what the user does; it feeds app classification and project inference. Skippable.
3. **Active projects (optional)** — multi-line, one project per line. Skippable.
4. **Defaults** — three button choices: mode (Gentle / Standard / Strict, defaults to Standard), ambient sound (Off / Lo-fi / Rain / Custom, defaults to Off), inference (Flowivate's model / BYOK, defaults to Flowivate's model).
5. **Permissions** — macOS accessibility + notifications via native dialogs, with one line of copy from the agent explaining what accessibility access is used for and what it isn't used for.

Total fields: five. Total time: 90 seconds to 3 minutes. Nothing else is asked. No survey, no goals, no productivity quiz, no calibration.

#### 27. The transition to the first session.

After the user grants permissions, the agent says one line and the contract input appears, pre-loaded with a suggested first task based on their work context. The contract is the same surface they will use forever — there is no "tutorial mode" or "first session" variant. The user types or accepts, hits return, and the session begins identically to every future session.

The transition is deliberately abrupt. Onboarding ends and work begins, in the same window, with no intermediate confirmation. The user is taught that Flowivate is the contract, and the contract is the work.

### Dashboard

#### 28. Layout.

The dashboard is a single screen, **bento-grid** layout, no scrolling. It is designed to be read in 30 seconds and closed.

Approximate composition:

- **Top row (largest cells):** Weekly focus score average with a sparkline trend, and weekly completion count.
- **Middle row:** Time-of-day × day-of-week completion heatmap (the visual centerpiece), and active projects with per-project completion rates.
- **Bottom row:** The three most recent agent observations in Geist Mono, surfaced from the technical memory.

The heatmap is the largest single element on the screen. It is the thing the user comes back for.

#### 29. Dashboard restraint.

What makes the dashboard feel like Flowivate rather than Notion or Rize:

- **No icons next to metric labels.** Icons clutter; numbers and short labels carry their own meaning.
- **No colored category badges.** Badges signal SaaS; Flowivate does not need them.
- **Numbers dominate visually**, not labels next to charts.
- **The agent's prose observations are interleaved with metrics**, set in Geist Mono, not separated into a "notes" panel. The agent's voice and the data live on the same surface.
- **One accent color** — used only on the most important number on screen, never decoratively.
- **No greetings, no time-of-day banners, no "Your week at a glance" copy.** The dashboard does not narrate itself. It is read, not announced.

The restraint is what produces the feel. The absence of the things other dashboards do is the design.

### Technical Memory View

#### 30. The vault inside the app.

The technical memory opens in a dedicated panel inside the main app window. Layout: file tree on the left, main pane on the right.

The file tree mirrors the structure on disk — sessions grouped by month, projects in their own folders, pattern files in a top-level "Patterns" directory. The user can expand and collapse folders, search across files, and click into any file to read or edit it.

The main pane renders the selected markdown file with light formatting (mono font, headings styled, links live). When the user clicks into a prose note, the text becomes editable in place (Q31).

This is a separate panel within the main app, not a separate window. The user reaches it from the main panel's menu or directly via a keyboard shortcut.

Most users will rarely visit the technical memory. The dashboard handles their daily interaction with their data. The technical memory exists for the user who wants to read, edit, or audit the agent's interpretation — and the user who wants to push to GitHub.

#### 31. Editing affordances.

**Inline edit, in place.** The user clicks on a prose note, the text becomes editable directly in the main pane, they edit, they click away or press escape, the change saves.

No modal, no full-screen editor, no save button. The technical memory feels like an Obsidian vault: a folder of markdown files the user can read and edit naturally. Modals would make the memory feel like a content management system. Inline editing keeps it feeling like a vault the user owns.

Editing the agent's prose triggers a small recalibration in the agent's interpretive weight (Layer 4 Q6, Q17), but this is invisible to the user. They edit; the agent updates silently.

### The Sunday Debrief

#### 32. Visual presentation.

The debrief is a **single scrollable card**, rendered from a markdown file the user can export at any time.

Layout: at the top, the week's date range and session count. Below that, one to three observations in Geist Mono — the agent's prose, exactly as it would appear in a journal entry. At the bottom, a small _"see details"_ link that opens the dashboard filtered to the week.

No charts. No infographics. No emoji headers. No "Week in Review" graphic styling. No bento cards within the debrief. The visual quality is **a letter from the agent, set in mono, exportable as markdown.** The shareability comes from the screenshot of the prose, not from infographic design.

This is the most important opinionated choice in the design. Every other AI-productivity tool in 2026 ships its weekly summary as a graphic-heavy report. Flowivate's debrief is text — quiet, specific, dry, and signed in tone by the agent. That difference is the brand.

### Settings

#### 33. Settings layout.

Settings opens in its own window with a **sidebar navigation pattern**. Five sections, in order:

- General
- Modes & defaults
- Privacy & memory
- Inference
- Notifications & sound
- About

The visual treatment matches the main app — same typography, same accent, same density. Settings is not an afterthought; it is where the user feels the product's care in the small details.

Within each section, fields are grouped and labeled clearly, with brief explanatory copy where needed. The Privacy & memory section is especially detailed — it is where the user controls GitHub sync, exports their data, sees their storage location, and can reset. Every action in Privacy & memory shows its consequences plainly: _"This will permanently delete 247 sessions of pattern data. The agent will start over."_

Customizability across settings is meaningful — the user feels they have full control over the product's behavior, and subconsciously, over their own privacy.

### The Anti-Surface

#### 34. What Flowivate does not have a surface for.

The following features do not exist anywhere in the product:

- Streaks.
- Leaderboards.
- Achievements and badges.
- Year in Review or other retrospective marketing surfaces.
- Sharing screens.
- Public profiles.
- Social features of any kind.
- Friend lists, accountability partners, or any multi-user feature.
- Productivity scores out of 100.
- "Suggested goals."
- Themes beyond light/dark and Liquid Glass.

Work is done for the user, not for an audience. The user is here to improve their own habits, not to demonstrate that improvement to others. The cumulative absence of these surfaces is what makes Flowivate feel like an instrument rather than an app.