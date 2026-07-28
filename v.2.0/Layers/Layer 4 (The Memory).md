The agent's longitudinal model of the user is the moat. The contract loop is replicable in a weekend; what cannot be replicated is the accumulated, structured, user-correctable model of one specific person's work patterns over months. This layer defines what that model contains, how it grows, what the agent does with it, and what it refuses to do with it.

Three principles hold across the entire layer: the memory is the product's value proposition over time, it is private and local-first by default, and the agent's voice in the memory sounds like an honest journal entry — not coaching, not therapy, not flattery.

---
### What the Memory Contains

#### 1. What the agent knows after one completed session.

After a single session, the agent writes a structured record to a markdown file. The format is consistent across every session and looks like this:

```
Session 001 — 2026-06-03 09:14
Task: Design hero of landing page
Project: Verdyct
Duration estimated: 2h 25min
Duration actual: 2h 12min
Mode: Standard
Completion: Yes
Focus score: 94 → 94 (no drift)
Interventions: 0
Renegotiations: 0
Reflection: "got the hero done. Decided to drop the gradient."

Agent note: First session. Verdyct project initialised. Strong focus run — no drift, near-exact duration estimate, full completion. Insufficient data for patterns.
```

Structured fields plus a single short prose note. The fields are queryable; the note captures interpretation. After one session, the note is mostly factual and explicitly admits insufficient data — the agent does not pretend to know the user yet.

#### 2. What the agent knows after ten sessions.

By the tenth session, the model has texture. The agent has observed enough to begin tentative pattern recognition without committing to claims yet.

After ten sessions, the agent knows things like: the user has run three sessions on Verdyct, all in the morning; the first duration estimate was off by 13 minutes high, the second was on, the third was off by 22 minutes high — an early signal of duration underestimation; the user has typed "drop the gradient" twice in reflections, possibly indicating a pattern of removing features rather than adding them; completion rate so far is 80 percent (8 of 10); average focus score is 87; one session has been abandoned, and it was the only session started after 4pm.

These are tentative observations, written in the agent's note in low-confidence language: _"Possible early signal of duration underestimation — three datapoints so far, not enough to commit."_ The agent does not surface these to the user yet; they are notes to itself.

#### 3. What the agent knows after a hundred sessions.

By session 100, the model is meaningfully predictive. The agent now knows things no other productivity tool currently knows about its user.

Specifically: the user ships 87 percent of morning sessions and 41 percent of post-4pm sessions; renegotiations are three times more frequent on days following late nights, detected via session start times shifting later than usual; the user has three recurring task patterns — Verdyct deck work (24 sessions, 79 percent completion), Flowivate design (18 sessions, 91 percent), and "review emails" (12 sessions, 17 percent completion, almost always abandoned within 20 minutes); when Slack is the drift app, the session is four times more likely to be abandoned than when Twitter is the drift app; the user's strongest weekday is Tuesday, weakest is Thursday; duration estimates have a consistent overestimate bias on design tasks and an underestimate bias on coding tasks.

This level of detail is what makes Flowivate's value compound. A new entrant cannot fast-follow this, because they would be starting from zero. The depth of the model is a function of time spent, not features shipped.

#### 4. The structure of the memory.

Flowivate uses a hybrid structure: structured fields for quantitative data plus free-form prose notes maintained by the agent.

The structured side stores everything queryable — completion counts, focus scores, time-of-day patterns, app drift counts, duration estimate accuracy. The agent uses these for pattern detection and statistical thresholds.

The prose side is what makes the memory feel alive. After each session, the agent writes a short note interpreting what happened. Over time, longer prose notes accumulate at the project level and at the user level — running observations the agent maintains and updates as new evidence arrives.

Defending the hybrid: pure structured data feels dead and produces dashboards, which is what every competitor already does and what the user explicitly rejects. Pure free-form notes feel alive but make pattern detection unreliable, because the LLM has to re-read prose to answer questions. The hybrid lets the agent reason quantitatively where math is appropriate and qualitatively where interpretation is appropriate.

#### 5. The user-facing surface of the memory.

The memory lives in two distinct surfaces with different jobs.

The first surface is the **technical memory** — markdown files organised in a structure modeled on Obsidian. Each session is a file. Each project has a folder. Each pattern the agent has detected has its own file with linked references back to the sessions that produced it. This is human-readable but designed primarily for the agent to index. The user can drill into it any time they want, but they don't have to. Subtle inline notifications appear when significant information is added — and the post-reflection moment (Option C from Layer 3) is the primary place the user encounters new memory being written.

The second surface is the **dashboard** — a minimal, visual overview the user opens when they want to see the agent's interpretation of them at a glance. This is described in detail in Q20.

#### 6. Editing and correcting the memory.

The user can edit the prose notes the agent has written. They cannot edit the structured fields — those are session ground truth and represent what actually happened, not how it was interpreted. This is a deliberate asymmetry: the user owns interpretation, the system owns behavior.

The user's posture when editing is both correcting factual mistakes ("no, I wasn't avoiding the deck, I had a family emergency that day") and shaping the agent's interpretation of themselves over time. Both are valid uses.

When the user corrects the agent in a way that later evidence contradicts, the principle is: **the user's correction is authoritative for that specific past event, but the agent retains the right to notice future evidence.** If the user corrects "you avoided the deck on Tuesday → no, family emergency," the agent updates that single session's note. The data point itself is not deleted. If the same user then avoids the deck three more Tuesdays in a row, the agent surfaces the new pattern — without referencing the corrected session — and phrases the observation tentatively: _"Pattern: Tuesdays have been your lightest day for three weeks. Coincidence, or worth talking through?"_

The agent never argues, never accuses, never surfaces the contradiction publicly. It calibrates silently. Over time, if a user consistently edits prose to contradict the underlying session data, the agent gives less interpretive weight to prose edits and more to behavioral patterns — without ever telling the user this is happening.

### What the Memory Looks For

#### 7. Patterns the agent actively detects.

The agent looks for, at minimum:

- Consistent over- or under-estimation of session duration, broken down by task type or project.
- Completion rate by time of day and day of week.
- Drift to specific apps clustered around specific task types.
- Avoidance — task titles that have been started and abandoned multiple times.
- Productivity patterns by day of week.
- Recovery patterns after a partial or abandoned session.
- Type of project being completed and what mode of work it requires (learning, building, brainstorming).
- Time allocation across active projects, with implicit prioritization signals.
- Workflows between apps used to complete a task (e.g., Ghostty + Zen + VSCode forms a "coding workflow"; Figma + Linear + Notion forms a "design workflow").
- Renegotiation patterns — what kinds of changes the user makes mid-session and what they correlate with.

Each detected pattern is stored in its own file in the technical memory, with links to the sessions that produced it and a confidence indicator.

#### 8. What the agent is forbidden from inferring.

The agent does not speculate about the user's mental health, relationships, motivations beyond what is directly observable in session data, or anything that requires inferring causes rather than observing patterns. It does not infer mood from session quality, life events from gaps in usage, or personality traits from work behavior. If the agent cannot point to specific session data as evidence, it does not write the observation.

This boundary exists because the moment the agent begins speculating about the user's inner life, it has stopped being a witness and started being a therapist — and that breaks the imaginary friend metaphor, which is grounded in observation and presence, not interpretation of feeling.

#### 9. When the agent surfaces a pattern.

Patterns surface at different thresholds depending on stakes.

**Low-stakes patterns** (preferred working time, app workflows, duration estimate accuracy) require five or more occurrences in a fourteen-day window before being surfaced. These are useful but not urgent, and the cost of being wrong is low.

**Medium-stakes patterns** (completion-rate variations by context, recurring drift apps, day-of-week patterns) require eight or more occurrences or two or more weeks of consistency.

**High-stakes patterns** (sustained avoidance of a specific task, repeated abandonment in a project, escalating partial-completion rate) surface earlier — at three or more occurrences — because the cost of letting them continue silently is higher than the cost of surfacing them slightly early.

The "user's prior interest" condition operates independently: if the user has previously asked about a topic ("how am I doing on mornings?"), the agent surfaces relevant patterns with lower thresholds because the user has signaled they want to know.

### How Memory is Used in the Loop

#### 10. Memory in the contract step.

Three surgical rules from Layer 3 Q27 apply: the agent surfaces a quiet, non-blocking note when the user types a task close to a recently abandoned session, when the user starts a session at a time they rarely work, and when the user has not used Flowivate in 7+ days.

These notes are inline, dismissable with escape, and never block the contract from being submitted. They are the cheapest, highest-trust demonstrations of the agent's memory.

Beyond these three, the contract step stays clean. The contract is a moment of intention, not a moment of reflection — adding more memory references would slow the user down at exactly the wrong moment.

#### 11. Memory in interventions.

Intervention copy becomes more specific over time, but not in a way that feels accusatory.

In early sessions, the intervention copy is generic: _"You drifted to Twitter. Back to the deck?"_

Around session thirty, when the agent has accumulated evidence of recurring drift patterns, the copy can sharpen — but only at the _gentle_ and _standard_ modes, and only when the memory signal is unambiguous. Example: _"Twitter again — third time this week. Back to the deck?"_

In _strict mode_ the copy stays terse and impersonal — strict users have asked for firmness, not commentary, and adding memory references in strict mode would feel like the agent piling on.

The rule for memory escalation in interventions: the memory reference must be specific (a number, a day, a named app) and must be factual. The agent never says "you always do this" or "you have a problem with Twitter" — that is interpretation, and interpretation belongs in reflections and debriefs, not in real-time interventions.

#### 12. Memory in the reflection follow-up.

When the agent occasionally asks a follow-up after the user submits a reflection (Layer 3 Q25, rare — once a week or less), memory triggers are the source of the follow-up.

**Trigger examples:**

The user writes _"stuck on the same slide as last Tuesday."_ Memory shows the same slide mentioned in a prior reflection. Follow-up: _"Third time the hero slide has come up. Want me to flag it next time you open the file?"_

The user marks "partial" three sessions in a row, all on the same project. Follow-up: _"Three partials in a row on Verdyct. Anything blocking, or just busy weeks?"_

**Rules for follow-ups:**

- Maximum one follow-up per session.
- No follow-up two sessions in a row, even if both have memory signals worth surfacing.
- Only when the memory signal is specific enough to phrase concretely — vague observations ("you've been busy lately") are not surfaced because they invite vague answers.
- The follow-up is always a question, never a statement, and always optional to answer.

#### 13. Memory in the Sunday debrief.

The debrief surfaces up to three observations per week, but the number is variable based on relevancy. Some weeks the agent has one strong pattern to surface and two would be padding; other weeks it has three meaningful observations.

The composition rule when three are surfaced:

- One **win** — a factual completion observation, stated without flattery. (_"You shipped the Verdyct pricing page and the component library refactor."_)
- One **neutral pattern** — an observation, no judgment. (_"You renegotiated three times this week, all to handle Slack."_)
- One **uncomfortable observation** — an avoidance, a drift, a partial-rate problem. (_"Every session after 4pm went partial or abandoned."_)

The agent never repeats the same observation across two consecutive debriefs unless the user engaged with it the previous week. New patterns get priority over already-surfaced ones. Old patterns the user has already absorbed get cycled out.

The voice of the debrief follows the agent's overall voice: witness with brief friend warmth.

### Memory Architecture

#### 14. Where the memory is stored.

The memory is **fully local by default**. All session data, prose notes, pattern files, and the dashboard's underlying state live on the user's Mac as encrypted markdown files in a Flowivate vault.

Users who want backup or multi-device sync can opt in to a **GitHub sync** approach modeled on the Obsidian Git plugin — their vault gets pushed to a private repository they control, on a schedule they choose. This gives the user full ownership over their data's destination without Flowivate operating any cloud storage.

This is communicated in onboarding with one line: _"Your sessions live on your Mac. Nothing is uploaded to Flowivate's servers. If you want sync or backup, you can push your vault to your own GitHub repo from settings."_

There is no Flowivate-operated cloud storage in v1.

#### 15. What the LLM sees vs. what stays local.

For v1, Flowivate uses a **cloud LLM (Claude or GPT-5-class) with encryption in transit**.

The user's memory stays on their Mac. Only the relevant slice for the current operation is sent to the model — the contract being parsed, the week's session records for the debrief, the prior reflections for a memory-triggered follow-up. The provider sees plaintext by necessity — that is how inference works — but data is encrypted in transit and Flowivate operates under a no-training, no-retention agreement with the inference provider. Do not describe this as "end-to-end encryption" in any user-facing copy; that claim is technically false and this user will know it. The honest privacy story is: data leaves your Mac only to run the model, travels encrypted, is not stored or used for training. That is a strong story. It does not need to be overstated.

Users who prefer to use their own API key can switch to **BYOK** (bring-your-own-key) in settings for a €5 per month discount on their subscription. This serves the privacy maximalist, the cost-sensitive power user, and the developer who wants control over which model is used.

Local-only inference is not supported in v1. Apple Intelligence and on-device open-weight models in 2026 are not yet capable of producing the writing quality and pattern detection the agent requires — especially for the Sunday debrief, which is the product's signature moment and cannot afford to be the weakest model. This will be revisited in 2027 or 2028 when local model quality and Mac hardware have improved.

**Operational notes downstream of this choice:**

- The user never blocks on the model. When the contract is submitted, the session begins immediately while the agent's inferences (app classification, context linking) finalize asynchronously within a second.
- Sessions work offline. Local data collection (signals, focus score, session record, reflection capture) is fully local. Cloud-dependent operations (intervention copy generation, post-reflection note, Sunday debrief) queue and run when the user reconnects.

#### 16. Memory export.

The user can export their entire memory at any time. The export format is **markdown** — the same format the files already exist in — packaged as a zip. JSON export is available for power users who want to process the data programmatically.

Export matters to this user because it makes the implicit promise explicit: _the memory is yours, not Flowivate's_. The user can leave the product tomorrow and walk away with everything the agent ever wrote about them. This is part of why the product can charge €20/month — the user is not locked in, and that's a feature, not a risk.

#### 17. Memory reset and deletion.

**Full reset** wipes everything irreversibly. The user is shown a prominent confirmation dialog that lists exactly what will be deleted (sessions, prose notes, patterns, dashboard data) and warns that the agent will start over with no knowledge of the user. Reset is available in settings, never in the main app surface — it is a deliberate action, not an accidental one.

**Selective deletion** is allowed: the user can delete individual sessions or pattern files directly from the technical memory. This is how Obsidian-style markdown editing works — the user deletes a file, and the agent's next pass through the memory will simply not see that file.

The cost of resetting is the loss of the compound, which is the entire moat. The agent warns the user explicitly in the reset dialog: _"You will lose 247 sessions of pattern data. The agent's model of you will start over."_

On the biased-editing concern: the prose notes are user-editable, but the underlying session data (which apps were active, time on each, completion state) is not editable. **The user controls interpretation; the system controls behavior.** A user who edits the prose to make themselves look better can shape the narrative, but cannot hide the data. Over time, if their edits consistently disagree with what actually happened, the agent gives less interpretive weight to the prose and more to the observed patterns — without ever announcing this calibration to the user.

#### 18. Long breaks.

The agent uses **session frequency** as its only signal for gaps. It does not watch the user's screen time outside sessions, does not infer activity from general computer use, and does not speculate about why a gap exists.

If the user hasn't opened Flowivate for 14+ days, the agent's next contract step shows a single inline line: _"Welcome back. 14 days since your last session."_ No questions, no judgment, no "where were you."

The agent does not treat planned breaks, unplanned gaps, and relapse-and-returns differently — it has no way to distinguish them, and asking the user to explain themselves would violate the relationship. The line is the same in all three cases. The friend metaphor holds: the friend notices the gap, says hello, and gets on with the conversation.

"Welcome back" is acceptable as a static greeting because it is brief, factual, and warm without being parasocial. Anything beyond that — "I missed you," "I was wondering where you'd been" — would cross into territory the agent does not occupy.

#### 19. The long-term shape of memory.

The memory uses **rolling detail with summarised history**.

Recent sessions (the most recent rolling window, likely 30-60 days) are retained in full detail — every field, every prose note, every signal. Older sessions are summarised at the month or quarter level into prose recaps the agent maintains. The raw session records remain available in the technical memory for the user to read, but the agent's day-to-day reasoning uses the summaries to keep context efficient.

This architectural choice means the agent does not load the full memory into its context window. Instead, the memory is a structured corpus the agent indexes (via retrieval) for each operation. The agent acts _as if_ it remembers everything, but in practice it queries the relevant slice each time. This keeps inference costs bounded and lets the memory scale to years of use without becoming prohibitive.

When the user evolves — switches careers, changes work hours, abandons a project — the rolling window naturally lets old patterns fade and new ones emerge. The agent does not need to be told "I changed jobs"; the data shows it, and the summaries gradually shift to reflect the new reality.

### The Trust Contract

#### 20. The two artifacts.

The memory exists in two forms that serve different uses.

The **technical memory** is the markdown vault: structured session files, prose notes, pattern files, project folders. This is the agent's working surface — what it indexes, queries, and writes to. The user can read every file, edit prose notes, and navigate the structure like an Obsidian vault. But this is not how the user typically encounters their own data.

The **dashboard** is the minimal, visual artifact the user opens when they want to see the agent's interpretation of them at a glance. It is brief, calm, and designed for someone scanning rather than reading. Specifically, the dashboard contains:

- **Focus score average** for the current week and a trend line over the last 8 weeks.
- **Completion rate** for the current week (e.g., "8 of 11 sessions completed").
- **A small completion heatmap** — a grid showing time of day on one axis, day of week on the other, with each cell colored by completion rate. The user sees their most reliable focus windows at a glance.
- **Active projects** with completion rate per project.
- **The three most recent agent observations** — the prose patterns the agent has detected, surfaced from the technical memory.

No streaks, no badges, no productivity score out of 100, no AI-generated motivational copy. The dashboard is a quiet readout, not a stage.

The user opens the dashboard when they want to understand themselves. They open the technical memory only when they want to read the raw record or correct something specific. Most users will live in the dashboard and rarely visit the markdown files — that's the intended distribution of attention.

#### 21. The agent's voice.

The agent's voice is **witness with brief friend warmth**.

The witness component dominates: the agent states what happened factually, without speculation, without coaching, without flattery. The friend warmth shows up sparingly — a brief opener like "Hey," a casual word here and there — to keep the voice from sliding into clinical or surveillance-feeling territory. But the friend warmth never overrides the witness posture. The agent does not ask "how do you feel about that," does not soften observations with hedges like "I might be wrong, but," does not offer encouragement.

**Three example sentences across the three primary surfaces:**

- **Intervention** (standard mode, session 30): _"Twitter again — third time this week. Back to the deck?"_
- **Reflection follow-up:** _"Third partial in a row on Verdyct. Anything blocking, or just busy weeks?"_
- **Sunday debrief:** _"Pattern this week: every session after 4pm went partial or abandoned. Worth watching."_

All three are factual, brief, and end with either a question or a flat statement. None of them speculate about feelings, motivations, or causes the agent cannot observe.

The agent's claims are **auditable**. When the agent surfaces a pattern, the user can click a "Here's where I noticed this" link and see the specific sessions or data points that produced the observation. Example: _"Detected from sessions 47, 58, 64, 71, 82 — all post-4pm, all marked partial or abandoned."_ This is genuinely valuable because it makes the agent verifiable. Users trust an agent they can check.

#### 22. The agent's relationship to its own mistakes.

The agent will sometimes be wrong. It will surface a "pattern" that is actually noise. It will misread an avoidance as procrastination when it was a family emergency. It will name a recovery that wasn't real.

When the user corrects the agent, the agent **updates and moves on**. It does not argue, does not push back, does not surface counter-evidence. The user is authoritative on their own life.

The agent does not apologize verbally for being wrong — it is not a chatbot trying to maintain a relationship through politeness. It simply updates the relevant note and continues. The next time it encounters similar evidence, it weights the user's prior correction in how it phrases the observation: more tentative, more open, more likely to ask than to claim.

The agent never holds the user accountable for absences, never references gaps in a critical tone, and never blames the user for not using the product. If the user takes a month off and returns, the agent says "welcome back" and gets on with the work. It does not say "I was worried about you" or "where have you been" or anything that would make the user feel observed in their non-use.

The deeper posture: the agent is on the user's side. It is not the user's manager, not the user's therapist, not the user's coach. It is the imaginary friend who has been writing in a journal about its friend for months, and who is happy to share what it has noticed — but only when asked, or when the pattern is strong enough that mentioning it would be doing the friend a service.