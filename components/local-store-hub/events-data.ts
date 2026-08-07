export interface Event {
  id: string;
  category: string;
  dateTime: string;
  title: string;
  description: string;
}

export const events: Event[] = [
  {
    id: "friday-night-magic",
    category: "Weekly",
    dateTime: "Fri • 6:00 PM",
    title: "Friday Night Magic",
    description:
      "Join our weekly Magic: The Gathering tournament for casual play, prizes, and store credit.",
  },
  {
    id: "warhammer-open-play",
    category: "Open Play",
    dateTime: "Sat • 1:00 PM",
    title: "Warhammer 40k Open Play",
    description:
      "Bring your army and play casual games on our open tables with local players.",
  },
  {
    id: "dnd-adventure-night",
    category: "One-Shot",
    dateTime: "Sun • 4:00 PM",
    title: "D&D Adventure Night",
    description:
      "A guided one-shot for new and returning players with pre-made characters and snacks.",
  },
  {
    id: "board-game-tournament",
    category: "Tournament",
    dateTime: "Thu • 7:00 PM",
    title: "Board Game Tournament",
    description:
      "Competitive board game night with rotating titles, prizes, and a relaxed tournament format.",
  },
];