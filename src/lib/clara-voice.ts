import type { ClaraMood } from "@/lib/clara";

export const CLARA_VOICE = "Kore";
export const CLARA_VOICE_STYLE = "Mantén siempre la misma voz femenina de Clara: cercana, suave y conversada, como una amiga adulta que acompaña a Patricia. Español de Chile natural, sin caricaturizar el acento. Ritmo sereno y fluido, volumen parejo, pausas breves y calidez genuina. Nunca suenes como locutora, publicidad, lectura robótica ni terapeuta solemne. No cambies de personaje, timbre o acento entre audios. Lee solo el texto indicado, sin agregar palabras ni leer estas instrucciones.";

export function voiceMood(value: unknown): ClaraMood | null {
  return value === "tranquila" || value === "masomenos" || value === "preocupada" || value === "agobiada" ? value : null;
}

export function speechPrompt(text: string, value: unknown): string {
  const mood = voiceMood(value);
  const delivery = mood === "tranquila" ? "En el saludo, destaca con una alegría suave que hoy se siente tranquila."
    : mood === "masomenos" ? "En el saludo, destaca con comprensión que hoy se siente más o menos, sin forzar alegría."
    : mood === "preocupada" ? "En el saludo, destaca con empatía que hoy se siente preocupada, sin sonar alarmada."
    : mood === "agobiada" ? "En el saludo, destaca suavemente que hoy se siente agobiada; deja una pausa breve para acompañarla, sin dramatizar."
    : "No supongas un estado de ánimo.";
  return `${CLARA_VOICE_STYLE}\n${delivery} Conserva esa misma identidad vocal durante el resto del mensaje. No pronuncies nombres de emojis ni símbolos.\nTexto a leer:\n${text.trim()}`;
}