import type { DistortionId, Move } from "../core/types";

// Mock of content/moves.json (Khan).
export const MOVES: Move[] = [
  { id: "examine_evidence", name: "Examine the Evidence", question: "What facts support this thought? What facts don't?", distortions: "any", basePower: 22 },
  { id: "friend_advice", name: "Talk to a Friend", question: "What would you say to a friend who had this thought?", distortions: "any", basePower: 20 },
  { id: "zoom_out", name: "Zoom Out", question: "How much will this matter in a week? In a year?", distortions: "any", basePower: 18 },
  { id: "alternative_view", name: "Another Angle", question: "What is another way of looking at this situation?", distortions: "any", basePower: 20 },
  { id: "past_coping", name: "Remember Coping", question: "When have you got through something like this before?", distortions: "any", basePower: 18 },
  { id: "cost_benefit", name: "Weigh It Up", question: "How does holding onto this thought help you? How does it hurt?", distortions: "any", basePower: 16 },
  { id: "likely_outcome", name: "Shrink the Storm", question: "What is the most likely outcome, realistically?", distortions: ["catastrophizing", "fortune_telling"], basePower: 26 },
  { id: "worst_best_likely", name: "Worst, Best, Likely", question: "What's the worst that could happen, the best, and the most likely?", distortions: ["catastrophizing"], basePower: 28 },
];

export const moveById = (id: string) => MOVES.find((m) => m.id === id);

export const movePool = (distortion: DistortionId) =>
  MOVES.filter((m) => m.distortions === "any" || m.distortions.includes(distortion));
