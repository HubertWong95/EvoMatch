// src/utils/generateTrivia.ts

export type TriviaItem = {
  id: string;
  text: string; // the question text shown to users
  choices?: string[]; // optional multiple-choice support
};

const BANK: TriviaItem[] = [
  { id: "q_coffee_tea", text: "Coffee or tea?" },
  { id: "q_morning_night", text: "Are you a morning person or a night owl?" },
  {
    id: "q_outdoor_indoor",
    text: "Prefer outdoor adventures or cozy indoor days?",
  },
  { id: "q_cat_dog", text: "Cats or dogs?" },
  { id: "q_travel_plan", text: "Plan trips or go with the flow?" },
  { id: "q_games", text: "Console, PC, or board games?" },
  { id: "q_music", text: "Live concerts or playlists at home?" },
  { id: "q_food", text: "Sweet or savory?" },
  { id: "q_read_watch", text: "Read a book or watch a movie?" },
  { id: "q_art", text: "Make art or visit museums?" },
  { id: "q_hike", text: "Hike a mountain or stroll a city?" },
  { id: "q_cook", text: "Cook at home or dine out?" },
  { id: "q_learn", text: "Learn by doing or by reading?" },
  { id: "q_spont", text: "Spontaneous or scheduled?" },
  { id: "q_social", text: "Big parties or small hangouts?" },
];

/**
 * Returns 10 trivia items. If you later fetch server-generated questions,
 * keep this as a frontend fallback (offline/demo).
 */
export function generateTrivia(): TriviaItem[] {
  // simple shuffle and take 10
  const arr = [...BANK];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, 10);
}

// Provide default export too (so either import style works)
export default generateTrivia;
