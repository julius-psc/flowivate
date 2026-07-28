The goal of this layer is to define the exact behavior of the core loop: contract, intervention, session, reflection, and the memory uses that connect them. No UI yet — only behavior in prose.

---
### The Contract

#### 1. What the user sees on invocation.

When the user invokes Flowivate via keyboard shortcut, a single input surface appears — modeled on the Raycast/Spotlight pattern. The cursor is in the input field by default. The placeholder reads _"What would you like to get done right now?"_

Beneath the input, three optional controls sit quietly:

- **Duration** — defaults to none. The user can set it explicitly, or the LLM can extract it from the input ("90 minutes on the deck").
- **Project** — optional folder the user has previously defined (e.g. _Design_, _GTM_, _Verdyct_). Helps the agent group tasks longitudinally.
- **Mode** — the firmness of intervention for this session. Three options: _gentle_, _standard_, _strict_. Defaults to whatever the user used last; _standard_ on first session.

Nothing else is on the screen. No tips, no recent sessions, no "good morning" greeting. The user types one sentence, optionally adjusts a control, and hits return. Everything else is friction.

#### 2. Input format.

Pure natural language, with structured controls available beneath but not required. The user can write _"finish the pricing slide of the Verdyct deck, 45 minutes, strict mode"_ and the agent extracts task, duration, project (if recognized), and mode without the user touching the dropdowns. The user can also type only the task and rely on the dropdowns or defaults for everything else.

Defending the format: the contract is a moment that should last seconds. Structured fields make the user feel like they are filling out a form. Pure natural language makes the user feel like they are stating an intention. The agent is the one doing the parsing work — that is its job, not the user's.

#### 3. What the agent does with the input.

The agent parses the user's input into a structured representation:

- **Task title** — the core action the user committed to.
- **Project** — explicit, inferred from prior tasks, or null.
- **Duration estimate** — if stated or extractable, otherwise null.
- **Mode** — gentle, standard, or strict.
- **Referenced apps or files** — Figma, the deck, the codebase, etc. Used to infer which apps count as on-task for this session.

The agent then cross-references the user's onboarding context (work focus, recurring projects, known tools) and recent session history to infer:

- Which applications are _on-task_ for this session.
- Which are likely _off-task_ given the user's stated work.
- Any patterns from prior similar sessions (without surfacing them — that's Q27).

This inference is what allows intervention to work without explicit user configuration. The user does not have to tell Flowivate "block these apps." The agent infers from context.

#### 4. Confirmation before starting.

The agent does not ask for confirmation. The user already stated their intention by typing and hitting return — re-confirming would be friction without value.

What happens instead: a brief, non-blocking toast appears confirming the session has started ("Session started. 45 min on the Verdyct pricing slide."), the main window closes, the menubar indicator activates, and the user is back in their work environment within a second. The confirmation exists as a quiet acknowledgment, not as a checkpoint.

Sharpening of task framing — when a task is vague, the user is rushing, or patterns of vague framing accumulate — happens in the Sunday debrief, never at session start. The agent's job at the start is to get out of the way.

#### 5. Clarifying questions.

The agent does not ask clarifying questions before starting a session. The user is competent; asking the user to defend their phrasing before they begin work is exactly the kind of friction this product refuses.

A specificity score (a v2 feature, not v1) is a possible future surface — a small, non-blocking visual cue showing how well-framed a task is, which trains the user over time without forcing them to defend each input. This is parked for v1. Initial release: the agent parses whatever the user wrote, makes its best inferences, and starts the session.

#### 6. Context attachment and integrations.

For v1, the agent does not read file contents from external integrations. The user does not attach Notion links, Figma files, or calendar events to a session. The agent's only awareness of the work is through what it natively observes: which app is active, which window is in front, how long the user has been there, and whether they are idle.

This is the privacy contract: the agent sees what is in front, not what is inside. It does not read messages in Slack, content in Notion, code in VSCode, or designs in Figma. The active application's name and window title are sufficient signal — _"Twitter / X"_ tells the agent the user is on Twitter without anything from Twitter being read.

Web browsing is handled through window-title inspection on macOS, which exposes the active tab's title (e.g. "Home / X", "GitHub Pull Request #42"). This is sufficient to differentiate social media from documentation without any browser extension, page-content reading, or special permissions beyond macOS accessibility.

Integrations are deferred. The longer they are deferred, the cleaner the privacy story stays.

#### 7. What "the session starts" means.

The moment the user hits return:

- The main window closes.
- The menubar indicator activates and changes color to show _in session_.
- macOS Do Not Disturb activates if the user has enabled this in settings.
- Ambient audio begins playing, if the user has selected a sound.
- The agent begins watching active window, active application, and idle state.
- An internal session record is opened with the parsed task, duration estimate, mode, and start time.

The user is now in their work environment, with the only ambient sign of Flowivate being the menubar indicator. The focus score (introduced below) starts at 100.

### The Intervention

#### 8. Signals the agent watches.

The agent watches continuously:

- **Active application** — the bundle ID of the frontmost app.
- **Active window title** — including web browser tab titles.
- **Idle state** — whether the user has been keyboard/mouse-inactive.
- **Time in current application** — how long the current frontmost app has been active uninterrupted.

That is the entire signal set. No keyboard logging, no mouse tracking, no WPM, no click counts, no screen recording. The product can do its job with these four signals alone, and adding more would weaken the privacy story without proportionally improving the intervention quality.

#### 9. What triggers an intervention.

The intervention fires when the agent detects _psychological exit_ — the user has not just glanced at a non-task app, they are working in one.

The specific rule: an intervention may fire when the user has been continuously active in an _off-task_ app for **two minutes or longer**, with no return to an _on-task_ app during that window. _On-task_ is defined by the agent's inference from the contract (see Q3); _off-task_ is everything else.

The threshold is configurable by mode:

- **Gentle mode:** intervention may fire at 4 minutes of continuous off-task activity.
- **Standard mode:** intervention may fire at 2 minutes (default).
- **Strict mode:** intervention may fire at 60 seconds.

Importantly, "may fire" is not "will fire." The agent intervenes _at most once per session_. Once an intervention has fired, no further interventions occur for the remainder of that session, regardless of additional drift. This honors the consent the user gave at session start without letting the agent become a nag.

#### 10. Signals the agent deliberately does not act on.

- **Brief lookups under the threshold** — checking a Stripe doc, glancing at a Slack message, looking up syntax. Below the time threshold, no signal.
- **Idle pauses** — going to the bathroom, getting coffee, thinking. Idle is not drift. Idle below 20 minutes is invisible; beyond 20 minutes the session auto-closes (Q21).
- **Rapid app-switching between on-task apps** — moving between VSCode, terminal, and the browser-with-localhost is one workflow, not drift.
- **A single tab or window switch to a non-task app** — opening Twitter for ten seconds and switching back. The agent ignores this entirely.

The principle is _engagement elsewhere_, not _presence elsewhere_. A momentary visit to Twitter is presence. Two minutes of scrolling is engagement.

#### 11. What the user experiences during an intervention.

A small overlay appears in the top-right corner of the screen — designed to look distinct from a system notification, so the user knows immediately it is Flowivate. The overlay does not steal focus from the current app; it appears, waits for action, and dismisses after fifteen seconds if ignored.

A subtle sound plays once — a single soft tone, chosen by the user during onboarding from a small set of options. No system pings, no notification chirps. The default is silence; sound is opt-in.

The copy depends on mode:

**Gentle mode:** _"You've been in [app] for 4 minutes. Still on [task]?"_ Buttons: _Yes, dismiss_ / _No, renegotiate_

**Standard mode:** _"You drifted to [app]. Back to [task]?"_ Buttons: _Back_ / _Renegotiate_

**Strict mode:** _"That's drift. Back to [task] now."_ Buttons: _Back_ (closes the off-task app) / _Renegotiate_

The tone scales with mode but never becomes apologetic, never sycophantic, never therapeutic. The agent is the imaginary friend tapping the user on the shoulder — direct, honest, brief. It is not a coach giving a pep talk.

#### 12. The user's options when intervened.

Three actions, depending on mode:

- **Back / Dismiss** — the intervention closes. In strict mode, the off-task app closes too and the user is returned to the most recent on-task app or the relevant file. The focus score, which has been decreasing during the drift, stops decreasing and begins to recover as the user returns to task.
- **Renegotiate** — opens a small dialog. The user can change the task title, the duration, or the mode. After renegotiation, the session continues with updated parameters and the focus score adjusts (see Q13).
- **Ignore** — the user dismisses the overlay or lets it auto-close after fifteen seconds without action. The intervention does not fire again. The session continues. The focus score continues to decrease for as long as the user remains off-task.

#### 13. Renegotiation in detail.

Mid-session, the user can change three things:

- **Task title** — replaces the current commitment. The agent records the change as a "task switch" event. In the reflection, the session is treated as one session with two phases rather than as a completion or abandonment of the first.
- **Duration estimate** — extends or shortens the user's promise. Recorded as a renegotiation event; the agent uses it for pattern detection (does the user consistently underestimate, overestimate, give up on duration estimates entirely?).
- **Mode** — the user can step up or down in firmness mid-session.

Mode and duration changes do not affect the focus score. Task changes pause the score at its current level and start a new internal phase, so each task within the session is scored separately while the session as a whole still rolls up.

What cannot be renegotiated: the project tag (it was either right or wrong at the start), the start time, and the session's identity (it is one session). Cosmetic changes — ambient sound, theme — never affect the score.

The user can also halt the session entirely at any moment. Halting is not abandonment; it is the user's prerogative. The focus score freezes at its current level and the session ends in whatever state it was in.

#### 14. The focus score and what "ignored" means.

The focus score starts at 100 at session start and is the agent's running estimate of focus integrity during this specific session.

The score decreases when the user is in an off-task app, at a rate that depends on the mode (stricter mode = faster decrease). The score recovers gradually when the user returns to an on-task app — not instantly, and not all the way back to 100 if the drift was significant, but partially and over time. The recovery curve is gentler than the decrease curve: drift costs more than recovery returns.

This is intentional. The user is not expected to maintain a perfect score; perfect scores would suggest the metric is meaningless. But drift is real and should leave a mark on the session record, even if the user recovers. Over many sessions, the score becomes a longitudinal signal — not a grade, but a textured record of how cleanly each session went.

"Ignored intervention" means the user dismisses or lets the overlay auto-close without returning to task. When this happens:

- The agent does not intervene again in this session.
- The focus score continues to decrease as long as the user is off-task.
- The session continues until the user ends it or the laptop closes.
- The reflection at session end will reference the ignored intervention directly: _"You drifted at 11:14 and continued in Twitter for 23 more minutes. Want to talk about it?"_

This is the actual escalation: not real-time, but post-session. The agent witnesses and reflects. It does not nag.

#### 15. Configuring intervention modes.

The mode is configurable per session via the dropdown in the contract. The default for any session is the mode used in the previous session — so users settle into a personal default through usage.

In settings, the user can change the _initial default_ (what mode they start in on first session and what their preference is on first install).

There is no global override that forces a mode regardless of per-session choice. The user always has full control at the contract step.

#### 16. Behavior when the user is doing well vs. struggling.

The agent does not praise during a session. The imaginary friend does not interrupt good focus to congratulate it — that would be the supervisor-watching-you feeling that this user explicitly rejects.

The agent does notice good sessions and references them in the reflection or in the Sunday debrief, factually. Example: _"Third completed session this week."_ Not _"Amazing job!"_ Acknowledgment without flattery, in the agent's voice.

If the user is visibly struggling in real time (high drift, ignored intervention, repeated task renegotiation), the agent still only intervenes once. The pattern is named in the reflection and surfaced in the debrief — not in the moment.

### The Session Itself

#### 17. What the user sees during an active session.

The main window is closed. The user is in their work environment. Two things signal the active session:

- **The menubar indicator** is in its active color and clicking it reveals: current task, elapsed time, estimated duration, current focus score, and a single _End session_ button. No other actions.
- **An optional ambient overlay** in a corner of the screen — extremely subtle, configurable per user, designed to be a quiet visual reminder of the session without being a distraction. Off by default.

When an intervention fires, the overlay described in Q11 appears. Otherwise the user works in their normal environment as if Flowivate were not running.

#### 18. Pause.

The user can pause a session. Pause exists because real life produces legitimate interruptions — an urgent call, someone walking into the room, a five-minute bathroom break — and refusing to allow pause makes the product feel rigid and dishonest about how work actually happens.

When paused:

- The session timer freezes.
- The agent stops watching active window and idle state.
- The menubar indicator changes to a paused state.
- The focus score freezes at its current level and does not decrease during the pause.

When unpaused, everything resumes from where it stopped. Pause is not abandonment, not a renegotiation, and not a quality signal — it is simply a hold.

Pauses are logged neutrally. If the agent notices a pattern (e.g., the user pauses on average four times per session and most sessions never resume), that becomes a Sunday debrief observation, not a real-time intervention.

#### 19. What ends a session.

The session ends when the user clicks _End session_ in the menubar.

The agent does not end the session — it does not have the context to know whether work is done, and unilaterally ending would violate the imaginary-friend posture. The estimated duration does not end the session either (Layer 1 Q9 — time is the user's promise to themselves, not a hard cutoff). When estimated time elapses, a quiet notification appears asking _"Time's up — done, or keep going?"_ with buttons _Done_ and _Keep going_. _Keep going_ resumes silently; _Done_ ends the session.

There are also two non-clean endings:

- **Idle timeout** — if the user is idle for 20+ continuous minutes, the session auto-closes in a special "auto-closed" state. This is neither completion nor abandonment.
- **App close or laptop shutdown** — the session ends in the abandoned state (Q21).

#### 20. Completion vs. abandonment.

A session is **completed** when the user explicitly ends it via the _End session_ button.

A session is **abandoned** when:

- The user quits Flowivate without ending the session.
- The user shuts down or closes the laptop mid-session.

A session is **auto-closed** when:

- The user has been idle for 20+ minutes and the session times out automatically.

The reflection prompt fires on completion. On abandonment or auto-close, the reflection fires the next time the user opens Flowivate within 24 hours, and is marked as a "delayed reflection." If 24 hours pass without the user returning, the session is recorded with no reflection data and the agent notes the gap.

The agent does not judge abandonment as failure in real time. Completion and abandonment are descriptive categories the memory layer uses to detect patterns, not moral categories the user is graded on.

#### 21. Closing the app or shutting the laptop mid-session.

When Flowivate detects an unexpected close (app quit, system shutdown, lid close):

- The session is saved in the abandoned state with all data collected up to that point.
- The focus score freezes at its last value.
- The reflection is queued for the next app open within 24 hours.

The user is not penalized for a real-world interruption. A scheduled meeting that runs long, a fire alarm, a dying battery — none of these are choices. The agent's job is to witness, not to punish.

### The Reflection

#### 22. The reflection questions.

Two questions, asked the same way every session, never personalized:

1. **"Did you finish what you set out to do?"** — three buttons: _Yes_, _Partial_, _No_.
2. **"What actually happened? (one line, optional)"** — single free-text field.

That's it. No motivation slider, no how-it-felt question, no mood rating. The user's motivation and feeling come through implicitly in what they type (or don't type) in question 2.

Defending the count: one question is too little — the yes/partial/no alone produces a thin record. Three or more makes it feel like a form. Two is the minimum that produces both quantitative (completion outcome) and qualitative (one-line reflection) signal.

#### 23. Mandatory vs. skippable.

Question 1 (_Did you finish?_) is structurally hard to skip — it's a single tap, and the reflection prompt does not close until it is answered or explicitly dismissed.

Question 2 (_What happened?_) is fully optional. The user can submit with the field empty.

This asymmetry is deliberate: even a rushed user can spare one tap, which preserves the completion-vs-partial-vs-no signal that the memory layer depends on. The optional text field captures honesty when the user has it to give, and does not penalize them when they don't.

If the user dismisses the entire reflection without answering Q1, the session is recorded with the completion state as _unknown_. The agent notices a recurring pattern of skipping and may, eventually, note it in the Sunday debrief.

#### 24. Reflection duration.

Target: 10 seconds for a minimum-effort reflection (one tap on Q1, nothing in Q2). Up to 60 seconds for a more reflective session. The product should never push the user past 60 seconds.

The questions are identical every time. They are not personalized, not adaptive, not contextual. This consistency is part of the privacy and trust contract — the user knows exactly what they are being asked and exactly what they are giving up.

#### 25. In-the-moment follow-ups.

Most reflections receive no follow-up. Silence is the default.

Rarely — perhaps once a week or less — the agent asks a single follow-up question when the user's text contains a specific signal:

**When the agent does follow up:**

- The user writes something that matches a recurring pattern. _"Stuck on the same slide as last Tuesday."_ → _"Want me to flag this slide next time you open it?"_
- The user writes about an ignored intervention. _"Got pulled into Twitter."_ → _"Worth marking Twitter as a hard block for sessions like this?"_

**When the agent stays silent:**

- The user writes something brief and resolved. _"Done, shipped."_
- The user writes about something the agent has no business commenting on. _"Headache, will finish tomorrow."_ — no follow-up. Move on.

There are no templated answers and no suggested completions for Q2. Templates make the reflection feel like a form; free text is what produces the honest data the memory layer needs.

#### 26. The post-reflection moment.

After submitting, the user sees one line — the actual update the agent just made to its model of them — visible for 3 seconds, then fades. Example: _"Noted: shipped the pricing page. Third completion this week."_ Or: _"Noted: drifted to Twitter again. That's the third Wednesday in a row."_ The user sees the agent's model updating in real time. This is the _seen_ option. It honors the imaginary-friend metaphor (the friend writes one line in their journal about you and shows it to you), it makes the agent's memory feel alive on every session, and it builds the trust loop that makes month-three patterns credible. It is also the option most distinct from every competitor — Rize gives you a graph, Raycast Focus gives you nothing. Flowivate gives you the agent's most recent honest sentence about you.

### Memory Use During the Loop

#### 27. Reflection data in the next session's contract.

The memory is used in the contract step rarely, surgically, and only when the signal is strong. Most sessions begin with the user typing into a blank input.

Three cases earn a quiet, non-blocking reference:

- **Recurring task.** The user types something close to a recently abandoned session. A small inline note appears beneath the input: _"You abandoned a similar session yesterday after 12 minutes."_ User can dismiss with escape, ignore, or read.
- **Unusual timing.** The user starts a session at a time they rarely work (3am when mornings are typical). Small note: _"Late one tonight. Same mode as usual?"_ with single-tap confirm.
- **Returning after a gap.** The user has not used Flowivate in 7+ days. Note: _"Welcome back. Want to pick up where you left off, or start fresh?"_

The keyword-trigger continuous-monitoring idea is overengineered for v1 and would consume compute on every keystroke. Three rules above are sufficient.

The user can always disable contract-side memory references in settings if they find them intrusive — but the default is on, because these are the moments that make the agent's memory feel real on day-to-day usage.

#### 28. The Sunday debrief contents.

The debrief is a short written note from the agent. It is not a dashboard, not a set of graphs, and not a "Your Week in Productivity" infographic. It is sentences.

Sample debrief for a real week:

> **Week of May 18-24**
> 
> 5 sessions. 3 completed, 1 partial, 1 abandoned.
> 
> You shipped the Verdyct pricing page and finished the Figma component library refactor. Both came in close to your estimated time.
> 
> Tuesday was your strongest day — two completed sessions, no drift. Thursday was the opposite. You abandoned the session after 8 minutes when Slack pulled you out.
> 
> Pattern from this week: every session you started after 4pm went partial or abandoned. Worth watching. Want to try keeping sessions to mornings next week?
> 
> One observation: you renegotiated three times this week, all to handle Slack. Slack might be eating more focus than you think.

Components: a factual session count, named completions (the wins, stated as facts not praise), the strongest and weakest moments of the week (named specifically), one observed pattern that the agent has detected, and one optional suggestion the user can ignore.

The debrief never gamifies. There is no "streak intact," no "best week ever," no emoji, no percentile ranking. The voice is the imaginary friend writing in their journal about the user — honest, specific, dry.

The user can choose during onboarding which day the debrief lands on (defaults to Sunday, but a developer who works through weekends might want Monday morning or Friday evening). The day is configurable; the format is not.

#### 29. How the debrief is surfaced.

Never by email.

The debrief is delivered as a native macOS notification on the user's chosen day and time — but only if no session is currently active. If a session is running when the debrief is scheduled, it waits until the session ends, then appears.

Clicking the notification opens the Flowivate window directly to the debrief view. From the menubar, the user can also access the most recent debrief at any time, plus an archive of past debriefs.

Email is excluded because this user does not want another newsletter in their inbox, and because the debrief belongs _inside Flowivate_ — it is the agent's voice, not a marketing artifact.

#### 30. Mid-week debrief requests.

The user cannot request a mid-week debrief. The cadence is fixed.

Defending the choice: the relationship between user and agent depends on a cadence that compounds over time, not on instant readouts. Mid-week debriefs would turn the agent into a stats endpoint — _"how am I doing today?"_ — and erode the patience that the long-term posture requires. The Sunday debrief earns its weight precisely because the user has waited for it.

The user can, however, see their current week's data at any time via the menubar — task list, completion count, current focus score average. That's raw data, not a debrief. The debrief is interpretation, and interpretation is weekly.