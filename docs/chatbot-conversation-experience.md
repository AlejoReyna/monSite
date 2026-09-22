# Alexis, after hours

Implemented experience for the portfolio terminal, September 21, 2026.

The visitor should get a feel for Alexis before deciding to contact him: his interests, humor, and way of explaining things. The interface calls itself an AI edition throughout. It can stand in for an introductory conversation; personal commitments and details it does not know go to the real Alexis.

## The interaction

1. A short, immediately visible welcome invites the visitor to pull up a chair. No typing animation gates the controls.
2. Three lines offer different openings: get to know Alexis, debate The Beatles, or challenge his comedy.
3. Clicking a line sends it as the visitor's message. The reply streams into the same transcript, with a stop button and Escape cancellation.
4. A successfully answered choice reveals its next branch and places it first. Other paths remain available. Twelve authored choices span three paths; each appears until successfully answered, then retires for this conversation.
5. Visitors can type at any point between replies, explore another branch, view projects, or contact Alexis. Exhausting the deck invites a free-form question. Starting over clears the local conversation and branches, without resetting the server quota.

Example: “Tell me a joke. I’m a tough crowd.” → AI joke → “That joke needs a code review. Try again.” → another joke → “Roast my 47 open browser tabs. Gently.” → playful response → “Plot twist: are you actually Alexis?” → honest AI disclosure.

The game mechanic is discovering dialogue branches. It follows the existing draft's preference for exploration without XP, scores, or badges. Free-form messages do not consume an authored branch. No extra AI calls generate choices.

## Voice and content

Replies aim for specific answers in natural Spanish or English, occasional questions back, and dry understated humour. A joke request asks for an actual punchline. Identity questions receive an explicit AI explanation.

The register is professional in every topic, including small talk: warm and direct, without slang, profanity, filler openers or customer-service phrasing. Recruiters are a primary audience, so there is no second casual persona to fall into.

The prompt prohibits invented personal memories, live activities, pricing, or promises. This guides generation; it is not a guarantee that every response will be correct. Live response quality still needs review with Alexis.

English and Spanish interface copy and conversation choices are included.

## The CV dossier

`src/lib/profile/cv.ts` holds Alexis's CV as structured bilingual data and is the only source the chatbot may use for experience answers: identity, contact, hiring status, profile, both roles, the three external projects, skills, education and extracurriculars. `buildCvBrief(language, detail)` renders it as prompt text.

Every turn carries the **spine**: identity, contact, hiring status, profile, every role and every project by name and period, the full skills table, education and the extracurriculars. No fact category is ever missing, so the bot can always place a question even when it cannot answer it in depth. The `detail` level then expands one section into its bullets — role bullets for a hiring, experience or tech turn, project bullets for a projects turn — and a summarised dossier carries a line telling the model to invite a specific question rather than improvise the missing detail. Topic detection runs per turn, so the follow-up question gets the depth the first one lacked.

Two things travel with it. `HIRING` states that Alexis left Inverater after the October 2024 – September 2026 role, that Inverater is still operating, and that he is actively looking. The guardrails are split in two: `GUARDRAILS_CORE` rides on every turn and forbids quoting a salary, inventing any fact, or committing to an interview, start date, visa or relocation. `GUARDRAILS_CREDENTIALS` joins the turns that expand detail, where the traps live — PCI certification (he took part in a review and contributed technical evidence, nothing more), a finished degree, an English level above conversational, and any figure beyond the five the CV records.

**When the CV changes, edit `src/lib/profile/cv.ts` and nothing else.** Both the terminal chat and the Orbit voice assistant read from it, as does the `/about` one-liner in `portfolio-content.ts`.

## Where the persona lives

The persona is server-owned. The browser posts the typed text plus a language and nothing more; `/api/chat` rejects a client-supplied `system` or `developer` role with 400 and strips any `[[SYS]]` block out of a turn before the model sees it. A visitor cannot rewrite the character from the composer.

`src/lib/profile/direction.ts` detects a topic from the last user turn — hiring, experience, projects, tech, contact, personal or general — and layers a focus paragraph on top of `CONVERSATION_DIRECTION`. The hiring focus is the recruiter path: it leads with the concrete answer, is exact about dates and numbers, and routes compensation, interviews, start dates, notice periods, visas and relocation to alexis.rs@proton.me instead of answering them.

Sending the whole CV on every turn cost about 2,900 (EN) to 3,050 (ES) tokens. Scaling it by topic brings a recruiter turn to roughly 2,350–2,520 and a contact, personal or general turn to about 1,660–1,710 — 17–20% off where the detail earns its keep, 43–45% off where it does not. `briefDetailFor(topic)` is the single place that mapping lives; Orbit calls it too, which matters because it replays its system prompt on the tool follow-up and so pays for the dossier twice per question.

## Recovery and access

- Network or provider failures keep the message visible and offer a one-click retry. Failed and interrupted turns are excluded from subsequent model context.
- Rate limits explain that the chat needs a break and keep projects/contact accessible.
- Stop preserves partial text without advancing a branch. A 60-second request timeout releases a stalled composer.
- Transcript and branch state stay in component memory; this change does not persist them in browser storage. Requests still go to the configured AI provider.
- Arrow keys move among choices; all actions are native buttons. Focus returns to the choice deck after its reply. Unique composer IDs support multiple mounts. Screen-reader announcements announce status and completed replies without reading every streamed token.
- The transcript scrolls independently, respecting visitors who scroll up. The composer stays below it. Mobile input text is 16px; choices and send/stop controls have 44px targets. Reduced motion removes choice transitions.

## Scope and validation

This implements the portfolio terminal shared by desktop and mobile. The separate menu-bar voice assistant and the rest of the larger draft behavior plan are unchanged.

Static checks: targeted ESLint, TypeScript without emit, and `git diff --check`. Run the lightweight regression suite with:

```sh
node --max-old-space-size=768 --test scripts/test-chat.mjs
```

Eighteen tests cover branch reachability, no repeats, translated choices, fragmented SSE, error propagation, rejected client system roles, server-owned persona instructions, both provider paths, quota reporting, recruiter topic routing in both languages, the CV facts and guardrails reaching the model, the absence of the retired persona's contact details and stack, the Spanish dossier, the voice assistant sharing and scaling the same dossier, the spine surviving at the shallowest depth, and the detail appearing only where the turn needs it. Provider calls are mocked; the suite starts no server and makes no network requests.

Browser layout, phone keyboard behavior, assistive technology behavior, and live generated humor remain to be checked when running the site is authorized. No server, preview, or production build was started for this work.
