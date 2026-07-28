
---

#### What the memory contains

1. After a single session, the agent has: the contract (task, project, duration estimate, mode), the actual session data (start time, end time, completion state, focus score, intervention fired or not, renegotiations), and the reflection (yes/partial/no, optional free text). Describe what the agent does with this — what does it write into its model? A line? A structured record? Both? Be concrete: write the actual lines or fields the agent would produce after one real session of yours.

After a single session, the agent should make a structured record of the session with all its valuable information.  For example, the user types "design the hero of my landing page in 2h 25 minutes" into the contract as the task, he ends up being super productive with no distractions and stays on his Figma file the whole session". At the end of the session, and during the reflection, he says that he finished what he wanted to do so his score is 100% for a perfect workflow. the agent will then pick up all of this data from everything. I am not sure of how i will do this technically yet but i would need the cheapest, most scalable way to store the data over a long period of time.

2. Same question, scaled up. Ten sessions of data gives the agent enough to start noticing weak patterns. Describe what the model looks like at this stage — what new things are tracked that didn't exist after one session? What's the first real pattern the agent might notice?

I think that the agent should continuously compare sessions of data and have some sort of streak going where if the agent finds matches in the previous days, it should add relevancy (unsure of the technical aspect of what I want exactly so will need suggestions). To make this scalable, the agent should be able to make decisions in what is more important (for example during a session, the user uses the verb "start" and a few sessions later in the reflection mentions that he finished the task) and remove what is obsolete in relevancy.

3. By this point the model is meaningfully predictive. The agent has weeks of data, recurring projects, completion rates by time of day, drift patterns by app, recovery curves. Describe the model at this depth — what does it now know that no productivity tool currently knows about a user?

At this depth, the model has a very insightful and in-depth knowledge about the user's productivity, their work habits, time that they start tasks, how much they rely on Flowivate (important for internal product improvement). No other tool has such detailed long term value about the user .

4. Three options, and you need to commit to one or a hybrid:

- **Pure structured profile** — fields, values, counts, dates, percentages. Easy to query, easy to update, hard to feel alive.
- **Pure free-form notes** — the agent writes prose about the user, like a journal. Feels alive, hard to query, depends entirely on LLM consistency.
- **Hybrid** — structured fields for quantitative data (completion counts, focus scores, time-of-day patterns) plus a free-form notes section the agent maintains in prose.

I think the option that matches the most the quantity, detail and scalability of the data is the hybrid option. Indeed, some fields will be repetitive and very easy to query into respective fields including the free forms in the contract and the reflection. From that, the LLM can make an overview of the session and then as discussed prior compare with other sessions for relevancy and grow its knowledge as time goes on about the user.

5. The user must be able to see the memory. This is not optional — it's part of the trust contract. Where does the memory live in the product? Is it a dedicated screen, accessible from the menubar, a section of the main app window, available only on Sunday debriefs? When does the user typically encounter it, and when is it surfaced involuntarily (e.g., the post-reflection Option C moment we already designed)?

The memory should definitely be shaped like ChatGPT's memory system where there is a section dedicated for all of the memories of the user that the LLM has gathered from chat conversations. The memories should be formatted to be easily navigable by the user, with markdown maybe and hyperlinks between ideas (something like the Obsidian "constellation" system). There should be subtle notifications or tips that appear that show that information provided by the user was added to the memory AND during the post-reflection Option C moment we already discussed.

6. The user must be able to edit or correct the agent's notes. Two questions:

What can the user edit? (Inline corrections to the agent's prose, structured fields, both, neither?) And what is the user's _posture_ toward the memory when they edit it — are they correcting factual mistakes ("no, I wasn't avoiding the deck, I had a family emergency"), or are they shaping the agent's interpretation of themselves over time?

What happens when the user corrects the agent in a way the agent later sees contradicting evidence for? Does the agent push back, accept the correction silently, or surface the contradiction in a debrief?

For the first question, since we mentioned that the memory would be extremely organised and easy to index for the user through markdown and Obsidian-like organisation., the user can make edits in the memory layer directly and the agent can identify diffs in the memory files. The user decides what the memory should have and can correct factual mistakes or improve the agent's interpretation of themselves. 

For the second question, I am unsure how the agent should behave upon contradicting evidence and need guidance.

#### What the memory looks for

7. List 7-10 specific patterns you want the agent to look for across sessions. These are the things that, when surfaced in the Sunday debrief or the post-reflection moment, will feel like the agent is genuinely paying attention. Examples to seed your thinking — _not_ an exhaustive list, you should add your own:

- Consistent over- or under-estimation of session duration.
- Completion rate by time of day.
- Drift to specific apps clustered around specific tasks.
- Avoidance — a task title that has been started and abandoned multiple times.
- Productivity by day of week.
- Recovery patterns after a partial or abandoned session.
- Type of project being completed / what type of brain function needed (learning, developing, brainstorming) for that project
- The amount of time dedicated to different projects, re-evaluating priority depending on estimated complexity of the task
- Workflows between apps used to complete a task (ex: Ghostty + Zen + VSCode)

8. This is as important as what it does infer. The agent should not speculate about: What categories of inference are off-limits, and why? 

The user's mental health, relationships, motivations beyond work patterns, anything that isn't directly observable from the session data. 

9. A pattern detected after one occurrence is noise. A pattern detected after twenty is fact. Where's the threshold for surfacing? Does the agent need N occurrences? A statistical confidence? A user's prior interest? Be specific about the rule. There's also the question of _severity_ — a small pattern noticed early (the user always renegotiates on Mondays) might be worth mentioning earlier than a comfortable one noticed later (the user is consistent in the mornings). What's the agent's calibration here?

I believe that the agent needs N occurrences, a statistical confidence OR a user's prior interest to detect a pattern, all 3 of these events are relevant and should be caught on by the agent, fed to the memory. I do agree with the second part of the question completely with small flags that can affect long term that should be notified. 

#### How memory is used in the loop

10. We already partially defined this in Layer 3 Q27 — three surgical rules (recurring task, unusual timing, returning after a gap). Confirm or revise. Anything else memory should do at contract time, given how rich it becomes after 100 sessions?

Yes i confirm this logic as it becomes extremely valuable after N amount of sessions and helps the user get working faster and in a more targeted way. I think what was suggested already is perfect.

11. Should the intervention copy use memory? In Layer 3 we wrote generic intervention copy: _"You drifted to Twitter. Back to the deck?"_ Should it become _"You drifted to Twitter — third time this week"_ at session 30? Or does referencing memory in interventions cross a line into nagging? Consider both: the intervention copy becoming more specific over time, and the _rule for when_ the agent escalates a memory reference inside a real-time intervention.

I believe that personalisation is definitely something we should consider in Flowivate to make the user directly feel targeted by the intervention copy and realise that his own habits are not adapted and need to slowly be stopped. However, as the question mentions, this shouldn't feel like nagging or being told off depending on the level of intensity of the focus session and should be worded in a way that nudges the user to return back to their task. 

12. When the user submits a reflection, can the agent reference the memory in its single optional follow-up question? (Layer 3 Q25.) We allowed this for "recurring pattern" cases. Expand: what are the rules for when memory shows up in the reflection moment, and what's the upper limit so the reflection doesn't feel like a quiz?

I am unsure what the question means here.

13. We already wrote the sample debrief in Layer 3 Q28. The debrief is the most memory-heavy moment in the product. Specifically: how many patterns does the agent surface per debrief? Three? Five? One per week? What's the rule for picking which patterns make it in, given that after 100 sessions the agent will have detected far more patterns than it should surface?

I believe that we need to train the LLM to be able to judge what is relevant and what isn't, while also being able to evolve and get rid of old, outdated data. For example if the user in January has the habit of doing tasks at 8am and does that consistently for 3 months, but then in March he starts doing his tasks at 6pm instead (maybe he goes to work), then the model should be able to adapt to this new habit and get rid of the old one.

---

#### Memory architecture

14. Three options:

- **Fully local** — all memory lives on the user's Mac, encrypted at rest, never leaves the device.
- **Local with optional cloud sync** — user can opt in to cloud sync (for multi-device, backup, or recovery), with full encryption.
- **Cloud-first with local cache** — memory lives in your servers with end-to-end encryption.

Pick one. This is the privacy story's foundation and the answer is almost certainly fully local for v1, but defend the choice and describe what the user sees about it in onboarding.

I believe that our moat is full privacy thus making the model fully local is the best idea. HOWEVER, and what I've been doing with Obsidian is, on here, there is a plugin made by a user called Git that can be configured to push Vaults to Github either periodically or through the user's terminal. This is a great way to store data if wanted by the user which allows them to have full access over their data while being privacy-first.

#### 15. What the LLM sees vs. what stays local.

When the agent uses memory to do something (parse a contract, generate a debrief, write a follow-up question), the LLM needs the relevant memory context. Three options:

- **Local LLM only** — Apple Intelligence or a small open-weight model runs entirely on-device. The memory never leaves the Mac.
- **Cloud LLM with local memory** — memory stays on device, but relevant slices are sent to a cloud model (Claude/GPT) for each call.
- **User's own key** — the user provides an API key for Claude or OpenAI and pays their own inference. Memory is sent to whoever they chose.

Pick a primary option for v1 and describe the tradeoffs. This is a real technical and product decision — quality, cost, privacy, and pricing all flex on it.

I believe that we should opt-in for a local LLM or the user's own key. However I am not sure on this approach as this does cause the user having to pay the subscription on top of the model usage. It's difficult to estimate as some users will give more memory data than others, some more complex and I really want it to be homogeneous and of quality as well as preserve speed to make the experience as seamless as possible for users.

16. The user can export their memory. In what format — JSON, Markdown, plain text, all? Why does export matter to this user? What's the implicit promise being made?

Users can definitely export their memory and I think it should be in Markdown for readability and navigation purposes. Exporting the data allows the user to change computers as they wish and as mentioned before, we will have the Github method as well.

17. The user can reset or delete their memory. Two scenarios:

- **Full reset** — user wants to start over. What happens to past sessions? Are they deleted, or kept but unused for inference?
- **Selective deletion** — user wants to remove a specific session or pattern. Is this allowed? If yes, how does the user invoke it without it becoming a tedious moderation chore?

What's the cost to the user of resetting? They lose the compound — does the agent warn them, or accept silently?

As mentioned before, by having Markdown files in a structure similar to Obsidian's, this allows the user to change and delete data freely as it goes. While the user can delete/modify data freely, I am still wondering how the model will be able to make up his mind on the user if the data is biased by the editing. I guess most users won't modify content regularly, but what if they do by scare of failure and being corrected ? This is something I do not want happening in my app so I need a solution. Resetting should wipe completely everything and users should be warned in a prominent way to alert the user that the action they're taking is irreversible and that the agent will forget absolutely everything unless data is imported.

18. The user takes a two-week vacation, then comes back. How does the agent acknowledge the gap?

Three sub-cases worth thinking through: a planned break (user told the agent in advance), an unplanned gap (life happened), a relapse-and-return (user gave up for a month and is coming back). Does the agent treat them differently? Should the agent ever say "welcome back"?

I am unsure at the moment of how the agent should handle that but I guess it has access to the screen time on their computer so it should be able to tell. Yeah, but to contradict this, what if the user is on vacation watching movies, this shouldn't count for the agent and this is a breach of privacy if the user constantly watches the user's actions so this is not allowed. Maybe the agent should go from the idea that when the user is working, they always make a task up and should only gather data from that, not from blanks. But maybe the user won't have the habit when starting out of making a task for every single thing they do. The agent should definitely never treat them differently and start acting strict or something if they do give up for a month and come back. Welcome back is definitely a way to greet the user that should be kept and used without having to be LLM usage and can just be used as static copy.

19. After two years of use, the memory is huge. Does it ever get pruned, summarised, or compressed?

Three approaches:

- **Append-only forever.** Every session is retained in full detail indefinitely.
- **Rolling detail, summarised history.** Recent sessions in full, older sessions summarised into prose monthly/quarterly recaps.
- **User-controlled pruning.** The user decides what gets summarised and when.

Pick one. The choice has real implications: storage size, LLM context window costs, what the agent "remembers" about year-one when the user is in year three, and whether the agent's understanding of the user becomes outdated as the user changes.

As mentioned before, in the long term the agent should be able to pick up new trends and get rid of the old ones to avoid full detail that would take up immense amounts of storage especially if the user uses Flowivate heavily. I like the idea of rolling detail and summarised history. I believe that the memory should just be Markdown files and not be part of the LLM's context window. When a user starts a session, the files should be so well structured that the agent doesn't actually remember anything but should instead act like it by indexing the necessary files and finding the information about the user. I don't know if this is possible but it would definitely reduce costs significantly.

---

#### The trust contract

20. We already chose Option C for the post-reflection moment — the agent shows one line it just added to its notes. Imagine the user, on their hundredth day, opens up the full memory view to read everything the agent has written about them. What do they see? Describe the structure, the voice, the length, and what the user does with it. This question is asking you to design the artifact that is the memory, not just the system. The artifact is what the user lives with.

I believe that there should be a difference where all of the memory of the user is stored, indexed into folders and files in a very structured way that is mostly used by the agent to index and find. And then where the user actually, "on the hundredth day", goes to find out what the model thinks of them and their actual metrics over time. This second place should be a more brief and visual overview that can be understood by non-technicals, some sort of minimalist dashboard that shows different actually useful metrics and habits the model has picked up.

21. When the agent talks about what it has noticed, what tone does it use? Three options:

- **Detective** — "I've noticed something." Confident, observational, slightly authoritative.
- **Friend** — "Hey, this might be a pattern." Tentative, relational, soft.
- **Witness** — "Here's what happened." Factual, dry, undecided about meaning.

Pick one and write three example sentences the agent might say in different surfaces (intervention, reflection, debrief). This is the agent's _voice_, and it has to be consistent across the product.

"Hey, I've noticed that you work significantly better when you focus on development in the early morning rather than in the evening." What would be really good is if you could see "Here's proof" or something that links to actual proof of the user working harder in those intervals COMPARED to the other interval OVER TIME. I don't know if this is overkill and actually possible to implement.

22. The agent will sometimes be wrong. It will surface a "pattern" that's actually noise. It will misread an avoidance as procrastination when it was a family emergency. It will name a recovery that wasn't real. How does the agent handle being corrected? How does it talk about its own uncertainty? When does it apologise, when does it just update, when does it push back?

The agent will definitely make errors over time and it should acknowledge it as constructive criticism, the user is always right I believe. This won't be a chatbot like interaction (I don't think ?) so it won't need to be apologetic but I could be wrong and in that case yes it should update after apologising. The agent should definitely NOT argue and push back against the user, especially if the user is absent for a period of time and should not hold the user accountable for it. 