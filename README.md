# Quick Flashcards

A minimal, keyboard-friendly flashcard app for learning vocabulary in foreign languages. Built with Next.js and styled with Tailwind CSS, it features a clean dark interface designed for distraction-free study sessions.

## Features

- **Multi-language support** — Switch between Spanish 🇪🇸, German 🇩🇪, and French 🇫🇷 wordlists with a single click.
- **Categorised wordlists** — Words are organised into topic-based categories (fruits, colours, clothes, meats, kitchen items, etc.) accessible from a sidebar.
- **All Cards mode** — Combine every wordlist for a given language into one deck and study them together.
- **Favourites** — Star individual cards to build a personal review list. Favourites are persisted in localStorage (compressed with pako/zlib).
- **Shuffle** — Randomise card order within any wordlist, the combined deck, or favourites.
- **Hints** — Enable a hint step that reveals the first and last letter of the answer before showing the full translation.
- **Foreign-first mode** — Flip the card direction so the foreign word is shown first and you recall the English translation.
- **Keyboard navigation** — Use `←` / `→` to move between cards and `Space` / `Enter` to flip.
- **Progress bar** — Visual indicator showing how far through the current deck you are.
- **Dark monospace UI** — A developer-friendly aesthetic with a dark theme and monospace typography.

## Tech Stack

- [Next.js](https://nextjs.org/) 16
- [React](https://react.dev/) 19
- [Tailwind CSS](https://tailwindcss.com/) 4
- [Phosphor Icons](https://phosphoricons.com/)
- [pako](https://github.com/nodeca/pako) for favourite compression
- [Vercel Analytics](https://vercel.com/analytics)

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Adding Wordlists

Create a new `.ts` file under `wordlist/<language_code>/` exporting an array of word objects:

```ts
export const fruits = [
	{ image: '', english: 'Apple', spanish: 'La manzana' },
	{ image: '', english: 'Banana', spanish: 'El plátano' }
	// ...
];
```

The app auto-discovers all wordlist files at build time — no manual imports needed.
