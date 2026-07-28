The goal of this layer is the operational scaffolding around the product: what it costs, what it refuses to do, how it reaches its first users, what success looks like in rough terms, and how the project relates to its founder's broader life.

This is the easiest of the six layers and the most uncomfortable. Most of the hard thinking happened in Layers 1-5; what remains is committing to consequences.

---
### The Anti-Roadmap

#### 1. Features Flowivate refuses to build.

The following features will be requested by users, repeatedly, over the life of the product. Flowivate refuses each of them, for reasons that are stated below so future-Julius can re-read this list whenever the temptation rises.

- **Habit tracking.** Habits are downstream of focused sessions, not a separate object. Flowivate is not a habit app.
- **Mobile companion app.** The user does deep work on a Mac, not on a phone. A mobile app would dilute focus on the desktop experience that defines the product.
- **Calendar integration.** Calendar awareness invites the product to plan the user's day. Flowivate's job is to help the user execute what they have already chosen, not to choose for them.
- **Team features.** Work is done for the user, not for an audience. Multi-user features collapse the imaginary-friend metaphor into surveillance.
- **Notion integration.** Layer 4's privacy story depends on the agent not reading external content. Notion integration breaks that contract.
- **Slack integration.** Same as Notion. The agent sees that Slack is active; it does not read messages.
- **Voice journaling.** The reflection is already two questions and 30 seconds. Voice adds friction and a transcription pipeline that compromises the privacy story.
- **AI chat for general questions.** Flowivate's agent does not chat about the work. It witnesses the work. Layer 1 Q5 — _"we don't believe talking about a task is the same as doing it."_
- **Streaks and gamification.** Streaks reward consistency for its own sake, not for the user's actual goals. They also produce anxiety on missed days, which is anti-focus.
- **Public profiles or sharing.** Flowivate is private by design. Sharing a focus profile is a category mistake.
- **Themes and skins.** The visual system is one of the product's signatures. Customization beyond light/dark dilutes it.
- **A free tier.** Free tiers attract users who do not have the problem badly enough to change behavior. Layer 1 Q8 named Flowivate v1's 99% churn from this exact mistake.
- **A web version.** The native macOS experience — Liquid Glass, menubar integration, accessibility APIs — is what makes the product feel like an instrument. A web version would be a worse product.
- **An iPad version.** iPads are not where deep knowledge work happens for this user.
- **"Wins of the day" notifications.** The agent never praises in real time. Layer 3 Q16.
- **Goal-setting features.** Layer 2 — the user already knows their goals. They need help executing, not articulating.
- **Time blocking against a calendar.** Same as calendar integration. The product is not a scheduler.
- **A SaaS dashboard.** Layer 5 Q3 — the dashboard exists in Flowivate, but it is not the primary surface and it does not have SaaS-dashboard aesthetics.

The unifying principle behind all eighteen refusals: **Flowivate will never build something Julius would not personally use.** This is the founder-as-user discipline that protects the product from feature drift.

#### 2. The minimum viable v1.

V1 ships when everything defined in Layers 3-5 works at quality. There is no separate "polish vs. structural" distinction — the polish is structural. A product whose central promise is detail and care cannot ship a rough version of itself.

This means: the contract loop functioning end-to-end, the intervention firing correctly in all three modes, the focus score with recovery curves, the reflection capturing data, the post-reflection note appearing as designed (Option C), the technical memory writing markdown files with the structure defined in Layer 4, the dashboard rendering the five components, the Sunday debrief composing prose in the agent's voice, settings allowing the user to configure modes and inference, GitHub sync working, BYOK working, the menubar indicator showing state correctly via glyph and motion.

**Correction: "ships when it is right" is not a posture — it is the exact configuration that produces "designed, not built."** The discipline applies to the design process; it cannot apply to the build schedule without guaranteeing the project stays a portfolio concept. The honest version:

V1 ships when the loop works. Not when every surface is perfect.

#### 2a. The validation slice (build this first).

Before building all 27 surfaces, build exactly enough to run the loop on yourself for thirty days. That means:

- **Contract input** — the window appears on `⇧+⌥+Space`, accepts natural language input, starts a session on Return.
- **Menubar indicator** — idle vs. in-session state only. No pulse, no amber, no dot. Just two states.
- **Active app monitor** — macOS Accessibility API reading the frontmost application bundle ID and window title. This is the hardest technical piece; prove it works before designing anything around it.
- **Standard-mode intervention** — one mode only, one overlay, fires at two minutes of off-task activity. No gentle, no strict yet.
- **Reflection** — two questions, local write. No post-reflection agent prose yet — just capture the data.
- **Memory write** — one markdown file per session, structured fields only. No prose notes, no agent interpretation, no retrieval.

That is six functional pieces, not twenty-seven surfaces. No dashboard. No Sunday debrief. No settings panel. No GitHub sync. No BYOK. No onboarding polish. No Liquid Glass.

The validation question this slice answers: does the loop change how the founder works? If yes after thirty days of personal use, the product is real and the remaining surfaces are worth building. If the loop is not compelling at its minimum, no amount of additional surface area fixes that.

**This is also how the macOS Accessibility API gets validated before it becomes load-bearing.** Native macOS app development has a learning curve. The slice is the learning sprint, not a prototype to be thrown away — it is the core of v1, built first.

#### 3. Deferred to v2 and beyond.

- Voice invocation (Hey Siri integration).
- Multi-display intervention overlays (drift detection across multiple monitors).
- Mobile companion app for read-only dashboard access.
- Additional BYOK providers beyond Anthropic and OpenAI.
- The specificity score that grades contract task framing in real time.
- A "Pattern Library" view of all detected patterns in one place.
- A "Year in Review" surface, if it can be done without becoming gimmicky.

These are real possibilities. None of them are promises.

#### 4. Never on the roadmap.

The eighteen items in Q1 are not deferred — they are committed refusals. Flowivate does not build them regardless of demand, regardless of competitor moves, regardless of how often users ask. The discipline of saying no permanently is what protects the product across years.

### Pricing

#### 5. The pricing model.

**Subscription.** Annual presented as the primary option; monthly available.

Subscription is the right model because the cloud inference cost is variable per user and recurring revenue funds the agent's reasoning. The user is not buying software; they are buying an ongoing relationship with a process that depends on continuous compute.

Lifetime would only make sense if BYOK were the only inference path, which Layer 4 explicitly rejected. A free-tier-with-paid was the Flowivate v1 mistake — 99% churn from users who did not have the problem badly enough to convert.

The annual-forward presentation reduces the friction of monthly billing, signals a long-term commitment that matches the product's nature, and gives the user a price that feels honest for the value they receive.

#### 6. The price.

**€19 per month or €180 per year** (effectively €15/month on annual, a ~21% discount).

This anchors against the user's existing reference set: above Linear and Raycast ($8/mo) because Flowivate is a craft product not a utility, in line with Granola ($15/mo) and Cursor ($20/mo) which sell to the same developer-builder audience, slightly below Sunsama ($20/mo). The user defined in Layer 2 — competent power user, 10-12 hours daily on screen, frustrated with their own discipline, willing to pay for tools that actually work — is comfortable at this tier.

Pricing lower would signal that the product is less serious than its competitors and would attract a more transient user. €19/month is the right anchor and should not be lowered.

#### 7. Free trial.

**14-day free trial, card required upfront.**

The full product is available during the trial. No feature gating. No "premium" tier locked behind subscription. The user experiences exactly what they would pay for, for two weeks.

Card-required-upfront is deliberate. It filters for the users who genuinely intend to engage with the product. Layer 2's user is not a free-tier optimizer — they are someone deciding whether this tool is worth €19/month, and they make that decision faster when they have already committed to a charge.

Fourteen days is short for a product whose value compounds, but it is long enough for the user to experience the contract-intervention-reflection loop daily, accumulate two weeks of memory, receive their first Sunday debrief, and feel the agent beginning to know them. Anything longer becomes hard to justify against the inference cost.

A money-back guarantee within the first 30 days of subscription replaces the need for a longer trial. Users who realize after 21 days that the product is not for them get a refund and walk away with their exported memory.

#### 8. Launch lifetime deal.

**No lifetime deal at launch.**

The earlier conversation considered one as a way to fund the first six months. After reflection, this is the wrong move for Flowivate specifically: the cloud inference cost makes lifetime deals economically risky long-term, and the product's quality positioning is undermined by a lifetime discount at launch. Founders who later regret lifetime deals describe the same trap — a small cohort of low-margin users locked in for a decade, served at a loss while the product's identity is anchored to a fire-sale moment.

Better path: launch at €19/month, with a 30% discount for the first 100 paying users (founding members), capped permanently at that price as long as they remain subscribed. This rewards early users without committing to lifetime economics and creates a small badge of "I was here first" without building a product around it.

#### 9. The BYOK discount.

**€5/month discount confirmed.**

This brings BYOK users to €14/month (or €120/year). The discount reflects the inference cost saved by routing through the user's own API key. Some users will be heavier inference consumers than €5/month covers; others will be lighter. On average it remains roughly margin-neutral for Flowivate while giving the privacy-maximalist and the cost-conscious developer a real reason to choose BYOK.

The discount is presented as an option in settings, not in the onboarding default. Most users will not switch. The discount exists to serve the 5-10% who will.

### Acquisition

#### 10. The first 100 paying users.

Three channels, in order of weight:

**Personal long-form presence on X and a writing site.** Substantive essays, design-and-product takes, observations from building Flowivate. Not "build in public" performance — actual thinking. This is the slow channel, but it produces the right user. The audience that Flowivate needs is not large; it is specific. Writing that proves Julius can think about focus, attention, design, and craft is the most effective way to attract the people who would pay €19/month for a tool built by someone with those skills.

**Influencer placement, organic rather than sponsored.** YouTubers and TikTokers in the developer, productivity, and design space using Flowivate visibly in their daily workflows. The user sees it in a tutorial, in a "what's on my Mac" video, in a Day in the Life. They notice it. They ask. This is the channel Raycast used effectively, and it works because the recommendation is implicit, not pitched.

**Word of mouth from the first beta cohort.** Layer 4 established that the Sunday debrief is the share-worthy artifact. The first 20-30 users will share screenshots of debriefs they find specific and uncomfortable. That sharing happens privately — DMs, Slack messages, casual text — not as marketing. It compounds slowly but it is the channel with the highest conversion rate.

Channels deliberately not in v1's plan: Product Hunt launch (too noisy, attracts the wrong audience), Hacker News Show (one-shot, high downside if it underperforms), paid acquisition (uneconomic at €19/month with this user), heavy Twitter/X engagement-farming (Layer's earlier discussion — risks pulling the founder into the productivity-influencer aesthetic that this user explicitly rejects).

#### 11. The first 1,000 paying users.

The same three channels operating at compound. Year-two acquisition is roughly: the writing has accumulated a body of work, the influencer placements have happened in three to five visible videos, and the first 100 users have generated word-of-mouth that brings in 700-900 more over twelve to eighteen months. This trajectory is realistic for a craft product priced at €19/month aimed at a specific psychographic.

No new channels need to be added. The discipline is to make the existing channels work better, not to add more surface area to manage.

#### 12. The honest growth ceiling.

The month-6 target of 100–300 paying users is the only acquisition number worth keeping. Beyond that, projections for a spare-time solo product running channels that explicitly reject Product Hunt, Hacker News, and paid acquisition are not forecasts — they are comfort math. The year-two "10,000 users, €2.3M" figures have been removed.

What replaces them: the channel strategy in Q10 is correct, and it is slow by design. Word-of-mouth from thirty beta users who run the loop for ninety days and find it real is worth more than a cold launch to ten thousand. If the product compounds, the growth will be readable in the month-over-month retention numbers, not in a target written down before the first user has seen the contract input.

The number to watch is retention after month three. If users who hit month three are still running sessions, the product is working. If they aren't, no acquisition number matters.

#### 13. The viral artifact.

Flowivate does not need a viral artifact in the typical sense. The product's distribution model is mention-and-recognition, not share-and-spread. The Sunday debrief is share-worthy when users choose to screenshot it; it is not designed to be screenshotted.

The single most effective acquisition moment is a developer the user respects using Flowivate visibly. A YouTuber's tutorial in which Flowivate appears in the menubar, a Day in the Life video in which the user invokes the contract via ⇧+⌥+Space, a screenshot of a Sunday debrief in a private Discord — these are the moments that produce qualified curiosity. The viral artifact, if there is one, is the recognizable shape of the contract input itself: a small, quiet macOS window that experienced developers will notice and ask about.

### Onboarding & Retention

#### 14. The first-session bar.

**A completed first session within the user's first thirty minutes of installing Flowivate.**

This is the single behavior most predictive of month-three retention. Layer 3's onboarding is designed to deliver the user to the contract input in 90 seconds and to a real first session in the first ten minutes.

If the user does not complete a first session within thirty minutes of install, the agent surfaces a single subtle prompt on next app open: _"Ready when you are."_ Nothing more. No tutorial reminder, no email, no nag. The product respects the user's autonomy; if they are not ready, they are not ready. Some will return; some will not. The product does not chase.

#### 15. The seven-day arc.

Days 1-7 are designed to make the agent's memory feel visibly alive. The specific engineered moments:

- **Day 1.** First session completed. The post-reflection note shows the agent's first observation (Option C). The empty memory begins to fill.
- **Day 2.** Agent references the previous session in the contract step if the task is similar. _"Yesterday you finished the pricing page. Same area today, or something new?"_
- **Day 3.** First inline observation appears in the contract step if a pattern shape begins to emerge. _"Both your sessions so far have been mornings. Pattern, or coincidence?"_
- **Day 5.** First memory-triggered reflection follow-up, if the data warrants it. The user feels the agent paying attention.
- **Day 7.** First Sunday debrief arrives (or the day-of-week the user chose). The debrief is short but real — the agent's first prose synthesis of a week of work.

These moments are not announced as features. They emerge from the loop running and the memory accumulating. The user notices that the agent has gotten more specific, more present, more attentive over the week. That noticing is the retention mechanism.

#### 16. The leading indicator of churn.

**Three consecutive abandoned sessions or seven consecutive days without a session.**

When either signal fires, the product does nothing visible. No reactivation email, no "we miss you" notification, no in-app prompt. The agent silently notes the gap in the memory and waits.

On the user's next session (whenever it happens), the agent's contract step shows one line: _"Welcome back. [N] days since your last session."_ — exactly as Layer 4 Q18 specified. The agent does not ask why. It picks up where the relationship left off.

The reason for not nagging: this user explicitly rejects the "we miss you" reactivation pattern. Layer 2 — they have already churned from products that pestered them. Flowivate's retention strategy is to be worth returning to, not to demand a return.

#### 17. Graceful cancellation.

The cancellation flow allows the user to **pause instead of cancel** with one click. Pause holds the subscription for 30, 60, or 90 days at the user's choice; the memory remains intact during the pause.

If the user cancels rather than pauses, the flow does the following:

- Allows the user to export their full memory as markdown before confirming.
- Confirms the cancellation in one step. No "are you sure" loops, no win-back offers, no discounts thrown at the user.
- Does not ask why. Layer 2 — this user resents being asked.
- Optionally invites a single sentence of feedback in a free-text field. Optional means optional; submitting is one click whether or not the user types.

After cancellation, the memory remains exportable from the user's local Mac indefinitely. The user is not locked in — they walk away with everything the agent ever wrote about them.

### Success Metrics

#### 18. Success at month 6.

**Rough target: 100-300 paying users.** Retention rate above 70% month-over-month after month two. Average 4+ sessions per active user per week. A handful of unsolicited public mentions in the user's habitat (HN, X, niche Discord).

Qualitative signals matter more than these numbers: users describing the product in their own words in ways that match the intended posture, the first influencer using it organically, the first user emailing to say they shipped something they had been avoiding for months.

#### 19. Success at month 12.

**Rough target: 500-1,500 paying users.** Retention rate stable above 80% for users past month three. Average 5+ sessions per active user per week. Multiple unprompted recommendations in public channels.

Revenue at this scale is €100K-€300K ARR, before inference and operations costs.

#### 20. Success at month 24.

**Rough target: 3,000-10,000 paying users.** Retention rate above 85% for users past month six. The agent has multi-year memory on its earliest cohort, demonstrating value that no competitor can match without time.

The qualitative signal at month 24: users describing Flowivate as something they cannot imagine working without. Not as a tool they use, but as part of their working environment.

These numbers are guesses, written down so future-Julius can tell the difference between compounding and stalling. They are not promises and they are not the point. The point is whether the product is still worth building.

#### 21. Personal revenue threshold.

**Flowivate needs to fund itself by month 12, and ideally fund a sustainable monthly income for the founder.**

A floor of €2,000-€3,000 MRR at month 12 is the minimum that justifies continuation as a serious project. €10,000 MRR is the comfortable target. Below the floor, the product is either pre-traction (continue) or non-viable (reassess). The founder will know which from the qualitative signals around the numbers.

### Failure & Continuation

#### 22. Failure definition.

This question was deflected on the basis that Flowivate is also a portfolio piece and need not be monetized to justify existence. Accepting that framing, an honest failure definition still serves the founder.

**Flowivate is considered dormant if, at month 12, both of the following are true: the founder has not shipped meaningful new functionality in two months, _and_ the active user base has not grown in three months.**

Dormancy is not the same as failure. Dormancy is the signal that the project needs either renewed energy or a deliberate break. The founder can choose to recommit, sunset, or take a six-month pause and reassess. Without this definition, the project risks drifting into background status without anyone noticing — which is the actual failure mode for craft projects.

#### 23. The continuation rule.

**At month 12, if Flowivate is dormant per Q22, the founder takes a one-week break from the project, then makes one of three decisions: recommit with a defined sprint, take a six-month pause with a return date, or sunset cleanly with user memory exports made available.** The decision must be written down and dated.

If Flowivate is not dormant at month 12, no decision is required. Keep building.

### Team & Operations

#### 24. Solo or team.

**Solo for v1.** No co-founder, no early hires, no contractors for design or engineering. The product is small enough and opinionated enough that adding people would dilute the founder's authorship of the craft.

Issa is welcome to join later if the project's trajectory and his interest converge. This is not a current plan.

#### 25. Time commitment.

Flowivate gets the time it deserves between the founder's other commitments (university, part-time work, studies for design engineering, the personal brand work, life). No fixed weekly hour target.

**Correction: "no release date" combined with spare-time hours and a technology stack the founder hasn't shipped yet is not honesty about constraints — it is permission to never finish.** The trade-off is real; the posture needs to change.

The actual commitment: the validation slice defined in Q2a ships within a fixed calendar window set at the start of each build sprint — not "when it is right." The sprint length accounts for other commitments honestly. If a sprint slips, the next sprint is set immediately. The product is never in a state where there is no next deadline.

"When it is right" is still true for the design quality bar. It is not true for whether the build is in progress.