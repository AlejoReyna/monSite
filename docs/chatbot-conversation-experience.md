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

The server uses the site's curated project catalog and public interests already present in its chat data. Replies aim for 30–80 words, specific answers, occasional questions back, warm dry humor, and natural Spanish or English. A joke request asks for an actual punchline. Work and serious subjects receive direct answers. Identity questions receive an explicit AI explanation.

The prompt prohibits invented personal memories, live activities, availability, pricing, or promises. This guides generation; it is not a guarantee that every response will be correct. Live response quality still needs review with Alexis.

English, Spanish, and Chinese interface copy is included. Chinese choices send English text, with this behavior explained beside the deck, preserving the site's English/Spanish conversational persona.

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

Ten tests cover branch reachability, no repeats, translated choices, fragmented SSE, error propagation, rejected client system roles, server-owned persona instructions, both provider paths, and quota reporting. Provider calls are mocked; the suite starts no server and makes no network requests.

Browser layout, phone keyboard behavior, assistive technology behavior, and live generated humor remain to be checked when running the site is authorized. No server, preview, or production build was started for this work.
