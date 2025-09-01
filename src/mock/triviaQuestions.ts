export interface TriviaQuestion {
  question: string;
  opponentAnswer: string;
}

export const triviaQuestions: TriviaQuestion[] = [
  { question: "What's your favorite hobby?", opponentAnswer: "Hiking" },
  { question: "Favorite game of all time?", opponentAnswer: "Zelda" },
  { question: "Dream travel destination?", opponentAnswer: "Japan" },
  { question: "Morning or night person?", opponentAnswer: "Night" },
  { question: "Cats or dogs?", opponentAnswer: "Dogs" },
  { question: "Go-to comfort food?", opponentAnswer: "Pizza" },
  { question: "Favorite movie genre?", opponentAnswer: "Sci-fi" },
  { question: "What's your creative outlet?", opponentAnswer: "Music" },
  { question: "Favorite childhood toy?", opponentAnswer: "Lego" },
  { question: "Coffee or tea?", opponentAnswer: "Coffee" },
];
