
----

#### Surfaces

1. Catalogue every place the user encounters Flowivate. For each surface, write one sentence describing what it is for. Be exhaustive — main window, contract input, menubar indicator, intervention overlay, reflection prompt, post-reflection moment, dashboard, technical memory view, Sunday debrief, settings, onboarding, install screen, anything else. The list itself is a useful artifact — most products have more surfaces than their teams realise.

Firstly, we have the onboarding screen after the user has moved Flowivate to the Applications folder, which appears and allows the user to configure the agent and how Flowivate will function with a multi step process. Once done, the user is assisted to make their first test task, would be nice if there was a step by step process to show them how it works, either by a video or maybe an actually guided process like in video games for their first task. So in that process the contract input would appear and after submission, an overlay should appear allowing the user to visualise the task progression, if applicable by a timer. In the menubar, there should also be the progression as well as the ability to pause and end the session. When the session ends, an overlay appears for success and then the post-reflection moment appears. And then there's the settings page, the debrief depending on the configuration. When a session isn't active, there should be a way to access a main panel and then another for the memory chamber that is in depth, and some other way for the dashboard. Maybe i have forgotten other stuff.

2. Which surface is the _primary_ one — the thing the user opens the app to see by default, the thing that defines what Flowivate _is_ in their mind? What is on it? The answer to this question is the answer to "what is Flowivate, visually."

The primary surface that flowivate sees by default is definitely the contract to open a new session, nothing else. Visually, Flowivate is just that and what comes after is "secondary" to that one component. The contract is the most important thing and the most mechanical thing that the user needs to be come a habit.

3. Equally important: what does Flowivate refuse to put on the primary surface, even though competitors do? (No graphs at the top, no streak counter, no AI chat box, no quick-action shortcuts to a dozen features, no widgets for water intake — name them specifically, the way Layer 6 will name anti-features.)

It should definitely not display dashboards as the primary surface as what we do at Flowivate is primarily make the user DO the task and not see the progress. The progress is something long term and not what we want the user to see primarily. Definitely needs to be minimalist.

#### Invocation

4. There must be a single canonical way the user opens Flowivate to start a session — a keyboard shortcut, a menubar click, a hotkey corner, a global voice command, something. Pick the primary path. Define the fallbacks. The primary path matters because it is the muscle memory that, once formed, becomes how the user thinks of Flowivate.

So to start a Flowivate session, the most intuitive way is to have a shortcut to create the mechanic of triggering a new contract every time the user wants to execute a new task. I like the idea of a global voice command, do you think it would be possible to have Siri be triggered like for example "Hey Siri, open a new session." Would that be possible ? Otherwise, as a fallback, the user should be able to trigger from the menubar. 

5. What is the default keyboard shortcut, and can it be remapped? The default matters because most users never change it, and the choice has to coexist with Raycast, Spotlight, Alfred, and other tools that already claim hotkeys on this user's Mac. Defend your choice against conflicts.

I am unsure of what should be the default keyboard shortcut. It should be something accessible by the user that doesn't feel like Twister and be composed of more than 3 keys to be pressed.

6. When the user invokes Flowivate, what happens in the first 300 milliseconds? Where on the screen does the input appear, what is the animation, what is the focus state, what is the keyboard ready to accept? Speed and confidence in this moment shape the entire product's feel.

When the user invokes Flowivate, in the first instants : the contract should appear in the centre of the user's viewport, it should be movable and resizable with the position being remembered every time. I think that there shouldn't be any animation, everything should be blazing fast and we don't need a loading state for this. The focus state should directly be on the input to get the user typing his task ASAP. I didn't mention this before but what I saw Raycast Focus has is a blocker for Apps / Websites that the user can type in to block them and the next time they open it remembers. 

#### Visual Language

7. Light, dark, or system-following? Defend the choice — and if it's both, defend why your design system supports both equally well rather than treating one as primary and the other as a port.

Yeah, this is where I want to make the UI/UX feel unique and clean as I was thinking of implementing somehow Apple's Liquid Glass that new MacBook software updates implement.

8. Earlier we agreed to avoid blue (the Linear/Vercel default that signals "competent SaaS"). What is Flowivate's accent color, and why? Pick something specific (amber, desaturated green, a particular orange) and defend it against the alternatives. Color is a brand decision more than a design decision — the accent colour is part of how a user remembers the product.

As mentioned before, I want to have liquid glass and a sort of glass-like texture to it so colour isn't too much of an issue and will be sticking to black and white. Flowivate's logo is blue so i think i disagree with prior statement.

9. Name three to five products whose visual language Flowivate borrows from, and one or two specific things you would take from each. Be precise: not "I like Linear," but "from Linear, I take the density of information per screen and the way command palettes feel weightless." This is the moment to commit to your taste publicly so the document can hold you to it.

From Linear, i like the micro animations that are pixel-perfect. From Raycast, i love the interface design and its recent adaptation to Liquid Glass in their new beta. Lastly, as mentioned prior, I am a fan of the hierarchy of Obsidian for its Vaults / Folders / Notes and I really want to inspire myself from that for the detailed memory view.

10. Name three products whose visual language Flowivate explicitly is _not_. What does Flowivate refuse to look like, and why? This is harder than the reference list — you have to name products you might be confused with and articulate the difference.

We definitely do not want to look like Flowivate's first version as it was way too messy and not our new product's value. Another app is Notion that has too many integrations and it has quite a big learning curve. Lastly, we don't want the app to have the feel of ChatGPT or any AI chatbot with conversational UI.

11. Is Flowivate dense (lots of information, small text, considered packing of a small surface — Linear, Bloomberg Terminal, Cron) or spacious (lots of whitespace, large text, breathing room — Apple, Things 3, Stripe Dashboard)? Pick a posture. The density choice cascades to every screen you'll design.

Flowivate should be a mix of both depending on the screen. Indeed, for example, the contract should be minimalist and small whereas the memory view for example has to be dense while staying extremely simple to navigate through.

#### Typography

12. Pick the display face, the body face, and the mono face. Three typefaces total, not more. Defend each. The mono face matters more than usual in Flowivate because the agent's notes are read in mono, which gives them a journal-entry quality. Inter, Söhne, IBM Plex, Geist, JetBrains Mono, Berkeley Mono — pick from the modern set or commit to something more unusual.

I really am a fan of Geist or Satoshi as fonts but I am not experienced in typography so I could not exactly know how to make this decision.

13. How does the agent's writing look on screen? Is it set in mono (journal/code feel), in serif (literary feel), in sans (clean and modern)? Does it look different from the rest of the UI's text to signal it is the agent speaking? This is a small decision with a large emotional consequence.

I am unsure on this decision and now that I think of it, it is quite important. I never noticed this but Claude has that where the font is different between the main chat and the actual chat bot. I am unsure of what I have though and I think having just the same modern font throughout is what I aiming for here.

#### Motion

14. How do things move in Flowivate — sharp and instant (Linear, Raycast), soft and damped (Apple, iOS), playful (Arc, Notion AI), or somewhere else? Pick a posture and describe two or three specific examples (how the contract input appears, how the intervention overlay enters, how the post-reflection note fades).

In Flowivate, things should be sharp and instant as we want as less friction as possible. Loading states and idle should be reduced as much as possible. Stuff like no internet connection should not appear OR buffering throughout the application, this won't be a problem since we set it up in the Layer 4. 

15. Modern apps either use a lot of motion (Arc, Notion AI) or almost none (Linear, Hacker News). Where does Flowivate sit on this spectrum, and why? Motion can either feel premium or feel like the product is trying too hard. Pick a budget and defend it.

I really want to have some motion, stuff that I like personally is haptics which Arc has a lot and I really want that for Flowivate as well as other subtle motion interactions like clean animations for success and overlays. 

#### Sound

16. Layer 3 introduced an optional intervention sound. Are there other moments where Flowivate makes a sound? Session start, session end, post-reflection, debrief arrival, error states — for each, decide whether sound is appropriate. The default for most operations should probably be silence, but silence has to be a decision, not an oversight.

For most operations as the question mentions, the default should be silence and there should be a very minimalist sound for when a user ends the session (NOT when the session ends by time and the user ends up working longer). Otherwise sound effects should be made minimal. 

17. If sound is present, what does it feel like — synthetic ping, soft bell, wood block, breath, ambient pad? Pick a character and defend it. The character of a single notification sound says more about a product's posture than most users consciously realise.

I think we should shift away from a synthetic ping as it is very generic and the user can mistake it for something else, but it should be something like a brief tune or something, unsure here.
#### States

18. When a user opens Flowivate for the first time after install, before any sessions have happened, what do they see? The empty state is also the moment where Layer 4's promise has to land — the user should see the _shape_ of the memory they will fill, even though it is empty. Be specific about content and tone.

So when the user opens Flowivate for the first time, the first thing they should see is the onboarding process as we mentioned before, separated into a multi-step process to guide the user. I am not sure of how to show the empty state of the memory they will fill so this needs to be discussed thoroughly as it is a promise that will have to be displayed on the landing page to show that they aren't paying for nothing.

19. Same app, three months in, with 60+ sessions and accumulated memory. What is different from the empty state, and what is the same? The continuity of the design across these two states is part of why the user trusts the product over time.

I am not sure how to reply to this since I was a bit lost.

20. What does Flowivate look like when the user is _not_ in a session — when the app is just sitting there waiting? Is there content on the main screen, or is it dormant? Is the menubar indicator visible all the time or only when something is happening?

It should not be on the main screen as this is friction for users that care about the display of their viewport. The menubar indicator should be visible all the time like some apps to allow the user to engage or see their memory without being in a session. But what about the default app at the bottom ? I am unsure.

21. When the agent is doing something cloud-dependent (parsing a contract, generating the post-reflection note, producing the debrief), the user has to wait briefly. What do they see in those 500-2000 milliseconds? A spinner is the lazy answer. The right answer is something specific to Flowivate's voice.

What would be the most ideal is if all the cloud-dependent content was done in the background, for example the post-reflection note be worked on while the user is in a session, producing the debrief, parsing the contract so that the user has to deal with as little friction as possible but I am unsure if this would be possible.

#### Menubar

22. What does the menubar icon look like — a wordmark, a glyph, a state-color dot, an animated element during sessions? What does it communicate at a glance: in session, paused, drifting, idle, debrief available, nothing?

The menubar should be dynamic depending on what is happening. By default, it should be the Flowivate icon, in a session I am unsure but was thinking of having something like "Ongoing", and then when paused have "Paused", for debrief available, I am unsure of what I want.

23. When the user clicks the menubar icon, what appears? List the contents in priority order — what is at the top, what is hidden behind a "more" or settings link, what is never in the dropdown.

I am unsure yet of what I want here.

#### Onboarding

24. From the moment the user finishes installing Flowivate to the moment they hit return on their first session, what happens? Walk through it step by step. The first 90 seconds determine whether the user gets to experience the contract loop on day one — which Layer 3 told us is essential.

As mentioned before, as soon as the onboarding is done, the first contract session appears allowing the user to get right into executing and working.

25. Onboarding is the user's first encounter with the agent's voice. What does the agent say in those first 90 seconds? Write the actual lines. The voice you establish here is the voice the user will hear for years.

Hey X, what should we get working on ? I am thinking of something like this with maybe greeting depending on the time of the day but something as simple as this is great to me.

26. In onboarding, what data does the agent ask for? Layer 4 established the memory is mostly empty on day one. What does the agent need to know about the user upfront to make the first session work — work, projects, typical hours, anything? Be honest about the minimum and resist the temptation to make onboarding a survey.

The onboarding should definitely not feel like a survey and maybe having as many pre-defined options is the best way to get the user to easily open up about himself without too much thinking. But then should have the option to be more open and detailed about context but for onboarding, most things should NOT be required to be submitted.

27. We agreed in earlier conversations that the user should run a real session in their first ten minutes. How does onboarding deliver them to that session? What is the transition from "tell me about yourself" to "what would you like to get done right now"?

Onboarding delivers it by opening directly a new contract session after a very brief confirmation message that everything has been taken into account.

#### Dashboard

28. Layer 4 Q20 named five components of the dashboard. Describe the layout — what is at the top, what is at the bottom, what dominates the visual hierarchy. Is it one screen or scrollable? Does it feel like an executive summary or a workspace?

It should definitely be just visual, the user doesn't have anything to do on there apart from see his progress. It should be dominated by a bento grid with different information. Unsure of what exactly to display. I believe it should be one screen and responsive to adapt to what the user chooses. 

29. The dashboard is the most graphics-heavy surface in Flowivate. How do you keep it from looking like every other productivity dashboard? What is the specific visual restraint that makes it feel like Flowivate rather than Notion or Rize?

I think staying minimalist and displaying a very visual heavy interface is what we need to make it feel very Flowivate-like and hard to impersonate. Some components, should be visually appealing and unique from other apps like the heat-map for example. I need inspiration first of what I want to display.

#### The Technical Memory View

30. The technical memory is a folder of markdown files modelled on Obsidian. When the user opens it inside Flowivate, what do they see? A file tree on the left? A graph view? A single readable scroll? Is this a separate window or a panel within the main app?

We definitely want a very easy to navigate file tree not only for scalability but also for pushing to Github just like Obsidian. We don't want a readable scroll as not at all scalable so yes a file tree and a main view. This is a separate window within the main app but unsure of this decision.

31. When the user clicks into a prose note to edit it, how does that feel? Inline edit (in place), modal (popup), or full-screen (dedicated editor)? Defend your choice given Layer 4's note that the user should rarely live here.

I am unsure of this.

#### The Sunday Debrief

32. Layer 3 sample debrief was prose. Does the debrief on screen look like a letter, a card, a small dashboard with a few numbers and a few sentences? Is it scrollable? Does it ever contain an image or a chart? Pick the format and defend it against the alternatives.

The debrief should be in an Opal-like style that looks very visual and share-able easily. Unless I stand corrected here. 

#### Settings

33. What does settings look like? How many sections does it have? What is the navigation pattern — sidebar, tabs, single scroll? Settings is usually neglected, but Flowivate has real choices the user might want to revisit (mode default, ambient sound, GitHub sync, BYOK key, intervention firmness preferences). Settings is where the user feels the product's care for them in the small details.

The settings should look very basic and unsure on the amount of sections needed. A sidebar is good for scalability reasons. We want to make sure that Flowivate is very customisable to make the user feel that they have full control over everything and subconsciously, their privacy.

#### The Anti-Surface

34. What features are not given screens? Streaks, leaderboards, achievements, "Year in Review" summaries, sharing screens, public profiles — list the things competitors have surfaces for that Flowivate refuses to render at all. Each one is a small decision but the cumulative effect is the brand.

We definitely do not want social interactions, leaderboards, public profiles. Work is done for the person and not to be shown to others, to be "flexed". The user is using Flowivate to better his habits, he does not have the need to show others that his productivity habits are getting better every week.