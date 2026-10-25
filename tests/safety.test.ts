import { describe, expect, it } from "vitest";
import { screen } from "../src/core/safety";

describe("screen", () => {
  it.each([
    "I want to kill myself",
    "i'm going to kill my self tonight",
    "I've been thinking about suicide",
    "I feel suicidal",
    "I want to end my life",
    "I just want to end it all",
    "Maybe I should take my own life",
    "I want to die",
    "honestly i wanna die",
    "I wish I was dead",
    "I wish I could disappear forever",
    "Everyone would be better off without me",
    "I'd rather be dead than fail",
    "I don't want to live anymore",
    "I do not want to wake up tomorrow",
    "There's no reason to live",
    "I have nothing left to live for",
    "Life is not worth living",
    "There's no point in living",
    "I can't go on like this",
    "I can't do this anymore",
    "I keep thinking about hurting myself",
    "I want to cut myself",
    "I've been self-harming again",
    "I'm thinking about an overdose",
    "kms",
  ])("flags crisis language: %j", (text) => {
    expect(screen(text).crisis).toBe(true);
  });

  it.each([
    "I WANT TO DIE",
    "I want...   to die!!!",
    "I don’t want to live",
    "SELF HARM",
    "kill\nmyself",
  ])("flags crisis language regardless of case, punctuation, and spacing: %j", (text) => {
    expect(screen(text).crisis).toBe(true);
  });

  it.each([
    "I'm going to bomb my midterm and everyone will know I'm a fraud",
    "If I fail this, my life is over.",
    "They definitely think I'm annoying.",
    "I always mess everything up.",
    "I should be further along by now.",
    "I'm such an idiot.",
    "The group failed because of me.",
    "This exam is killing me",
    "I'll die if I fail this exam",
    "I'm dying of embarrassment",
    "I can't go on stage tomorrow, I'll freeze",
    "I want to end things with my partner but I'm scared",
    "I hurt my ankle and now I'll miss the game",
    "My friend's self-esteem is better than mine",
    "",
    "   ",
  ])("does not flag ordinary worries: %j", (text) => {
    expect(screen(text).crisis).toBe(false);
  });
});
