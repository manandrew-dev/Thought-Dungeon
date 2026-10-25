import type { DistortionId } from "../core/types";

// Mock of content/distortions.json (Khan): display fields only, from requirements §4.2.
export interface DistortionInfo {
  id: DistortionId;
  name: string;
  creature: string;
  blurb: string;
  example: string;
}

export const DISTORTIONS: DistortionInfo[] = [
  { id: "catastrophizing", name: "Catastrophizing", creature: "Doomwyrm", blurb: "Jumping to the worst possible outcome.", example: "If I fail this, my life is over." },
  { id: "mind_reading", name: "Mind Reading", creature: "Whisperer", blurb: "Assuming you know what others are thinking.", example: "They definitely think I'm annoying." },
  { id: "fortune_telling", name: "Fortune Telling", creature: "Oracle Moth", blurb: "Predicting things will go badly.", example: "I just know it'll go badly." },
  { id: "all_or_nothing", name: "All-or-Nothing Thinking", creature: "Splitter", blurb: "Seeing things as all good or all bad.", example: "If it's not perfect, it's worthless." },
  { id: "overgeneralization", name: "Overgeneralization", creature: "Echo Slime", blurb: "Treating one event as a never-ending pattern.", example: "I always mess everything up." },
  { id: "should_statements", name: "Should Statements", creature: "Shouldgeist", blurb: "Holding yourself to rigid rules.", example: "I should be further along by now." },
  { id: "labeling", name: "Labeling", creature: "Tagling", blurb: "Defining yourself by a single harsh label.", example: "I'm such an idiot." },
  { id: "emotional_reasoning", name: "Emotional Reasoning", creature: "Fogling", blurb: "Treating a feeling as proof of a fact.", example: "I feel useless, so I must be." },
  { id: "personalization", name: "Personalization", creature: "Mirror Imp", blurb: "Taking the blame for things outside your control.", example: "The group failed because of me." },
  { id: "mental_filter", name: "Mental Filter", creature: "Shadow Sieve", blurb: "Focusing only on the negative details.", example: "The one bad comment is all that matters." },
];

export const distortionById = (id: DistortionId) => DISTORTIONS.find((d) => d.id === id)!;
