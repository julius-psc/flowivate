#### Phase 1: Understand before you open Figma

This sounds obvious and almost no one does it. Before touching Figma, you need to know four things precisely:

**1. What is the user doing when they encounter this component?** Not "using the app" — specifically. What just happened, what are they about to do, what emotional state are they in? For the Flowivate contract input: the user has just invoked the shortcut because they're about to start work. They're probably slightly distracted already. They need to get through this screen in under ten seconds. That context shapes every decision — size, friction, cognitive load.

**2. What does success look like for this interaction?** One sentence. For the contract input: "the user states a task and hits Return in under ten seconds, without having to make any decision they didn't want to make." That sentence is the filter for every subsequent design decision. If a feature doesn't serve that sentence, it shouldn't be in the component.

**3. What are the states?** List every state before designing any of them. Empty, filled, error, loading, disabled, hover, focus, active, success. Do this for every component before opening Figma. The list will feel excessive for simple components; it will save you from rework on complex ones.

**4. What are the constraints?** Platform (macOS, iOS, web), breakpoints if any, existing design system if you're working on a client project, accessibility requirements. For the client role: always ask what design system exists before designing anything. Designing outside a system is work that gets thrown away.

Output of phase 1: a half-page brief. Literally write it in a text file or a Notion page. Job to be done, success metric, state list, constraints. Takes 10-15 minutes. Skipping it costs you hours of rework.

---

#### Phase 2: Inspiration and reference (15-30 minutes, timeboxed)

Open a browser, not Figma. Collect 5-10 references. Be specific about what you're collecting each reference for — not "this looks cool" but "this is how Linear handles focus states on text inputs" or "this is how Raycast shows parsed entities inline."

Sources in order of usefulness for your work: Raycast's own UI, Linear, Vercel dashboard, Clerk, Resend, Apple's HIG (Human Interface Guidelines) for macOS specifically, Mobbin (for flow references), Dribbble only for texture/color references (never for interaction patterns — Dribbble lies about how interactions work).

Save references to a single Figma page called "References" in your file. Drop the screenshots in, label each one with what you're borrowing. You'll refer to them constantly during design.

**Hard timebox: 30 minutes.** Inspiration phases that run longer than 30 minutes are procrastination. Set a timer.

Output: 5-10 labeled references on a Figma page.

---

#### Phase 3: Wireframe (no color, no style)

Now open Figma. But do not design. Wireframe.

A wireframe in 2026 means: grey rectangles, black text, no color, no icons, no gradients, no shadows. Just structure and content. The only question you're answering at this stage is _"where does everything go and how does it relate?"_

For a component like the contract input: sketch the layout of the input field, the three controls, the agent line above, the submit hint. Don't worry about size or spacing yet. Don't worry about what font. Just answer: is the agent line above or below the input? Are the controls in a row or a column? Is there anything else in this window or just these elements?

For a full product: sketch every screen as a box with labels. No visual treatment. The wireframe is a conversation tool — it's how you check whether the information architecture makes sense before you invest in making anything pretty.

**Use rectangles, lines, and text only.** Figma's wireframing workflow: use the rectangle tool (R), the line tool (L), and the text tool (T). That's it. No components yet, no Auto Layout yet, no styles yet.

Output: a low-fidelity layout for each state you identified in phase 1. Takes 30-60 minutes for a component, 2-4 hours for a multi-screen product.

---

#### Phase 4: Build the design system primitives

Before you design at high fidelity, build the primitives you'll use. For Flowivate, you've already defined most of these in Layer 5. In Figma terms, this means:

**Styles (in Figma: Variables in newer versions, Styles in older):**

- Color tokens: background (dark base), surface (Liquid Glass layer), border, text-primary, text-secondary, text-mono (agent voice), accent (the desaturated blue), accent-dim, error, success.
- Typography styles: Geist body sizes (12, 14, 16, 18, 24, 32), Geist Mono sizes (12, 14, 16).
- Spacing tokens: 4, 8, 12, 16, 20, 24, 32, 40, 48 — the standard 4-point grid.
- Border radius: 8, 12, 16, 20, 24 — name them small, medium, large, xlarge.
- Elevation: the shadow/blur values for your Liquid Glass levels.

**Base components (before you need them):**

- A button in its variants (primary, secondary, ghost) × states (default, hover, pressed, disabled).
- A text input in its variants × states (empty, filled, focused, error).
- A pill/badge in its variants.
- A tooltip.
- A dropdown menu item.

Do not build every component upfront. Build only what you'll need in the next phase. The trap is spending three days building a full design system before designing anything — that's the wrong order for solo and small-team work. Build primitives just-in-time.

**Use Figma Variables if you're on the student plan.** Variables are Figma's newer, more powerful version of Styles. They support mode switching (dark/light), responsive values, and component theming. Set them up once and they save hours on every subsequent design.

**Auto Layout on everything from here forward.** This is the discipline that makes designs scalable and handoff-ready. Every frame you create in phases 4-7 should have Auto Layout applied. No absolute positioning except for overlays and elements that are genuinely position-relative (like the intervention overlay that appears at a screen corner).

Auto Layout rules to internalize:

- Fill-container width on elements that should stretch, Hug-content on elements that should shrink to fit.
- Fixed values only for elements with a specific size constraint (the contract window has a fixed width, for example).
- Consistent spacing tokens — never type "14" into a spacing field; always reference a spacing variable.
- Nested Auto Layout for complex components: the controls row is an Auto Layout frame inside the contract input window's Auto Layout frame.

Output: a "Design System" page in your Figma file with all variables, typography styles, and base components.

---

#### Phase 5: First high-fidelity pass

Now design, for real, using the system you built. Work in order of states: default/empty first, then filled/active, then error/edge cases. Never design states out of order — the default state is the source of truth that all others inherit from.

For the contract input, the order is:

1. Empty state, returning user (most common default).
2. Typing state with parsed entities.
3. Submit state.
4. Empty state, first session ever.
5. Returning-after-gap state.
6. Inline memory reference state.
7. Renegotiation entry state.
8. Edge cases (offline, agent line failure, mid-session invocation).

**Design at 1x resolution on a Mac frame.** Figma's macOS frame template at 1440×900 or 1512×982 (MacBook Pro 14-inch native). Not 2x. Not at component level without context. You need to see the component at actual size against a realistic desktop background to make good decisions about scale and density.

**Review against the brief from phase 1** every 30 minutes. The success metric was _"user states a task and hits Return in under ten seconds."_ Is every element in the design serving that? Is anything adding a decision the user didn't want to make?

Output: a complete first-pass design for all states, on realistic frames.

---

#### Phase 6: Critique and iteration

Step away. Literally close Figma and do something else for at least 30 minutes. Then come back and review with fresh eyes.

Three questions to ask during self-critique:

1. Does the visual hierarchy immediately communicate what the user is supposed to do?
2. Is there anything I added because it seemed useful but that actually creates a decision the user didn't need to make?
3. Does this feel like the product the brief described, or did it drift?

For client work, this is where you'd share with your lead or design manager. For Flowivate, this is where you bring it back here and I'll review it.

The iteration loop is: critique → identify 3-5 specific issues → fix → review again. Not "make it better generally" — specific issues with specific fixes.

**Don't iterate more than three rounds without showing someone else.** Self-critique has diminishing returns. You need external eyes.

Output: a refined high-fidelity design that you've stress-tested against the brief.

---

#### Phase 7: Prototype and handoff

**Prototyping for interaction validation:** Connect the states in Figma's prototype mode. Wire the empty state to the typing state on keystroke, the typing state to the submit state on Return, the submit state to the session-started toast. Play the prototype on your actual Mac. Does the flow feel right at real size? Are the transitions working or fighting the user?

For overlays and timed elements (the post-reflection note fading, the intervention overlay appearing), Figma's native prototyping is limited. Use Smart Animate for transitions between states. Acknowledge that some behaviors (the streaming text, the spring physics on dismissal) can only be validated in code — the prototype covers the structure, not the micro-behavior.

**Handoff:** If you're handing off to an engineer (yourself, or a client's engineers):

- All colors reference variables, all text references type styles. No hardcoded values.
- Component variants are named clearly (Contract Input / Empty / Dark, Contract Input / Typing / Parsed, etc.).
- Every spacing value is a multiple of 4.
- Interaction notes are added as annotations in Figma (use the annotations feature, not text frames floating near components — the annotations appear in Dev Mode properly).
- For macOS specifically: note the target macOS version for any APIs used (Liquid Glass requires macOS 26 / Tahoe).

For your part-time role: always ask your employer how they want handoff structured before you assume. Some teams use Dev Mode. Some teams use Zeplin. Some teams just want well-organized Figma files with everything named.

Output: a prototype file and a handoff-ready component file, separated. Keep exploration in the main file; export a clean version for handoff.