// ───────────────────────────────────────────────────────────────────────────
//  US ♥ — story config & content
//  Everything you'd want to edit lives here.
// ───────────────────────────────────────────────────────────────────────────

export const STORY_CONFIG = {
  // Her name — used in greetings.
  herName: "Love",
  // Your name — shown in the closing signature.
  yourName: "Me",
  // The 6-digit PIN she'll enter to unlock the experience.
  // Change this to something meaningful (e.g. the date you met: "140622").
  pin: "000000",
  // Optional ambient music. Drop an mp3 into /public/ and set the path,
  // e.g. "/song.mp3". Leave as null to hide the music toggle entirely.
  musicSrc: null as string | null,
} as const;

// ── Scene model ──────────────────────────────────────────────────────────────

export type Interaction =
  | { kind: "continue"; label?: string }
  | { kind: "choice"; prompt: string; options: ChoiceOption[] }
  | { kind: "input"; prompt: string; placeholder?: string; storageKey: string }
  | { kind: "reveal"; label: string; hidden: string }
  | { kind: "finale"; signoff?: string };

export interface ChoiceOption {
  label: string;
  response: string;
}

export interface Scene {
  id: string;
  image?: string;
  imageAlt?: string;
  heading?: string;
  body?: string[];
  interaction?: Interaction;
  surprise?: "hearts" | "none";
}

// ── The story ────────────────────────────────────────────────────────────────
// Photos: drop real images into /public/photos/ and update the `image` paths.
// Any path containing "placeholder" shows a soft pink frame until replaced.

export const SCENES: Scene[] = [
  {
    id: "open",
    heading: `Hi, ${STORY_CONFIG.herName}.`,
    body: [
      "There's something I've wanted to say properly, not half-right in a text.",
      "So I made you this. It's only a few minutes. Take it slow — there's nothing to fix here, just something I need you to read.",
    ],
    surprise: "hearts",
    interaction: { kind: "continue", label: "Okay, I'm listening" },
  },
  {
    id: "depend",
    heading: "I've been thinking about us.",
    body: [
      "Our lives depend a lot on each other — and I don't think they should.",
      "I think we each need our own part of life. A place where you enjoy your own time and feel content on your own first — and then, after a tiring day, we come together. And that time means even more because of it.",
    ],
    interaction: { kind: "continue", label: "Keep going" },
  },
  {
    id: "boundaries-truth",
    heading: "You once said something I can't forget.",
    body: [
      '“I don’t know who I am without you.”',
      "And it's true — I think for both of us. We never really set boundaries. And the few we did set, we crossed them anyway, out of love, telling ourselves it was okay.",
    ],
    interaction: { kind: "continue", label: "Continue" },
  },
  {
    id: "pune",
    image: "/photos/placeholder-1.jpg",
    imageAlt: "Us, back in Pune",
    heading: "Remember Pune, in the beginning?",
    body: [
      "We'd meet once a day, spend real, good time together — and then you'd go home, and we wouldn't even text or call. We just met again the next day.",
      "You went to college, spent time with your friends, then came to me. You went home, did your chores, studied, did the things you love — without me in all of it.",
      "And we were good. We were full.",
    ],
    interaction: { kind: "continue", label: "I remember" },
  },
  {
    id: "me",
    image: "/photos/placeholder-2.jpg",
    imageAlt: "Me, being honest",
    heading: "And I have to be honest about me too.",
    body: [
      "I think I need space for myself as well. Lately I've been feeling low. Without talking to you, my day feels strange — I feel lonely.",
      "Even when I could talk to other people, I don't — I'd rather talk to you. And if you're busy, I feel bad that I didn't get to. I don't really have friends here anymore.",
      "If you've noticed, I spend most of my time after work on a Gmeet with you. I don't want to put all of that weight on you — that isn't fair to either of us.",
    ],
    surprise: "hearts",
    interaction: { kind: "continue", label: "Keep going" },
  },
  {
    id: "reveal-note",
    heading: "So here's what I really want you to know.",
    body: ["Tap to read it."],
    interaction: {
      kind: "reveal",
      label: "Open the note",
      // Write your most personal line here ↓
      hidden:
        "I don't want you to shrink to be loved by me — and I don't want to lean my whole world on you either. I want us both whole on our own, and then together.",
    },
  },
  {
    id: "boundaries",
    heading: "So here's what I'd love us to try.",
    body: [
      "Our own lives first — your friends, your studies, the things that are only yours. Mine too: I'll work on building a life here that isn't just us.",
      "Then, at the end of the day, we come back to each other — not out of habit or fear of being alone, but because we want to.",
      "And we get to say 'I need a little space' without it ever meaning something is wrong.",
    ],
    interaction: { kind: "continue", label: "I like that" },
  },
  {
    id: "input-need",
    heading: "Now I want to hear you.",
    body: [
      "What do you need from me to feel more like yourself again? Say it plainly — I really want to know.",
    ],
    interaction: {
      kind: "input",
      prompt: "Type whatever's true.",
      placeholder: "I need…",
      storageKey: "need",
    },
  },
  {
    id: "input-you",
    image: "/photos/placeholder-3.jpg",
    imageAlt: "You, being completely you",
    heading: "And one more.",
    body: [
      "What's something that's just yours — that makes you feel like you, with or without me?",
    ],
    interaction: {
      kind: "input",
      prompt: "There are no small answers here.",
      placeholder: "When I'm most myself, I'm…",
      storageKey: "yourself",
    },
  },
  {
    id: "ask",
    heading: "So — gently —",
    body: [
      "Can we try this, together? No pressure, no grand promises. Just a little more space, and a lot more honesty.",
    ],
    interaction: {
      kind: "choice",
      prompt: "However you feel is okay.",
      options: [
        { label: "Yes, let's try", response: "That means everything. Thank you." },
        { label: "I need to think", response: "Take all the time you want. I'm not going anywhere." },
        { label: "Let's talk first", response: "Yes. Whenever you're ready, I'm here." },
      ],
    },
  },
  {
    id: "finale",
    heading: `Thank you for reading, ${STORY_CONFIG.herName}.`,
    body: [
      "Whatever happens next, I want you to feel like the most 'you' you've ever been — and I want to be better for myself too.",
      "Here's what you told me along the way. I'm keeping it close.",
    ],
    surprise: "hearts",
    interaction: { kind: "finale", signoff: `Always, ${STORY_CONFIG.yourName}` },
  },
];
