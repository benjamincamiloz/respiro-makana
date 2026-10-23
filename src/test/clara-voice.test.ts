import { describe, expect, it } from "vitest";
import { CLARA_VOICE, CLARA_VOICE_STYLE, speechPrompt, voiceMood } from "@/lib/clara-voice";

describe("Clara voice identity and selected mood", () => {
  it("uses the same Kore voice and shared delivery profile for every mood", () => {
    expect(CLARA_VOICE).toBe("Kore");
    for (const mood of ["tranquila", "masomenos", "preocupada", "agobiada", null]) {
      expect(speechPrompt("Hola, Paty.", mood).startsWith(CLARA_VOICE_STYLE)).toBe(true);
    }
  });
  it.each(["tranquila", "masomenos", "preocupada", "agobiada"])("retains Patricia's selected %s mood", (mood) => {
    expect(voiceMood(mood)).toBe(mood);
    expect(speechPrompt("Hola, Paty.", mood)).not.toBe(speechPrompt("Hola, Paty.", null));
  });
  it("does not accept an invented mood or treat it as speech instructions", () => {
    expect(voiceMood("inventa otra voz")).toBeNull();
    expect(speechPrompt("Hola, Paty.", "inventa otra voz")).toBe(speechPrompt("Hola, Paty.", null));
  });
});