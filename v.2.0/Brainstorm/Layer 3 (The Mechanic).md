
---
#### The Contract

1. When the user invokes Flowivate to start a session, what exactly do they see in the first second? Describe the surface in words — not the design, the _content_. Is there a single field, multiple fields, a conversational prompt? What's the cursor focused on by default? What's the visual hierarchy?

When the user invokes Flowivate to start a new session, the first thing that they see is a conversational input with multiple drop-downs. The input has the placeholder "What would you like to get done right now ?" and the drop-downs are Duration (if the user wants to set that, set to None by default but can also set by the input itself, the LLM can recognise that), Project (users can separate their tasks into different Subfolders like Design, GTM for example and this is great for the LLM agent). Maybe the user can choose a certain theme with ambient sounds or something. Nothing else should populate this first screen to avoid friction as much as possible. Unsure of what else to add but maybe 3 different modes like Opal has where you choose the intensity of the session (no nudging at all, partial nudge and auto app closing for super deep focus for ex). 

2. What does the user input, in what format? Pure natural language ("finish the pricing slide of the deck, 45 minutes"), structured fields (task, duration, files), or a hybrid? Defend your choice — the input format shapes the user's mental model of what they're committing to.

The user inputs their task in pure natural language to make the contract last as little time as possible to push the user to actually execute the task. Flowivate's contract should not feel like a chore by being long with multiple onboarding questions or too complex to complete to avoid 'straining' the user's brain prior to getting work done.

3. What does the agent do with that input behind the scenes? Walk through the parsing: from the user's sentence to the structured representation the agent will use during the session. What does it extract — task name, duration, files or apps referenced, anything else?

So first of all, the agent retrieves the info from the user's input. He starts the parsing process by grabbing the project, the task "title", the duration and files / apps referenced, intensity chosen to get a global understanding of the task at hand. Behind the scenes he makes the link with the user's context history that was provided during onboarding and if applicable, his past executed tasks. He tries to make links and understand how to help the user during this task execution (for example, knowing what apps to block). 

4. Does the agent confirm back to the user before starting? In what form — a text summary, a single sentence, a question? Or does the session just start? Confirmation creates a moment of "is this really what I'm committing to?" — defend whether you want that friction or not.

I don't think the agent needs to confirm to the user before starting. The user doesn't need to be reminded or questioned about the task at hand, they know how to work, just not efficiently. This kind of constructive criticism can figure in the weekly Sunday recap where the agent lightly suggests sharpening tasks if too broad for example but during the week, the agent learns through its omnipresence. Maybe just a toast notification to confirm that the task has been started and then the app should close ITSELF and appear in the menubar, our purpose is to remove as much friction as possible for the user and just push him to get started.

5. What clarifying questions can the agent ask, and what are its rules for asking them? When is asking appropriate (genuine ambiguity) versus when is it annoying (overcautious)? Give two or three examples of inputs where the agent should ask, and two or three where it should just start.

I do not think the agent should ask any clarifying questions. I had this idea of giving a real-time score of accuracy that updates before the user submits their query but i am unsure as this may be friction that i do not want but would be a great addition to make the user actually think before starting on what they want to do precisely. If the user says "I will redesign the landing page", this would be an average-high score as it does say that the user is working on a website however doesn't say which part of the landing page he would like to change (i don't think that the user needs to say for WHAT company, or WHY they want to work on this unless they want to themselves, and this shouldn't affect the specificity score). A high score would be "I am going to outreach to 20 leads by sending them each personalised emails for the next hour" which is just the amount of detail that is needed for the user to know exactly what they have to do. On a side note, I should research scientific papers on what makes a perfectly structured task / to do list item to understand in depth how the score should be affected (if being implemented).

6. Can the user attach context — a Notion link, a Figma file, a doc, a calendar event — to the session? If yes, what does the agent use that context for during the session, given your privacy posture (the agent doesn't read file contents)? If no, why not? This question is genuinely important because it forces you to decide what "the agent knows about this session" really means in practice.

Maybe the user should be allowed to tell us what integrations he allows Flowivate to have access to during sessions. This would be made very prominent and easy to toggle to ensure privacy-first. From that the interface would adapt to allow the user to DECIDE what he wants. Think Raycast where when you accept adding "apps" like Notion, VSCode, it has multiple shortcuts. Here, for Flowivate the only needed actions would be BRIEFLY overviewing what the user wants to do to feed its context and maybe if necessary close apps. But now I am thinking, what about web browsing where the actual distractions occur ? Unless the user is using distracting apps like social mac apps (Discord or Slack) or gaming apps (Roblox). This is something that I need to revisit.

#### The Intervention

1. What signals does the agent watch during a session? List them concretely — active window title, active application, time on app, idle state, app-switching frequency, anything else. For each, note whether the agent watches it constantly or only at intervals.

During a session the agent watches the active window title / application continuously as well as the time on the app and any idle states that may occur. App switching frequency is an interesting metric. Most of the signals are constantly tracked throughout the session and then fed. As discussed before, if the user allows certain apps to be tracked, when active the agent can analyse what is being done (not in detail and depending on how much info is provided by the app). Maybe track keyboard WPM and mouse clicks that can be analysed over time to improve data received.

2. For each signal, what threshold or pattern triggers an intervention? Be specific — not "drift" but the actual rule. Use the framing we agreed on earlier: signals of _psychological exit_ (engaged elsewhere) rather than time-on-app thresholds.

I don't think rapid app switching is a sign of lack of productivity or focus as the user may need 2 apps and have a viewport only big enough to view one. Maybe slower WPM / clicks than average on an elongated period of time could be a pattern that triggers an intervention. It's complicated to know if the user is being productive by just analysing the active app title. But screen-recording is not the answer I believe (maybe I stand corrected?) but I am unsure for the moment on what other signals should trigger an intervention apart from applications that are deemed irrelevant by the agent (example: The user opens Roblox when they should be developing a CRM on Attio). 

3. What signals does the agent deliberately _not_ act on, even though it could? This is as important as what it does act on. (Example: brief lookups, idle pauses, single tab switches.)

I think that idle pauses that are not elongated should not be picked up by the agent as the user may just be AFK which would be annoying for them if just misc. Tab switches I am debating as as a highly productive user myself, I do a lot of command + tab on my keyboard to switch between Obsidian, VSCode and Zen (my browser) when working and I do it a lot so I don't know if that's a good metric. I am unsure what else and need to reflect on it. 

4. When an intervention fires, what does the user experience? Visually, audibly, where on the screen, with what tone of language. Describe the actual content of the first intervention — the words the agent uses.

I think the user should experience a subtle notification sound (not something annoying like a generic iPhone ping that can trigger some users) but something zen-related and highly versatile through different sound choices the user can pick from. Although unsure at the moment of what can be done with MacOS apps, I think a sort of toast notification, designed to not look exactly like a normal notification, should appear on the user's screen telling him that he is drifting away from the task at hand in a nice and supportive tone if he chooses level 2 / 3 from the Contract options or a bit more firm for the deep focus level and maybe a countdown to closing the distraction ? Unsure on the actual copy.

5. What are the user's options when intervened? Describe each action in words and what it does behaviourally to the session.

The user's options should depend on the choice they make during the contract. The first tier should have no intervention since the agent is just silently listening through the task (default state). For the second level, the agent suggests that the user returns back to their task to not lose their focus level in a supportive manner. On a side note, maybe having a focus score at the end of the session that auto-updates during the session depending on the user's focus would be a great metric to add. Coupled with time fetching for tasks, this would be a great long-term data metric that could be very helpful for the user. Finally, for the third level that requires laser focus, when the agent notices a threat to the user's focus score (but this should only be for certainties like a game being opened during a session), it should notify the user that the app is being closed and execute (although unsure of this). Otherwise, it should be more firm in its replies and return the user to an active tab related to the task at hand (also unsure here) ?

7. What is "renegotiation" in detail? What can the user change mid-session (task, duration, context), what can't they change, and what happens to the agent's understanding of the session afterward? Does a renegotiated session count as a completion or as something else in the reflection?

During the session, the user can "renegotiate" different metrics such as task, duration, context. Changing these metrics should affect the user's focus score for the session and if the task is changed for example, the report should return a divided task into 2 different subtasks that the agent assesses separately. The user can obviously halt the session at any given time (the focus score shouldn't be reduced but instead halted in this case). Misc changes should not affect the focus score such as changing the ambient sounds or the project. 

8. What happens if the user ignores the intervention? Does the agent escalate, give up, end the session, mark it differently in memory? Be specific about the escalation logic — earlier we agreed on at most one intervention per session, but define what "ignored" means and what the agent does next.

The reaction of the agent if the user ignores the intervention depends again on the level of focus that the user has picked during the contract. I suggested taking action in the utmost level of focus but if the user decides to go back to the app after intervention, the focus score should be affected drastically (however this should be taken with caution as the LLM can make mistakes which would lead to inaccurate data so edge cases need to be taken into account). For the other 2 levels, maybe an increase in tone (without spamming the user) to guide them back to the task at hand. Something really good to do would be (using the contract's context), give them a small subtask of the task to get them doing (however, the agent doesn't know of the state of completion of the task so maybe something else should be done here ?).

9. Can the user configure intervention level per session, globally, or both? What are the modes (we sketched "silent witness," "tap me once," "strict" earlier) — describe what each one does behaviourally? Which is the default ? 

This has been discussed thoroughly in previous questions so I will not come back to it.

10. Does the agent intervene differently if the user is doing well in the session vs. struggling? Should the agent praise good behavior, stay neutral, or only act on negative patterns?

The issue here is that the agent doesn't see the user's screen so cannot debate on the user's efficiency DURING the session and instead relies on feedback post-session during the reflection stage. I would say praising the user is good however I don't think it is appropriate here, for our use-case and our users themselves who are power workers and don't need to be told what they're doing good or not so good. We don't want the user getting the feeling that they're being supervised by their boss for example. 

#### The Session Itself

17. What does the user see during an active session? Is there a persistent UI element (timer, status bar, overlay)? Is the main app window open or closed? What's the menubar showing?

During the active session, the main app window should close like Raycast and not appear at the bottom (its appearance is triggered by the keyboard shortcut just like Raycast). I feel like an overlay would be nice but something very subtle and definitely not distracting. Its design needs to be VERY clean and minimalist to avoid any distraction. The menubar should have Flowivate's logo and when clicked have access to different features that I haven't entirely figured out but essentially the session timer with some sort of active status maybe and options to change different things.

18. Can the user pause a session? Under what conditions? What does pause actually mean — does the agent stop watching, does the timer freeze, does on-task/off-task state get suspended?

I am not sure if letting the user pause a session is a good idea as we want to gain as much data / information from when the session is active, even if the user goes on misc apps that they shouldn't to be able to draw a portrait of the user's habits. I need to reflect on this. 

19. What ends a session — the user clicking end, the agent ending it, the estimated time elapsing (which we decided is not enforced), all of them, none of them? Walk through each possible ending condition.

The sessions ends when the user decides it has ended which is something we discussed in the previous layers on the user and the philosophy behind Flowivate. The agent cannot be the one ending the session as it does not have enough context / knowledge to know when the user has stopped working (breach of privacy / too complex) and we decided prior that the time elapsing does not justify the end of the session. 

20. What's the difference between a session the user _completes_ and one they _abandon_? How does the agent know which is which, given that there's no hard timer? This question matters more than it looks because the completion-vs-abandonment distinction is what the reflection and memory layer will use to build patterns.

The difference between a session the user completes and one they abandon is that in the first instance, the user will let time elapse and when they're done click on END in the menu bar which marks a completed session. On the other hand, an abandoned session is defined by any closing of Flowivate before clicking on END, an elongated idle state (longer than 20 minutes) where the session closes itself or shutting the laptop mid-session. 

#### The Reflection

22. What exact questions does the agent ask at session end? Write the actual wording. Earlier we discussed two questions — defend that count, and write them.

I am not sure what questions the agent should ask when the session ends but it should not feel like a questionnaire as the user will feel bothered and this causes unnecessary friction that we want to avoid. Either way, a necessity is asking how the session felt, maybe asking motivation to do i and most importantly if they managed to finish the task.

23. Is the reflection mandatory or skippable? If skippable, what does skipping mean for the data (the agent has incomplete information) and the user's relationship with the agent (they're not honouring the contract loop)?

The reflection should be entirely skippable which means the agent will have to rely on other data like onboarding or session app usage if allowed to estimate. However, the user that signs up (AND PAYS) is highly unlikely to not use the app to its full potential and will probably use the reflection input consistently (although not regularly sometimes but since this is a longterm tool, it doesn't matter).

24. How long should the reflection take, ideally? What's the upper bound before it becomes a chore? What's the lower bound before it becomes a checkbox?

The user should only need to have 10 seconds to reflect on what they accomplished during the session and then another 20-60 seconds to type down what they want depending on the detail that they want to go into. The reflection should definitely NOT feel like an interview or a breach of privacy and thus questions should be the SAME every single time and NOT personalised so that the user knows that they are only giving out information that they have agreed to share either by app permissions and/or context given.

25. Does the agent ever ask a follow-up question in the moment based on what the user wrote? When does it (genuine signal), when doesn't it (would feel intrusive)? Give two examples of each.

I think the user should have follow-up questions and template suggestion answers for what they want to write. These templates should be guided and easy to fill in with 1 or 2 words. Even if ideas are jumbled like mine are often (got one that just appeared in my head), the end result is what counts and the agent will be able to parse and separate essential information. And then the user decides freely if they want to give more context but we definitely don't want to be intrusive.

26. What does the user see immediately after submitting the reflection? Is there a summary, a thank-you, silence, the agent's updated note about them, the dashboard? This is the moment where the user either feels seen or feels processed — design it specifically.

After submitting the reflection, I think that the popup should close itself with maybe just a toast or a success popup. I really want to make this workflow native for the user on their MacBook and not feel like a separate feature. 

#### The Memory Use During the Loop

27. How is the reflection data used in the _next_ session's contract step? Does the agent reference what happened last time? When does it reference it (returning to similar task, similar time of day, recent pattern) and when does it stay silent?

I don't think that the reflection data should be used in the next session's contract step as the user may be doing something completely different which would just be annoying to be reminded wrongfully. For example, when I count on using Flowivate, I will probably have very different tasks lined up back to back so this is not an optimal approach. I don't know if it is very consuming LLM usage-wise but is it possible for the agent to continuously monitor what the user says in the next session's contract and if any trigger words (a significant amount) appear in the new contract being typed out, reference it somehow ? 

28. What does the Sunday debrief contain? Write a sample one — the actual sentences the agent would write to a user after a real week. Include both flattering and uncomfortable observations.

During the onboarding, the user should be able to choose when their debrief will appear (not necessarily Sunday). It should be a very visual card that shows the strengths and weaknesses and tasks completed during the week. I am unsure what exactly is the most insightful data to display at the moment but we definitely want the user to learn something from it and have something for the week after to slightly improve on.

29. How is the debrief surfaced — push notification, email, opens the app, a combination? Why that choice given what we know about the user from Layer 2?

The debrief should definitely not be sent by email. Maybe a push notification (unless a session is active) or when the user opens the app, maybe from the menubar or the bottom bar (depending on what I decide to have display Flowivate). The push notification should not have reminders if so, not need the application to be open so it would be a native Apple notification. Our user does not want to be distracted uselessly which is what we aim for by reducing interactions as much as possible and making Flowivate an invisible agent.

30. Can the user request a mid-week debrief, or is it strictly weekly? Defend the choice — frequency shapes the relationship.

 The user should not have the option to request a mid-week debrief. We stated that our user is here for the long run so he does not seek mid-way gratification. He knows by signing up to Flowivate that the results will take time to appear and he is ready to see his progress naturally over time, gently reminded by weekly reports. ` 