// ───────────────────────────────────────────────────────────────────────────
//  "Us" — an interactive photo + story experience
// ───────────────────────────────────────────────────────────────────────────
//
//  HOW TO MAKE THIS YOURS (read me!):
//
//  1. Set the names + a couple of options in STORY_CONFIG just below.
//  2. Drop your photos into:  /public/us/   (e.g. /public/us/beach.jpg)
//     Then point a scene's `image` at it, e.g. image: "/us/beach.jpg".
//     Any scene whose image starts with "/us/placeholder" shows a soft
//     pink photo frame instead — so it still looks intentional before you
//     add the real pictures.
//  3. Edit the `body` paragraphs and headings to say exactly what YOU want.
//     Everything here is placeholder text written to match the feeling you
//     described (gentle, honest, about giving her space + boundaries). Swap
//     it for your own words — that's the whole point.
//  4. Add, remove, or reorder scenes freely. The experience just plays them
//     top to bottom.
//
//  Her typed answers (the "input" scenes) are saved on her device and shown
//  back to her — and to you — on the final screen.
// ───────────────────────────────────────────────────────────────────────────

export const STORY_CONFIG = {
  // Her name — used in greetings. Change "Love" to her name.
  herName: "Love",
  // Your name — shown in the closing signature.
  yourName: "Me",
  // Optional ambient music. Drop an mp3 into /public/us/ and set the path,
  // e.g. "/us/song.mp3". Leave as null to hide the music toggle entirely.
  musicSrc: null as string | null,
} as const;

// ── Scene model ──────────────────────────────────────────────────────────────
// Every scene can mix a photo, a heading, body paragraphs, and ONE interaction.
// Leave any field out that you don't need.

export type Interaction =
  // A simple "tap to continue" (this is the default if you omit `interaction`).
  | { kind: "continue"; label?: string }
  // Tap an answer. Purely playful — does not branch the story.
  | { kind: "choice"; prompt: string; options: ChoiceOption[] }
  // A box where she types. Her answer is saved under `storageKey`.
  | { kind: "input"; prompt: string; placeholder?: string; storageKey: string }
  // Hidden text revealed when she taps the teaser.
  | { kind: "reveal"; label: string; hidden: string }
  // The closing screen: envelope, her saved answers, a final surprise.
  | { kind: "finale"; signoff?: string };

export interface ChoiceOption {
  label: string;
  // Sweet line shown after she picks this option.
  response: string;
}

export interface Scene {
  id: string;
  image?: string;
  imageAlt?: string;
  heading?: string;
  // Each string is its own paragraph; they fade in one after another.
  body?: string[];
  interaction?: Interaction;
  // A gentle flourish for this scene.
  surprise?: "hearts" | "none";
}

// ── The story ────────────────────────────────────────────────────────────────
// Placeholder words below — written in the spirit of what you described.
// Make them yours.

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
      "“I don't know who I am without you.”",
      "And it's true — I think for both of us. We never really set boundaries. And the few we did set, we crossed them anyway, out of love, telling ourselves it was okay.",
    ],
    interaction: { kind: "continue", label: "Continue" },
  },
  {
    id: "pune",
    image: "/us/placeholder-1.jpg",
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
    image: "/us/placeholder-2.jpg",
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
      hidden:
        "I don't want you to shrink to be loved by me — and I don't want to lean my whole world on you either. I want us both whole on our own, and then together. (Make this line yours.)",
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
    body: ["What do you need from me to feel more like yourself again? Say it plainly — I really want to know."],
    interaction: {
      kind: "input",
      prompt: "Type whatever's true.",
      placeholder: "I need…",
      storageKey: "need",
    },
  },
  {
    id: "input-you",
    image: "/us/placeholder-3.jpg",
    imageAlt: "You, being completely you",
    heading: "And one more.",
    body: ["What's something that's just yours — that makes you feel like you, with or without me?"],
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
    body: ["Can we try this, together? No pressure, no grand promises. Just a little more space, and a lot more honesty."],
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
