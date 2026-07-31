import type { Post, PostMeta } from "./types";
import { artisanalBrewPixelHero } from "./post-content/artisanal-brew-pixel-hero";

/**
 * Post registry.
 *
 * Posts are data, not files. That keeps the block vocabulary enforced by the
 * type checker: an invalid block is a build error, not a page that renders
 * slightly wrong in production.
 */

const capabilityGate: Post = {
  slug: "feature-flags-that-cannot-lie",
  title: "Feature flags that cannot lie",
  summary:
    "Most flag systems answer “is this on?”. A flag guarding money has to answer a harder question: is the thing it promises actually deployed?",
  date: "2026-07-28",
  readingMinutes: 7,
  tags: ["architecture", "validation", "feature-flags"],
  blocks: [
    {
      kind: "lede",
      content: [
        "A feature flag is a promise. Most of the time, breaking that promise renders a button in the wrong place. Sometimes it takes a user's money and sends it to the empty string.",
      ],
    },
    {
      kind: "paragraph",
      content: [
        "I build a multichain coffee storefront called ArtisanalBrew. It runs liquid staking across Ethereum Sepolia, BNB testnet and Solana devnet, and it has a registry of nine chain definitions where six are switched off because their contracts don't exist yet. Every one of those switches is a claim about infrastructure I may or may not have deployed.",
      ],
    },
    {
      kind: "paragraph",
      content: [
        "The flag ",
        { kind: "code", text: "marketplacePayment" },
        " turned on for a chain with no escrow contract doesn't render a broken button. It renders a ",
        { kind: "em", text: "working" },
        " button that moves funds to an address that is ",
        { kind: "code", text: '""' },
        ". The usual flag lifecycle — flip it on, deploy the backend shortly after — has a window where the claim is simply false. This is about removing the window.",
      ],
    },

    { kind: "heading", text: "The rule" },
    {
      kind: "callout",
      tone: "note",
      title: "The whole idea",
      content: [
        "A capability is a claim about deployed infrastructure. The claim lives in a committed deployment manifest. The manifest is rejected at startup if the claim isn't backed by the addresses it requires. There is no code path that enables a capability without its deployment.",
      ],
    },
    {
      kind: "paragraph",
      content: [
        "That's it. The rest is enforcement. What makes it work isn't cleverness — it's that the claim and the proof are the ",
        { kind: "strong", text: "same artifact" },
        ". You cannot commit one without the other, because they are one file.",
      ],
    },

    { kind: "heading", text: "What a manifest looks like" },
    {
      kind: "paragraph",
      content: [
        "A deployment manifest is a whole chain definition, not a patch. It carries the addresses and the capabilities together:",
      ],
    },
    {
      kind: "code",
      language: "json",
      caption: "deployments/solana-devnet.json — abridged",
      code: `{
  "schemaVersion": "1",
  "chainKey": "solana-devnet",
  "cluster": "devnet",
  "programId": "EbkKufsajUNzD3bLhRpb2d8XT5fHvz9e8hND111hQJxh",
  "cafeMint": "C7g7g34QzvmAiP4HMmdjWLgfV9Y8FSF4GcAXK97HLQEg",
  "administrator": "D5iN8pAhbzXN9Duq75GsKo6VPHwWzBbtYc1s5KH2CJGA",
  "programBinarySha256": "14ba0f2848ebbcf749a949d617bd68c911dde…",
  "capabilities": {
    "walletLogin": true,
    "liquidStaking": true,
    "rewardFunding": true,
    "reconciliation": true
  }
}`,
    },
    {
      kind: "paragraph",
      content: [
        "Note what isn't there: ",
        { kind: "code", text: "faucet" },
        " is absent, so it's off. The registry ships that chain disabled by default, and the manifest ",
        { kind: "em", text: "replaces" },
        " the built-in definition wholesale rather than merging into it. There is no way to inherit ",
        { kind: "code", text: "enabled: true" },
        " from a default while supplying a partial deployment — you supply everything, or you get the disabled built-in.",
      ],
    },

    { kind: "heading", text: "The validator is the feature" },
    {
      kind: "paragraph",
      content: [
        "Validation runs in the registry's constructor, which runs when the DI container is built. An invalid manifest doesn't degrade a feature — it refuses to start the process. Nothing half-configured ever serves a request.",
      ],
    },
    {
      kind: "code",
      language: "csharp",
      caption: "ChainRegistry.Validate — the load-bearing lines",
      code: `if (chain.Capabilities.LegacyExit &&
    string.IsNullOrWhiteSpace(chain.Deployment.LegacyPool))
    throw new InvalidOperationException(
        $"Chain '{chain.Key}' enables legacy exit without a pool deployment.");

// Marketplace payment needs a settlement venue: the liquid rail settles
// through the ERC-8183 escrow, the legacy rail verifies a native transfer
// against its legacy pool. Either satisfies "no capability without a
// contract behind it"; a manifest carrying neither fails closed.
if (chain.Capabilities.MarketplacePayment
    && chain.Family == ChainFamily.Evm
    && string.IsNullOrWhiteSpace(chain.Deployment.AgenticEscrow)
    && string.IsNullOrWhiteSpace(chain.Deployment.LegacyPool))
    throw new InvalidOperationException(
        $"Chain '{chain.Key}' enables marketplace payment without an escrow or legacy pool deployment.");`,
    },
    {
      kind: "paragraph",
      content: [
        "The second rule is the interesting one, because it's an ",
        { kind: "strong", text: "OR" },
        ". There genuinely are two settlement venues. The right way to relax a rule like this is to name the alternative explicitly — a reviewer can see at a glance that the requirement was widened, not dropped. A boolean escape hatch would have been three characters shorter and unreviewable.",
      ],
    },

    { kind: "heading", text: "The five hops" },
    {
      kind: "paragraph",
      content: [
        "A capability travels five hops from disk to screen. Stopping at any of them makes it invisible, and that is the intended failure mode rather than a bug to route around:",
      ],
    },
    {
      kind: "table",
      head: ["Hop", "Where", "What it does"],
      rows: [
        ["1", "deployments/*.json", "Declares capabilities plus the addresses backing them"],
        ["2", "BlockchainManifestLoader", "Reads the manifest, replaces the built-in definition"],
        ["3", "ChainRegistry.Validate", "Throws if a flag is on without its deployment"],
        ["4", "ChainsController", "Filters on .Enabled before serialising"],
        ["5", "Chain selector UI", "Renders only what the API returned"],
      ],
    },
    {
      kind: "paragraph",
      content: [
        "When something doesn't show up, you walk the hops in order and stop at the first failure. Nine times in ten the answer is that the system is working correctly and I hadn't deployed the contract yet.",
      ],
    },

    { kind: "heading", text: "The step that keeps paying off" },
    {
      kind: "paragraph",
      content: [
        "When enabling a capability, there's one step I'd skip if I were being efficient, and it's the one that keeps catching real gaps: ",
        { kind: "strong", text: "verify it fails closed first" },
        ". Blank the address, start the app, confirm the exception names your chain and your capability. Then restore it.",
      ],
    },
    {
      kind: "terminal",
      caption: "bash",
      lines: [
        { kind: "comment", text: "blank the escrow address, then:" },
        { kind: "cmd", text: "dotnet run --project src/ThisCafeteria.Web" },
        {
          kind: "out",
          text: "Unhandled exception. System.InvalidOperationException:",
        },
        {
          kind: "out",
          text: "  Chain 'ethereum-sepolia' enables marketplace payment",
        },
        { kind: "out", text: "  without an escrow or legacy pool deployment." },
      ],
    },
    {
      kind: "paragraph",
      content: [
        "Thirty seconds, and it proves the gate is actually wired to your new flag rather than silently absent. A capability with no matching validation rule is the one way to defeat the entire design, and it looks exactly like a capability that works.",
      ],
    },

    { kind: "divider" },

    { kind: "heading", text: "What it costs" },
    {
      kind: "paragraph",
      content: [
        "Two things, and I want to be honest about both.",
      ],
    },
    {
      kind: "list",
      ordered: true,
      items: [
        [
          { kind: "strong", text: "You cannot demo ahead of your deployments." },
          " No flipping a flag to show someone a screen. If you need a demo path, deploy to a local chain and write a local manifest — which is friction, and is also the point.",
        ],
        [
          { kind: "strong", text: "Every new capability needs a validation rule." },
          " If you can't name the deployment address it requires, that's a signal: what you have is a UI preference, and it belongs in configuration instead.",
        ],
      ],
    },
    {
      kind: "callout",
      tone: "warn",
      title: "Don't add the bypass",
      content: [
        "No ",
        { kind: "code", text: "ignoreValidation" },
        ", no environment check that skips validation in Development. The value of the gate is entirely in the absence of exceptions — one exception, and every future reader has to check whether it applied to the case they care about.",
      ],
    },

    { kind: "heading", text: "Outside blockchain" },
    {
      kind: "paragraph",
      content: [
        "Nothing here is really about chains. The same shape applies anywhere a flag promises that something external exists: a feature needing a migration, a region needing a provisioned bucket, a pricing tier needing a configured billing plan. Four moving parts:",
      ],
    },
    {
      kind: "list",
      items: [
        ["The flag and the proof of backing live in ", { kind: "strong", text: "one committed artifact" }, "."],
        ["Validation runs at ", { kind: "strong", text: "startup" }, ", not first use — failure is loud and early."],
        ["The default is ", { kind: "strong", text: "off" }, ", and turning it on is impossible without the proof."],
        ["There is ", { kind: "strong", text: "no bypass" }, "."],
      ],
    },
    {
      kind: "paragraph",
      content: [
        "The version of this most teams already have is a config flag plus a runbook line saying “make sure the bucket exists.” That line gets skipped exactly once, in a hurry, and it becomes someone's bad afternoon. Turning it into a startup assertion costs about an hour.",
      ],
    },
    {
      kind: "paragraph",
      content: [
        "I packaged the full version — the five hops, every validation rule, the secrets boundary and the diagnostic walk — as a Claude Code skill you can drop into a project. It's on the ",
        { kind: "link", text: "skills page", href: "/blog/skills" },
        ", along with two others.",
      ],
    },
  ],
};

const blockGuidelines: Post = {
  slug: "writing-in-blocks",
  title: "Writing in blocks",
  summary:
    "This blog has no rich text editor and no markdown. Posts are typed arrays of blocks, and the constraint is doing real work.",
  date: "2026-07-28",
  readingMinutes: 4,
  tags: ["design-systems", "typography"],
  blocks: [
    {
      kind: "lede",
      content: [
        "Every post on this site is an array of typed blocks. There are ten of them, the list is closed, and adding an eleventh has to be argued for.",
      ],
    },
    {
      kind: "paragraph",
      content: [
        "The usual approach is markdown, which is a fine authoring format and a poor design system. Markdown lets me write six heading levels, arbitrary nesting, and an inline ",
        { kind: "code", text: "<div>" },
        " when I get impatient. Every one of those is a way for a post to invent its own typography and quietly break the scale everywhere else.",
      ],
    },
    {
      kind: "paragraph",
      content: [
        "So the content model is a discriminated union, and an invalid post is a type error rather than a page that renders slightly wrong in production.",
      ],
    },
    {
      kind: "code",
      language: "typescript",
      caption: "src/lib/blog/types.ts — abridged",
      code: `export type Block =
  | { kind: "heading"; text: string }
  | { kind: "subheading"; text: string }
  | { kind: "paragraph"; content: Inline[] }
  | { kind: "lede"; content: Inline[] }
  | { kind: "list"; ordered?: boolean; items: Inline[][] }
  | { kind: "code"; language: string; code: string; caption?: string }
  | { kind: "terminal"; lines: TerminalLine[]; caption?: string }
  | { kind: "callout"; tone: "note" | "warn"; title?: string; content: Inline[] }
  | { kind: "table"; head: string[]; rows: string[][] }
  | { kind: "divider" };`,
    },

    { kind: "heading", text: "Three rules that do the most work" },

    { kind: "subheading", text: "Rhythm belongs to the container" },
    {
      kind: "paragraph",
      content: [
        "Blocks carry no outer margin. A single ",
        { kind: "code", text: "> * + *" },
        " rule on the prose container owns all vertical spacing, so the gap between a paragraph and a table is the same as between two paragraphs, forever. The only exceptions are ",
        { kind: "em", text: "relationships" },
        " — a heading and the text beneath it tighten up, because they're one unit.",
      ],
    },

    { kind: "subheading", text: "The measure is applied to text, not the container" },
    {
      kind: "paragraph",
      content: [
        "Prose caps at 68 characters. The obvious implementation — cap the container — is wrong, because it clamps children too, and then a table can never reach full width without negative-margin escapes that break the moment the gutter changes. So the cap lives on the leaf text elements, and wide blocks simply don't inherit one.",
      ],
    },

    { kind: "subheading", text: "Inline emphasis doesn't nest" },
    {
      kind: "paragraph",
      content: [
        "A ",
        { kind: "code", text: "strong" },
        " can't contain a ",
        { kind: "code", text: "link" },
        ". This sounds restrictive and almost never is: when I reach for nested emphasis, the honest fix is that the sentence is doing too much and wants to be two sentences.",
      ],
    },

    { kind: "divider" },

    { kind: "heading", text: "The one that changed the writing" },
    {
      kind: "paragraph",
      content: [
        "The ",
        { kind: "code", text: "lede" },
        " block is capped at one per section. It renders larger than body text, so it's the sentence a skimmer reads. Having exactly one slot forces the question ",
        { kind: "em", text: "what is the single most important sentence here" },
        " — and often reveals that a section has two arguments in it and should be two sections.",
      ],
    },
    {
      kind: "callout",
      tone: "note",
      content: [
        "A constraint that changes what you write, rather than just how it renders, has earned its place. One that only prevents ugly output is usually better handled by a lint rule.",
      ],
    },
    {
      kind: "paragraph",
      content: [
        "The full spec, with each block rendered next to the rule governing it, is on the ",
        { kind: "link", text: "guidelines page", href: "/blog/guidelines" },
        ".",
      ],
    },
  ],
};

export const posts: Post[] = [
  artisanalBrewPixelHero,
  capabilityGate,
  blockGuidelines,
];

/** Newest first. */
export function getAllPosts(): PostMeta[] {
  return [...posts]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(({ slug, title, summary, date, readingMinutes, tags }) => ({
      slug,
      title,
      summary,
      date,
      readingMinutes,
      tags,
    }));
}

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
