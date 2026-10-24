import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { applyWeek, weekKey, type PisoState } from "@/lib/piso";
import { APORTE, aportar, rescatar, type FrascoState } from "@/lib/frasco";
import { perfilDe, PERFILES, unidades, type Perfil, type PerfilId, type PerfilState } from "@/lib/perfil";
import { aviso, apartarHoy, ahorroPosible, masBarato, proximos, DIAS, type Compromiso } from "@/lib/semana";
import { claraWelcome, statementName, statementVoiceSummary } from "@/lib/clara";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import {
  Camera, FileText, Wind, Home as HomeIcon, Play, Pause, Eye, EyeOff,
  ShoppingBag, X, ArrowRight, Mic, Moon, ShieldCheck, User, Pill, Shirt, MessageCircle, Send, Loader2, Volume2,
  CalendarDays, Plus, Trash2, Bell, Smile, Meh, Frown, Angry, Heart, PiggyBank, MapPin, Flag, Check, RotateCcw,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Respiro — Cuidemos tu tranquilidad hoy" },
      { name: "description", content: "Respiro traduce tus pagos en días de aire ganados, sin cifras que asusten." },
      { property: "og:title", content: "Respiro — Cuidemos tu tranquilidad hoy" },
      { property: "og:description", content: "Tus pagos traducidos en días de aire ganados y ahorro de intereses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: App,
});

const clp = (n: number) => "$" + Math.round(n).toLocaleString("es-CL");

type Cartola = { id: string; name: string; debt: number; min: number; interest: number };

function calc(extra: number, c: Cartola, SALE: number) {
  const r = extra / SALE; // ventas
  return { days: Math.round(r * 140 - r * r * 8), saved: Math.round(extra * (c.debt / c.min) * 0.45) };
}

type MoodId = "tranquila" | "masomenos" | "preocupada" | "agobiada";
const MOODS: { id: MoodId; label: string; note: string; icon: LucideIcon }[] = [
  { id: "tranquila", label: "Tranquila", note: "Qué bueno, Paty. Aprovechemos esta calma para ordenar tus pagos con tiempo.", icon: Smile },
  { id: "masomenos", label: "Más o menos", note: "Está bien no estar al cien. Hoy avanzamos a tu ritmo, sin apuro.", icon: Meh },
  { id: "preocupada", label: "Preocupada", note: "Lo importante es que no estás sola. Vamos a mirar esto juntas, paso a paso.", icon: Frown },
  { id: "agobiada", label: "Agobiada", note: "Respira hondo conmigo. Hoy solo miramos lo esencial; el resto puede esperar.", icon: Angry },
];

const GREETING: Record<MoodId, string> = {
  tranquila: "Qué bueno verte así, Patricia.",
  masomenos: "Hola Patricia, hoy vamos a tu ritmo.",
  preocupada: "Hola Patricia, estás bien resguardada.",
  agobiada: "Patricia, respira hondo. Aquí no pasa nada.",
};

type Reaction = { title: string; text: string; action?: string; kind: "sos" | "clara" | null };
const REACTION: Record<MoodId, Reaction> = {
  tranquila: { title: "Buen día para ordenar", text: "Con esta calma es más fácil ganarle días de aire al banco.", kind: null },
  masomenos: { title: "A tu ritmo", text: "Hoy miramos solo lo justo. Si algo te apura, respiramos juntos primero.", action: "Respirar 60 segundos", kind: "sos" },
  preocupada: { title: "No estás sola", text: "Clara te acompaña en lo que te tenga inquieta hoy, sin juzgarte.", action: "Hablar con Clara", kind: "clara" },
  agobiada: { title: "Primero respira", text: "Antes de mirar números, tomemos 60 segundos juntos. El resto espera.", action: "Respirar 60 segundos", kind: "sos" },
};

type Screen = "animo" | "inicio" | "medidor" | "frasco" | "camino" | "semana" | "clara";

function App() {
  const [screen, setScreen] = useState<Screen>("animo");
  const [mood, setMood] = useState<MoodId | null>(null);
  const [cartola, setCartola] = useState<Cartola | null>(null);
  const [sos, setSos] = useState(false);
  const [perfilState, setPerfilState] = useState<PerfilState | null>(null);
  const [items, setItems] = useState<Compromiso[]>([]);
  useEffect(() => {
    try {
      const a = localStorage.getItem("respiro-perfil"); if (a) setPerfilState(JSON.parse(a) as PerfilState);
      const b = localStorage.getItem("respiro-semana"); if (b) setItems(JSON.parse(b) as Compromiso[]);
    } catch { /* sin datos guardados */ }
  }, []);
  const perfil = perfilDe(perfilState);
  const savePerfil = (s: PerfilState) => { setPerfilState(s); try { localStorage.setItem("respiro-perfil", JSON.stringify(s)); } catch { /* */ } };
  const saveItems = (s: Compromiso[]) => { setItems(s); try { localStorage.setItem("respiro-semana", JSON.stringify(s)); } catch { /* */ } };
  const load = (c: Cartola) => { setCartola(c); setScreen("medidor"); };

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-20 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between px-5 py-3">
          <button onClick={() => setScreen("inicio")} className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Wind className="h-5 w-5" /></span>
            <span className="font-display text-xl text-secondary">Respiro</span>
          </button>
          <span className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
            <ShieldCheck className="h-3.5 w-3.5" /> Datos protegidos
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-md px-5 pb-44 pt-6">
        {screen === "animo" ? (
          <Animo onPick={(m) => { setMood(m); setScreen("inicio"); }} />
        ) : screen === "inicio" ? (
          <Inicio mood={mood} onChangeMood={() => setScreen("animo")} onLoad={load} onOpenSos={() => setSos(true)} onClara={() => setScreen("clara")} items={items} onSemana={() => setScreen("semana")} />
        ) : screen === "clara" ? (
          <ClaraChat mood={mood} cartola={cartola} onPause={() => setSos(true)} onPayments={() => setScreen("medidor")} onStatement={() => setScreen("inicio")} />
        ) : screen === "frasco" ? (
          <Frasco mood={mood} />
        ) : screen === "semana" ? (
          <Semana mood={mood} perfil={perfil} onPerfil={savePerfil} items={items} onItems={saveItems} />
        ) : screen === "camino" ? (
          <Camino p={perfil} cartola={cartola} mood={mood} goInicio={() => setScreen("inicio")} />
        ) : (
          <Medidor p={perfil} cartola={cartola} mood={mood} goInicio={() => setScreen("inicio")} />
        )}
      </main>

      {screen !== "clara" && screen !== "animo" && <button onClick={() => setSos(true)}
        className="fixed bottom-24 left-1/2 z-20 flex w-[calc(100%-2.5rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-full bg-warm px-5 py-3.5 text-left font-bold text-warm-foreground shadow-soft transition hover:scale-[1.02]">
        <Moon className="h-5 w-5 shrink-0" /> Pausa Nocturna (Tu momento libre)
      </button>}

      {screen !== "animo" && (
        <nav className="fixed inset-x-0 bottom-0 z-20 border-t bg-card/95 backdrop-blur">
          <div className="mx-auto flex max-w-md">
            {[
              { id: "inicio" as const, label: "Inicio", icon: HomeIcon },
              { id: "medidor" as const, label: "Mi aire", icon: Wind },
              { id: "frasco" as const, label: "Frasco", icon: PiggyBank },
              { id: "semana" as const, label: "Mi semana", icon: CalendarDays },
              { id: "camino" as const, label: "Camino", icon: MapPin },
              { id: "clara" as const, label: "Clara", icon: MessageCircle },
            ].map((t) => (
              <button key={t.id} onClick={() => setScreen(t.id)}
                className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-bold transition ${screen === t.id ? "text-primary" : "text-muted-foreground"}`}>
                <t.icon className="h-6 w-6" /> {t.label}
              </button>
            ))}
          </div>
        </nav>
      )}

      {sos && <PausaSOS onClose={() => setSos(false)} />}
    </div>
  );
}

function Inicio({ mood, onChangeMood, onLoad, onOpenSos, onClara, items, onSemana }: { mood: MoodId | null; onChangeMood: () => void; onLoad: (c: Cartola) => void; onOpenSos: () => void; onClara: () => void; items: Compromiso[]; onSemana: () => void }) {
  const [hoy, setHoy] = useState<number | null>(null);
  useEffect(() => setHoy(new Date().getDay()), []);
  const av = hoy === null ? null : aviso(items, hoy);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pin, setPin] = useState("");
  const [pinErr, setPinErr] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const m = mood ? MOODS.find((x) => x.id === mood) : null;
  const r = mood ? REACTION[mood] : null;
  const upload = async (f: File) => {
    setPendingFile(null); setPin(""); setPinErr(false);
    setFileName(f.name); setErr(null);
    try {
      const fd = new FormData(); fd.append("file", f);
      const res = await fetch("/api/cartola", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "No pude leerla");
      onLoad(j as Cartola);
    } catch (x) { setErr(x instanceof Error ? x.message : "No pude leerla"); }
    finally { setFileName(null); }
  };
  const abrir = () => {
    if (!pendingFile) return;
    if (pin !== "7890") { setPinErr(true); return; }
    void upload(pendingFile);
  };
  return (
    <section className="animate-rise space-y-6">
      {m && (
        <button onClick={onChangeMood}
          className="flex w-full items-center gap-3 rounded-3xl bg-calm px-4 py-3 text-left text-calm-foreground transition active:scale-95">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/15"><m.icon className="h-5 w-5" /></span>
          <span className="text-sm font-semibold">Hoy te sientes <b>{m.label.toLowerCase()}</b></span>
          <span className="ml-auto text-xs font-bold underline underline-offset-2">Cambiar</span>
        </button>
      )}
      <div className="flex items-center gap-3 rounded-3xl bg-card p-4 shadow-soft">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground"><User className="h-6 w-6" /></div>
        <p className="font-semibold">Patricia, 58 años<br /><span className="text-sm text-muted-foreground">Cuidadora y vendedora de catálogo en Talca</span></p>
      </div>
      <div className="relative mx-auto flex h-32 w-32 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-accent animate-breathe" />
        <Wind className="relative h-12 w-12 text-primary" />
      </div>
      <h1 className="text-center text-3xl leading-tight">{mood ? GREETING[mood] : "Hola Patricia, respira hondo."}<br /><span className="text-secondary">Cuidemos tu tranquilidad hoy.</span></h1>
      {m && <p className="animate-rise text-center font-semibold text-secondary">{m.note}</p>}
      {r && (
        <div className="animate-rise rounded-3xl bg-card p-5 shadow-soft">
          <p className="font-bold">{r.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{r.text}</p>
          {r.action && r.kind === "sos" && (
            <button onClick={onOpenSos} className="mt-3 w-full rounded-full bg-warm py-3 font-bold text-warm-foreground transition active:scale-95">{r.action}</button>
          )}
          {r.action && r.kind === "clara" && (
            <button onClick={onClara} className="mt-3 w-full rounded-full bg-primary py-3 font-bold text-primary-foreground transition active:scale-95">{r.action}</button>
          )}
        </div>
      )}
      {av && mood !== "agobiada" && (
        <button onClick={onSemana} className="animate-rise flex w-full items-start gap-3 rounded-3xl bg-calm p-4 text-left text-calm-foreground">
          <Bell className="mt-0.5 h-6 w-6 shrink-0" />
          <span className="text-sm font-semibold">{av} <span className="underline">Ver mi semana</span></span>
        </button>
      )}
      <p className="text-center text-muted-foreground">Sube tu cartola y yo me encargo de leerla. Tú solo verás lo que te da aire.</p>

      <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]; e.target.value = "";
          if (!f) return;
          setErr(null); setPin(""); setPinErr(false); setPendingFile(f);
        }} />
      <button onClick={() => fileRef.current?.click()} disabled={!!fileName || !!pendingFile}
        className="flex w-full items-center justify-center gap-3 rounded-3xl bg-primary px-6 py-6 text-xl font-extrabold text-primary-foreground shadow-soft transition active:scale-95 disabled:opacity-70">
        <Camera className="h-7 w-7" /> {fileName ? "Leyendo con calma…" : "Subir foto o PDF de cartola"}
      </button>
      {fileName && <p className="animate-rise text-center text-sm text-muted-foreground">Estoy leyendo “{fileName}” por ti. Puede tardar unos segundos.</p>}
      {err && <p className="text-center text-sm font-semibold text-warm">{err}. Intenta con una foto más nítida.</p>}

      {pendingFile && (
        <div className="animate-rise space-y-4 rounded-3xl bg-card p-5 shadow-soft">
          <p className="flex items-center gap-2 font-bold"><ShieldCheck className="h-5 w-5 text-primary" /> Tu cartola viene con clave</p>
          <p className="text-sm text-muted-foreground">Escribe los <b>últimos 4 dígitos de tu RUT</b> para abrir “{pendingFile.name}”. <span className="font-semibold">(En esta demo: 7890)</span></p>
          <input
            value={pin}
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 4)); setPinErr(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") abrir(); }}
            inputMode="numeric" autoComplete="off" placeholder="••••" aria-label="Clave de la cartola"
            className={`w-full rounded-2xl border-2 bg-background px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] outline-none transition ${pinErr ? "border-warm" : "border-border focus:border-primary"}`} />
          {pinErr && <p className="animate-rise text-center text-sm font-semibold text-warm">Esa clave no coincide con esta cartola. Revisa los últimos 4 dígitos de tu RUT.</p>}
          <button onClick={abrir} disabled={pin.length !== 4}
            className="w-full rounded-full bg-primary py-3.5 font-bold text-primary-foreground transition active:scale-95 disabled:opacity-50">
            Abrir mi cartola
          </button>
          <button onClick={() => { setPendingFile(null); setPin(""); setPinErr(false); }}
            className="w-full text-sm font-bold text-muted-foreground underline">Cancelar, subir otra</button>
        </div>
      )}

    </section>
  );
}

function Animo({ onPick }: { onPick: (m: MoodId) => void }) {
  return (
    <section className="animate-rise flex min-h-[70vh] flex-col justify-center py-6 text-center">
      <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-accent animate-breathe" />
        <Heart className="relative h-10 w-10 text-primary" />
      </div>
      <h1 className="mt-6 text-3xl leading-tight">¿Cómo te sientes hoy, Paty?</h1>
      <p className="mt-2 text-muted-foreground">Sin respuesta correcta. Solo quiero saber cómo acompañarte hoy.</p>
      <div className="mt-8 grid grid-cols-2 gap-3">
        {MOODS.map((m) => (
          <button key={m.id} onClick={() => onPick(m.id)}
            className="flex flex-col items-center gap-2.5 rounded-3xl border-2 border-border bg-card p-5 shadow-soft transition hover:border-primary active:scale-95">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground"><m.icon className="h-8 w-8" /></span>
            <span className="font-bold">{m.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

type Ventas = "bajas" | "normales" | "buenas";

function Medidor({ p, cartola, mood, goInicio }: { p: Perfil; cartola: Cartola | null; mood: MoodId | null; goInicio: () => void }) {
  const SALE = p.valor;
  const [ventas, setVentas] = useState<Ventas | null>(null);
  const [extra, setExtra] = useState(2 * SALE);
  const [detail, setDetail] = useState(false);
  const [pisoState, setPisoState] = useState<PisoState | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("respiro-piso");
      if (raw) setPisoState(JSON.parse(raw) as PisoState);
    } catch { /* sin piso guardado aún */ }
  }, []);
  if (!cartola) {
    return (
      <div className="animate-rise space-y-4 pt-16 text-center">
        <Wind className="mx-auto h-12 w-12 text-primary" />
        <p className="text-lg">Aún no tenemos tu cartola. Sin apuro.</p>
        <button onClick={goInicio} className="rounded-full bg-primary px-6 py-4 font-bold text-primary-foreground">Subir mi cartola</button>
      </div>
    );
  }
  const c = cartola;
  const piso = pisoState?.piso ?? 0;
  const maxExtra = piso + (ventas === "buenas" ? 3 : 2);
  const { days, saved } = calc(extra, c, SALE);
  const sales = Math.round(extra / SALE);
  const record = (stepVentas: number) => {
    const { state, pisoUp } = applyWeek(pisoState, weekKey(), stepVentas);
    setPisoState(state);
    try { localStorage.setItem("respiro-piso", JSON.stringify(state)); } catch { /* sin almacenamiento */ }
    if (pisoUp) setCelebrate(true);
  };
  const pick = (v: Ventas) => {
    setVentas(v);
    if (v === "bajas") { setExtra(0); record(0); }
    else { setExtra((piso + 1) * SALE); record(piso + 1); }
  };

  return (
    <section className="animate-rise space-y-5">
      <div className="flex items-start gap-3 rounded-3xl bg-accent p-5 text-accent-foreground">
        <ShieldCheck className="mt-1 h-7 w-7 shrink-0" />
        <p className="font-semibold">{mood === "agobiada"
          ? "Hoy solo lo esencial: cuánto pagar y cuánto aire ganas. La letra chica puede esperar otro día."
          : mood === "preocupada"
            ? "No estás sola en esto. Un paso a la vez: primero tus ventas, después el pago."
            : `${statementName(c.name) ? `Miremos tu cartola de ${statementName(c.name)} con calma.` : "Miremos tu cartola con calma."} Antes de elegir un pago, cuidemos lo que necesitan tu mamá, tu casa y tú.`}</p>
      </div>

      <VoiceNote mood={mood} text={statementVoiceSummary(mood, c)} />

      <div className="rounded-3xl bg-card p-5 shadow-soft">
        <p className="font-extrabold">{p.id === "catalogo" ? "¿Cómo estuvieron tus ventas de catálogo esta semana?" : p.id === "app" ? "¿Cómo estuvo tu semana de viajes?" : "¿Cómo estuvo tu semana de pedidos?"}</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {(["bajas", "normales", "buenas"] as const).map((v) => (
            <button key={v} onClick={() => pick(v)}
              className={`rounded-2xl border-2 py-3 font-bold capitalize transition ${ventas === v ? "border-primary bg-accent text-accent-foreground" : "border-border"}`}>{v}</button>
          ))}
        </div>
      </div>

      {celebrate && piso > 0 && (
        <div className="animate-rise rounded-3xl bg-accent p-5 text-center text-accent-foreground">
          <Wind className="mx-auto h-8 w-8" />
          <p className="mt-2 text-lg font-bold">¡Tu piso subió!</p>
          <p className="mt-1 text-sm">Llevas semanas seguidas sumando tu paso. Tu pago de base ahora es <b>{clp(c.min + piso * SALE)}</b>, para siempre. Así, sin apuro, se sale del bucle.</p>
        </div>
      )}
      {piso > 0 && ventas !== "bajas" && (
        <div className="flex items-center gap-3 rounded-3xl bg-calm p-4 text-calm-foreground">
          <Wind className="h-6 w-6 shrink-0" />
          <p className="text-sm font-semibold">Tu piso de aire: pagas <b>{clp(c.min + piso * SALE)}</b> de base, con {unidades(piso, p)} ya {piso === 1 ? "sumado" : "sumados"}. Ya no tienes que pensarlo.</p>
        </div>
      )}

      {ventas === "bajas" && (
        <div className="animate-rise space-y-3 rounded-3xl bg-calm p-6 text-center text-calm-foreground">
          <ShieldCheck className="mx-auto h-10 w-10" />
          <p className="text-lg font-bold">Esta semana protegemos tu caja: pagamos el mínimo seguro y no sumamos ninguna cuota nueva.</p>
          <p>Pagas <b>{clp(c.min)}</b>. Sin sobregirarte. La próxima semana vemos si ganamos más aire.</p>
          {piso > 0 && <p className="text-sm">Y tu piso queda guardado: cuando la semana mejore, seguimos desde ahí.</p>}
        </div>
      )}

      {(ventas === "normales" || ventas === "buenas") && (
        <div className="animate-rise rounded-3xl bg-card p-6 text-center shadow-soft">
          <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Tus días de respiración</p>
          <div className="relative mx-auto my-4 flex h-44 w-44 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-accent animate-breathe" style={{ transform: `scale(${0.7 + days / 1400})` }} />
            <div className="relative">
              <p className="font-display text-5xl text-primary">+{days}</p>
              <p className="font-bold text-accent-foreground">días de aire</p>
            </div>
          </div>
          <p className="text-lg">Pagas <b>{clp(c.min + extra)}</b> este mes</p>
          <p className="text-muted-foreground">{saved > 0 ? <>Te ahorras <b className="text-primary">{clp(saved)}</b> en intereses</> : <>Le regalas {clp(c.interest)} de interés al banco</>}</p>
          <input type="range" min={piso * SALE} max={maxExtra * SALE} step={SALE} value={Math.min(Math.max(extra, piso * SALE), maxExtra * SALE)}
            onChange={(e) => setExtra(Number(e.target.value))} aria-label="Extra destinado al pago"
            className="mt-6 h-3 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary" />
          <div className="mt-1 flex justify-between text-xs font-semibold text-muted-foreground">
            {Array.from({ length: maxExtra - piso + 1 }, (_, i) => <span key={i}>{i === 0 ? (piso > 0 ? "Tu piso" : "Mínimo") : `+${unidades(i, p)}`}</span>)}
          </div>
          {extra > 0 && (
            <div className="mt-5 flex gap-3 rounded-3xl bg-warm p-4 text-left text-warm-foreground">
              <ShoppingBag className="mt-1 h-6 w-6 shrink-0" />
              <p className="font-semibold">Esos {clp(extra)} extra son solo <b>{unidades(sales, p)}</b> ({p.ejemplo}). Solo si te queda libre después de lo de la casa.</p>
            </div>
          )}
        </div>
      )}

      {mood === "agobiada" ? (
        <p className="text-center text-sm text-muted-foreground">Hoy no necesitas el detalle técnico: tu caja está cuidada y el resto puede esperar.</p>
      ) : (
        <>
          <button onClick={() => setDetail(!detail)} className="mx-auto flex items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:underline">
            {detail ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {detail ? "Ocultar" : "Ver"} detalle técnico
          </button>
          {detail && (
            <dl className="animate-rise grid grid-cols-2 gap-2 rounded-2xl bg-muted p-4 text-sm">
              <dt>Deuda</dt><dd className="text-right font-bold">{clp(c.debt)}</dd>
              <dt>Pago mínimo</dt><dd className="text-right font-bold">{clp(c.min)}</dd>
              <dt>Interés mensual (solo mínimo)</dt><dd className="text-right font-bold">{clp(c.interest)}</dd>
            </dl>
          )}
        </>
      )}
    </section>
  );
}

function Frasco({ mood }: { mood: MoodId | null }) {
  const [state, setState] = useState<FrascoState | null>(null);
  const [askRescue, setAskRescue] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("respiro-frasco");
      if (raw) setState(JSON.parse(raw) as FrascoState);
    } catch { /* sin frasco guardado aún */ }
  }, []);
  const save = (s: FrascoState) => {
    setState(s);
    try { localStorage.setItem("respiro-frasco", JSON.stringify(s)); } catch { /* sin almacenamiento */ }
  };
  const saved = state?.saved ?? 0;
  const goal = state?.goal ?? 90000;
  const pct = Math.min(1, saved / goal);
  const full = saved >= goal;
  const add = () => {
    const { state: s, added } = aportar(state, weekKey());
    save(s);
    setNote(added
      ? (s.saved >= s.goal ? "¡Frasco lleno! Ya tienes tu colchón para los sustos." : "Guardado. De a poquito se llena el frasco.")
      : "Esta semana ya guardaste. La próxima sumamos otro poquito.");
  };
  const rescue = (monto: number, para: string) => {
    const { state: s, taken } = rescatar(state, monto);
    save(s); setAskRescue(false);
    setNote(taken > 0
      ? `Usaste ${clp(taken)} para ${para}. Para eso es el frasco: usaste tu plata, no la tarjeta.`
      : "El frasco está vacío por ahora. Empecemos a llenarlo de a poquito.");
  };
  return (
    <section className="animate-rise space-y-5">
      <div className="flex items-start gap-3 rounded-3xl bg-accent p-5 text-accent-foreground">
        <PiggyBank className="mt-1 h-7 w-7 shrink-0" />
        <p className="font-semibold">{mood === "agobiada"
          ? "Este es tu frasco de los sustos. No hay que hacer nada hoy: solo mira cómo va."
          : "Tu frasco de imprevistos: un colchón chiquito para que el próximo susto no vuelva a la tarjeta."}</p>
      </div>

      <div className="rounded-3xl bg-card p-6 text-center shadow-soft">
        <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Mi frasco</p>
        <div className="relative mx-auto mt-4 h-48 w-32 overflow-hidden rounded-b-[3rem] rounded-t-xl border-4 border-secondary/30 bg-muted">
          <div className="absolute inset-x-0 bottom-0 bg-primary/80 transition-all duration-700" style={{ height: `${Math.max(4, pct * 100)}%` }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className={`font-display text-3xl ${pct > 0.45 ? "text-primary-foreground" : "text-primary"}`}>{clp(saved)}</p>
            <p className={`text-xs font-bold ${pct > 0.45 ? "text-primary-foreground" : "text-muted-foreground"}`}>de {clp(goal)}</p>
          </div>
        </div>
        <p className="mt-4 text-muted-foreground">
          {full
            ? "Frasco lleno. Los remedios de la mamá o una sorpresa ya no te quitan el sueño."
            : saved === 0
              ? "Empecemos con un poquito esta semana. De a poquito se llena."
              : `Llevas ${clp(saved)} guardados. Si pasa algo, estás cubierta.`}
        </p>
        {state && state.rescues > 0 && (
          <p className="mt-2 text-sm font-semibold text-secondary">Ya te salvó {state.rescues} {state.rescues === 1 ? "vez" : "veces"} de usar la tarjeta.</p>
        )}
      </div>

      {note && <p className="animate-rise rounded-3xl bg-calm p-4 text-center text-sm font-semibold text-calm-foreground">{note}</p>}

      {!askRescue ? (
        <div className="space-y-3">
          <button onClick={add} disabled={full}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-lg font-bold text-primary-foreground transition active:scale-95 disabled:opacity-50">
            <PiggyBank className="h-5 w-5" /> {full ? "Frasco lleno" : `Guardar ${clp(APORTE)} esta semana`}
          </button>
          <button onClick={() => setAskRescue(true)}
            className="w-full rounded-full border-2 border-border py-3.5 font-bold text-secondary transition active:scale-95">
            Necesito usar el frasco
          </button>
        </div>
      ) : (
        <div className="animate-rise space-y-3 rounded-3xl bg-card p-5 shadow-soft">
          <p className="font-bold">¿Para qué lo necesitas?</p>
          <button onClick={() => rescue(30000, "los remedios de la mamá")}
            className="flex w-full items-center gap-3 rounded-2xl border-2 border-border p-4 text-left font-semibold transition hover:border-primary">
            <Pill className="h-6 w-6 shrink-0 text-primary" /> Remedios de la mamá ({clp(30000)})
          </button>
          <button onClick={() => rescue(saved, "un imprevisto")}
            className="flex w-full items-center gap-3 rounded-2xl border-2 border-border p-4 text-left font-semibold transition hover:border-primary">
            <ShieldCheck className="h-6 w-6 shrink-0 text-primary" /> Otro imprevisto (lo que haya: {clp(saved)})
          </button>
          <button onClick={() => setAskRescue(false)} className="w-full text-sm font-bold text-muted-foreground underline">Mejor no, era solo un antojo</button>
        </div>
      )}

      <p className="text-center text-sm text-muted-foreground">Usar el frasco no es perder: es exactamente para lo que lo llenaste.</p>
    </section>
  );
}

const PARADAS = 10;

function Camino({ p, cartola, mood, goInicio }: { p: Perfil; cartola: Cartola | null; mood: MoodId | null; goInicio: () => void }) {
  const SALE = p.valor;
  const [extra, setExtra] = useState(0);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("respiro-camino");
      if (raw) setExtra(Math.max(0, Number(JSON.parse(raw)) || 0));
    } catch { /* sin camino guardado aún */ }
  }, []);
  if (!cartola) {
    return (
      <section className="animate-rise space-y-5">
        <div className="flex items-start gap-3 rounded-3xl bg-accent p-5 text-accent-foreground">
          <Flag className="mt-1 h-7 w-7 shrink-0" />
          <p className="font-semibold">Tu camino de salida parte con tu cartola. La subimos juntas y armamos las paradas con tus números reales.</p>
        </div>
        <div className="rounded-3xl bg-card p-6 text-center shadow-soft">
          <MapPin className="mx-auto h-12 w-12 text-primary" />
          <p className="mt-3 text-lg">Aquí armaremos tu camino, parada por parada.</p>
          <button onClick={goInicio} className="mt-4 rounded-full bg-primary px-6 py-4 font-bold text-primary-foreground">Subir mi cartola</button>
        </div>
      </section>
    );
  }
  const debt = cartola.debt;
  const tramo = debt / PARADAS;
  const done = Math.min(PARADAS, Math.floor(extra / tramo));
  const restante = Math.max(0, debt - Math.min(extra, debt));
  const ventasRestantes = Math.ceil(restante / SALE);
  const mark = (v: number) => {
    setExtra(v);
    try { localStorage.setItem("respiro-camino", JSON.stringify(v)); } catch { /* sin almacenamiento */ }
  };
  return (
    <section className="animate-rise space-y-5">
      <div className="flex items-start gap-3 rounded-3xl bg-accent p-5 text-accent-foreground">
        <Flag className="mt-1 h-7 w-7 shrink-0" />
        <p className="font-semibold">{mood === "agobiada"
          ? "Este es tu camino de salida. Hoy solo míralo: hay una salida y vas avanzando."
          : "Tu camino de salida: la deuda grande se vuelve un viaje con paradas, y cada {p.unidad} extra te acerca a la siguiente."}</p>
      </div>

      <div className="rounded-3xl bg-card p-6 shadow-soft">
        <p className="text-center text-sm font-bold uppercase tracking-wider text-muted-foreground">Mi camino</p>
        <p className="mt-1 text-center text-lg font-bold text-secondary">
          {done === 0 ? "Estás en la partida" : done >= PARADAS ? "¡Llegaste! Camino completo." : `Vas en la parada ${done} de ${PARADAS}`}
        </p>
        <div className="relative mx-auto mt-6 max-w-[16rem]">
          <div className="absolute bottom-5 left-1/2 top-5 w-1 -translate-x-1/2 rounded-full bg-muted" />
          <div className="space-y-4">
            {Array.from({ length: PARADAS }, (_, i) => {
              const n = PARADAS - i; // la parada 1 queda abajo, la 10 arriba
              const reached = n <= done;
              const next = n === done + 1;
              return (
                <div key={n} className="relative flex items-center gap-3">
                  <span className={`z-10 mx-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 font-bold transition ${
                    reached ? "border-primary bg-primary text-primary-foreground" : next ? "border-primary bg-accent text-accent-foreground" : "border-border bg-card text-muted-foreground"}`}>
                    {reached ? <Check className="h-5 w-5" /> : n}
                  </span>
                  <span className={`absolute left-[calc(50%+2rem)] whitespace-nowrap text-sm font-semibold ${next ? "text-primary" : "text-muted-foreground"}`}>
                    {n === PARADAS ? "¡Libre de la tarjeta!" : next ? "Tu próxima parada" : reached ? "Ya pasaste" : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <p className="mt-6 text-center text-muted-foreground">
          {done >= PARADAS
            ? "La tarjeta quedó atrás. Este camino lo hiciste tú, de a poquito."
            : <>Cada parada son <b>{clp(tramo)}</b> pagados sobre el mínimo. Te faltan <b>{unidades(ventasRestantes, p)}</b> para llegar al final.</>}
        </p>
      </div>

      {done < PARADAS && (
        <div className="flex gap-3 rounded-3xl bg-warm p-4 text-left text-warm-foreground">
          <ShoppingBag className="mt-1 h-6 w-6 shrink-0" />
          <p className="font-semibold">Cada {p.unidad} extra que sumes en “Mi aire” te acerca una parada. Sin apuro: el camino no se borra.</p>
        </div>
      )}

      <div className="flex justify-center gap-3 text-xs">
        <button onClick={() => mark(extra + SALE)} className="font-semibold text-muted-foreground underline underline-offset-2">Marcar {p.unidad === "venta" ? "una venta extra pagada" : `un ${p.unidad} extra pagado`}</button>
        {extra > 0 && (
          <button onClick={() => mark(0)} className="flex items-center gap-1 font-semibold text-muted-foreground underline underline-offset-2"><RotateCcw className="h-3 w-3" /> Empezar de nuevo</button>
        )}
      </div>
    </section>
  );
}

const audioCache = new Map<string, string>();
let current: HTMLAudioElement | null = null;

function useSpeech(text: string, mood: MoodId | null = null) {
  const [state, setState] = useState<"idle" | "loading" | "playing">("idle");
  const [p, setP] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const ref = useRef<HTMLAudioElement | null>(null);
  useEffect(() => () => { ref.current?.pause(); }, []);
  async function toggle() {
    if (state === "playing") { ref.current?.pause(); setState("idle"); return; }
    if (state === "loading") return;
    setErr(null);
    try {
      const cacheKey = JSON.stringify([text, mood]);
      let url = audioCache.get(cacheKey);
      if (!url) {
        setState("loading");
        const res = await fetch("/api/voz", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, mood }) });
        if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || "No pude generar la voz"); }
        url = URL.createObjectURL(await res.blob()); audioCache.set(cacheKey, url);
      }
      current?.pause();
      const a = ref.current && ref.current.src === url ? ref.current : new Audio(url);
      ref.current = a; current = a;
      a.ontimeupdate = () => setP(a.duration ? a.currentTime / a.duration : 0);
      a.onended = () => { setState("idle"); setP(0); };
      a.onpause = () => setState((s) => (s === "playing" ? "idle" : s));
      await a.play(); setState("playing");
    } catch (x) { setState("idle"); setErr(x instanceof Error ? x.message : "No pude generar la voz"); }
  }
  return { state, p, err, toggle, time: ref.current ? Math.floor(ref.current.currentTime) : 0 };
}

function VoiceNote({ text, mood }: { text: string; mood: MoodId | null }) {
  const { state, p, err, toggle, time } = useSpeech(text, mood);
  const bars = [4, 9, 14, 7, 12, 18, 10, 6, 15, 11, 8, 16, 5, 12, 9, 14, 7, 10, 13, 6, 11, 8];
  return (
    <div className="rounded-3xl bg-calm p-4 text-calm-foreground">
      <div className="flex items-center gap-3">
        <button onClick={toggle} aria-label={state === "playing" ? "Pausar" : "Escuchar"}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          {state === "loading" ? <Loader2 className="h-5 w-5 animate-spin" /> : state === "playing" ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-sm font-bold"><Mic className="h-4 w-4" /> {state === "loading" ? "Clara está grabando tu audio…" : "Escuchar resumen de voz de Clara"}</p>
          <div className="mt-2 flex h-5 items-end gap-0.5">
            {bars.map((h, i) => (
              <span key={i} className={`w-1 rounded-full transition-colors ${i / bars.length < p ? "bg-secondary" : "bg-secondary/30"}`} style={{ height: h }} />
            ))}
            <span className="ml-2 text-xs font-semibold">0:{String(time % 60).padStart(2, "0")}</span>
          </div>
        </div>
      </div>
      {err && <p className="mt-2 text-sm font-semibold">{err}</p>}
    </div>
  );
}

function SpeakButton({ text, mood }: { text: string; mood: MoodId | null }) {
  const { state, toggle, err } = useSpeech(text, mood);
  return (
    <button onClick={toggle} title={err ?? undefined} aria-label="Escuchar a Clara"
      className="mt-1 flex items-center gap-1 text-xs font-bold text-muted-foreground">
      {state === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : state === "playing" ? <Pause className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
      {err ? "No se pudo" : state === "playing" ? "Pausar" : "Escuchar"}
    </button>
  );
}

function PausaSOS({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [moment, setMoment] = useState<string | null>(null);
  const [left, setLeft] = useState(60);
  useEffect(() => {
    if (step !== 1 || left <= 0) return;
    const id = setTimeout(() => setLeft((v) => v - 1), 1000);
    return () => clearTimeout(id);
  }, [step, left]);
  const phase = (60 - left) % 10 < 4 ? "Inhala…" : "Exhala despacio…";
  const moments = [
    { day: "Miércoles", t: "Remedios de la mamá en 3 cuotas", icon: Pill },
    { day: "Sábado", t: "Ropa para el nieto en 6 cuotas (“porque se lo merece”)", icon: Shirt },
  ];
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-foreground/30 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="animate-rise w-full max-w-md rounded-t-[2rem] bg-card p-6 pb-8 shadow-soft sm:rounded-[2rem]">
        <div className="mb-4 flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-bold text-muted-foreground"><Moon className="h-4 w-4" /> Pausa de las 22:30</p>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-full p-2 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>

        {step === 0 && (
          <div key="0" className="animate-rise space-y-4">
            <h2 className="text-2xl">Pausa Nocturna (Tu momento libre)</h2>
            <p className="text-muted-foreground">Cuidar a tu mamá es agotador. ¿Qué compra te está tentando ahora?</p>
            {moments.map((m) => (
              <button key={m.day} onClick={() => { setMoment(m.t); setStep(1); setLeft(60); }}
                className="flex w-full gap-3 rounded-2xl border-2 border-border p-4 text-left transition hover:border-primary">
                <m.icon className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
                <span><b>{m.day}</b><br /><span className="text-sm">{m.t}</span></span>
              </button>
            ))}
            <button onClick={() => { setMoment(null); setStep(1); setLeft(60); }} className="w-full text-sm font-bold text-muted-foreground underline">Otra cosa, solo necesito calmarme</button>
          </div>
        )}
        {step === 1 && (
          <div key="1" className="animate-rise space-y-5 text-center">
            <h2 className="text-2xl">60 segundos antes de pasar la tarjeta</h2>
            {moment && <p className="text-sm text-muted-foreground">“{moment}” puede esperar un minuto.</p>}
            <div className="relative mx-auto flex h-36 w-36 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-accent animate-breathe" />
              <div className="relative"><p className="font-display text-4xl text-primary">{left}</p><p className="text-sm font-bold">{left > 0 ? phase : "Listo"}</p></div>
            </div>
            <button onClick={() => setStep(2)} disabled={left > 0}
              className="w-full rounded-full bg-primary py-4 text-lg font-bold text-primary-foreground disabled:opacity-50">
              {left > 0 ? "Respira conmigo…" : "Ya respiré"}
            </button>
          </div>
        )}
        {step === 2 && (
          <div key="2" className="animate-rise space-y-4">
            <h2 className="text-2xl">Ahora decides con calma</h2>
            <div className="rounded-2xl bg-accent p-4 text-accent-foreground">
              {moment?.startsWith("Remedios")
                ? "Los remedios son necesarios: pregunta en la farmacia por precio al contado o Fonasa antes de sumar 3 cuotas."
                : moment?.startsWith("Ropa")
                  ? "Tu nieto merece tu tiempo: una videollamada con cuento esta noche vale más que 6 cuotas."
                  : "Date estos minutos solo tuyos. Mañana lo miras con ojos frescos."}
            </div>
            <button onClick={onClose} className="w-full rounded-full bg-primary py-4 text-lg font-bold text-primary-foreground">Me quedo con el aire</button>
          </div>
        )}
      </div>
    </div>
  );
}


type Msg = { role: "user" | "assistant"; content: string };

function getDevice() {
  let id = localStorage.getItem("respiro-device");
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("respiro-device", id); }
  return id;
}

function ClaraChat({ mood, cartola, onPause, onPayments, onStatement }: { mood: MoodId | null; cartola: Cartola | null; onPause: () => void; onPayments: () => void; onStatement: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasSent = useRef(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/clara?device=${getDevice()}`).then((r) => r.json()).then((d) => {
      if (active && !hasSent.current && Array.isArray(d)) setMsgs(d);
    }).catch(() => {});
    inputRef.current?.focus();
    return () => { active = false; };
  }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  async function send(t: string) {
    const v = t.trim(); if (!v || busy) return;
    hasSent.current = true;
    setText(""); setErr(null); setBusy(true);
    setMsgs((m) => [...m, { role: "user", content: v }]);
    try {
      const res = await fetch("/api/clara", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ device: getDevice(), text: v, mood: mood ?? null, statement: cartola ? { name: cartola.name, debt: cartola.debt, min: cartola.min, interest: cartola.interest } : null }) });
      if (!res.ok || !res.body) { const j = await res.json().catch(() => ({})); throw new Error(j.error || "Clara no pudo responder"); }
      const reader = res.body.getReader(); const dec = new TextDecoder(); let acc = "";
      setMsgs((m) => [...m, { role: "assistant", content: "" }]);
      for (;;) {
        const { done, value } = await reader.read(); if (done) break;
        acc += dec.decode(value, { stream: true });
        setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: acc }]);
      }
      if (!acc.trim()) throw new Error("Clara no pudo responder");
    } catch (x) {
      setMsgs((m) => (m.at(-1)?.role === "assistant" && !m.at(-1)?.content ? m.slice(0, -1) : m));
      setErr(x instanceof Error ? x.message : "Clara no pudo responder");
    } finally { setBusy(false); inputRef.current?.focus(); }
  }

  const hello = claraWelcome(mood);
  const base = mood === "agobiada" ? ["Necesito bajar el ritmo", "Me angustia comprar los remedios de mi mamá", "Hoy no quiero mirar cifras"]
    : mood === "preocupada" ? ["¿Qué debo cuidar antes de pagar?", "Esta semana vendí poco", "Pago y mi deuda no baja"]
    : mood === "masomenos" ? ["Necesito cuidar mi descanso", "Ayúdame a elegir un paso para hoy", "Tengo un gasto de remedios que viene"]
    : ["Quiero ordenar mi próximo pago", "¿Podría usar algún beneficio para los remedios?", "¿Cómo avanzo sin volver a endeudarme?"];
  const ideas = ["Quiero conversar sobre cómo está mi mamá", "Estoy cansada de cuidar y necesito un respiro", "Quiero organizar el cuidado con mi familia", ...base, "Quiero comprar algo, ¿lo necesito de verdad?"];

  return (
    <section className="animate-rise flex min-h-[60vh] flex-col">
      <div className="mb-4 flex items-center gap-3 border-b pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-display text-xl">C</div>
        <p className="font-semibold">Clara<br /><span className="text-sm text-muted-foreground">Tu guía de bienestar · IA</span></p>
      </div>
      <div className="mb-4 flex flex-wrap gap-2" aria-label="Herramientas de bienestar">
        <Button variant="outline" onClick={onPause}><Moon /> Mi pausa</Button>
        <Button variant="outline" onClick={onPayments}><Wind /> Mi aire</Button>
        <Button variant="outline" onClick={onStatement}><FileText /> Mi cartola</Button>
      </div>
      <div className="flex-1 space-y-3">
        <div className="space-y-1">
          <p className="rounded-3xl rounded-tl-md bg-accent p-4 text-accent-foreground">{hello}</p>
          <SpeakButton text={hello} mood={mood} />
        </div>
        {msgs.length === 0 && (
          <div className="space-y-2">
            {ideas.map((i) => <Button key={i} variant="outline" onClick={() => send(i)} disabled={busy} className="h-auto w-full justify-between whitespace-normal py-3 text-left">{i}<ArrowRight className="shrink-0" /></Button>)}
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex flex-col items-start"}>
            <p className={`max-w-[85%] whitespace-pre-wrap rounded-3xl p-4 ${m.role === "user" ? "rounded-tr-md bg-primary text-primary-foreground" : "rounded-tl-md bg-accent text-accent-foreground"}`}>
              {m.content || "…"}
            </p>
            {m.role === "assistant" && m.content && !(busy && i === msgs.length - 1) && <SpeakButton text={m.content} mood={mood} />}
          </div>
        ))}
        {busy && msgs.at(-1)?.role === "user" && <p className="w-fit rounded-3xl bg-accent px-4 py-3 text-accent-foreground">Clara está escribiendo…</p>}
        {err && <p className="text-sm font-semibold text-warm">{err}</p>}
        <div ref={endRef} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="sticky bottom-20 mt-4 flex items-end gap-2 rounded-3xl border bg-card p-2 shadow-soft">
        <textarea ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} rows={1}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text); } }}
          placeholder="Escríbele a Clara…" className="max-h-32 flex-1 resize-none bg-transparent px-3 py-2 outline-none" />
        <Button type="submit" disabled={busy || !text.trim()} aria-label="Enviar" size="icon" className="h-11 w-11 shrink-0 rounded-full"><Send className="h-5 w-5" /></Button>
      </form>
    </section>
  );
}

function Semana({ mood, perfil, onPerfil, items, onItems }: { mood: MoodId | null; perfil: Perfil; onPerfil: (s: PerfilState) => void; items: Compromiso[]; onItems: (s: Compromiso[]) => void }) {
  const [hoy, setHoy] = useState<number | null>(null);
  useEffect(() => setHoy(new Date().getDay()), []);
  const [adding, setAdding] = useState(false);
  const [nombre, setNombre] = useState("");
  const [dia, setDia] = useState(3);
  const [monto, setMonto] = useState("");
  const [remedio, setRemedio] = useState(true);
  const [precioFor, setPrecioFor] = useState<string | null>(null);
  const [lugar, setLugar] = useState("");
  const [precio, setPrecio] = useState("");
  const num = (v: string) => Number(v.replace(/\D/g, "")) || 0;
  const lista = hoy === null ? [] : proximos(items, hoy);
  const apartar = hoy === null ? 0 : apartarHoy(items, hoy);
  const av = hoy === null ? null : aviso(items, hoy);
  const add = () => {
    if (!nombre.trim() || num(monto) <= 0) return;
    onItems([...items, { id: crypto.randomUUID(), nombre: nombre.trim().slice(0, 60), dia, monto: num(monto), remedio, precios: [] }]);
    setNombre(""); setMonto(""); setAdding(false);
  };
  const addPrecio = (id: string) => {
    if (!lugar.trim() || num(precio) <= 0) return;
    onItems(items.map((c) => c.id === id ? { ...c, precios: [...c.precios.filter((x) => x.lugar.toLowerCase() !== lugar.trim().toLowerCase()), { lugar: lugar.trim().slice(0, 40), monto: num(precio) }] } : c));
    setLugar(""); setPrecio(""); setPrecioFor(null);
  };
  const field = "w-full rounded-2xl border-2 border-border bg-background px-4 py-3 outline-none focus:border-primary";
  return (
    <section className="animate-rise space-y-5">
      <div className="flex items-start gap-3 rounded-3xl bg-accent p-5 text-accent-foreground">
        <CalendarDays className="mt-1 h-7 w-7 shrink-0" />
        <p className="font-semibold">{mood === "agobiada"
          ? "Aquí miramos lo que viene, sin apuro. Hoy basta con saber qué día toca cada cosa."
          : "Adelantémonos: anota lo que sí o sí viene esta semana y te aviso antes, para que la plata no se vaya en otra cosa."}</p>
      </div>

      {av && <p className="flex items-start gap-3 rounded-3xl bg-calm p-4 text-sm font-semibold text-calm-foreground"><Bell className="mt-0.5 h-5 w-5 shrink-0" /> {av}</p>}
      {apartar > 0 && (
        <div className="rounded-3xl bg-card p-5 text-center shadow-soft">
          <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Para los próximos 3 días</p>
          <p className="mt-1 font-display text-4xl text-primary">{clp(apartar)}</p>
          <p className="mt-1 text-sm text-muted-foreground">Si hoy entra plata, separa esto primero. Es {unidades(Math.ceil(apartar / perfil.valor), perfil)} aprox.</p>
        </div>
      )}

      <div className="space-y-3">
        {lista.length === 0 && !adding && <p className="rounded-3xl bg-card p-5 text-center text-muted-foreground shadow-soft">Aún no anotas nada. Empieza por lo que más te preocupa, como los remedios de tu mamá.</p>}
        {lista.map((c) => {
          const b = c.remedio ? masBarato(c.precios) : null;
          const ah = ahorroPosible(c.precios);
          return (
            <div key={c.id} className="rounded-3xl bg-card p-5 shadow-soft">
              <div className="flex items-start gap-3">
                {c.remedio ? <Pill className="mt-0.5 h-6 w-6 shrink-0 text-primary" /> : <CalendarDays className="mt-0.5 h-6 w-6 shrink-0 text-primary" />}
                <div className="flex-1">
                  <p className="font-bold">{c.nombre}</p>
                  <p className="text-sm text-muted-foreground">Cada {DIAS[c.dia]} · {c.en === 0 ? "hoy" : c.en === 1 ? "mañana" : `en ${c.en} días`} · {clp(b?.monto ?? c.monto)}</p>
                </div>
                <button aria-label={`Quitar ${c.nombre}`} onClick={() => onItems(items.filter((x) => x.id !== c.id))} className="text-muted-foreground"><Trash2 className="h-4 w-4" /></button>
              </div>
              {c.remedio && (
                <div className="mt-3 space-y-2 rounded-2xl bg-muted p-3 text-sm">
                  {c.precios.length === 0
                    ? <p>Anota cuánto cuesta en cada farmacia (Dr. Simi, la del barrio, la farmacia comunal). Así te muestro dónde sale más barato.</p>
                    : [...c.precios].sort((x, y) => x.monto - y.monto).map((x) => (
                      <p key={x.lugar} className="flex justify-between"><span>{x.lugar}{b && x.lugar === b.lugar && ah > 0 ? " · más barato" : ""}</span><b>{clp(x.monto)}</b></p>
                    ))}
                  {ah > 0 && <p className="font-semibold text-primary">Comprando en {b?.lugar} te ahorras {clp(ah)}. Esa diferencia puede ir a tu frasco.</p>}
                  <p className="text-xs text-muted-foreground">Pregunta en la farmacia por el bioequivalente (sello amarillo) y por los precios de la farmacia comunal o del convenio de tu salud. Nunca cambies un remedio sin preguntarle al médico o al químico farmacéutico.</p>
                  {precioFor === c.id ? (
                    <div className="space-y-2 pt-1">
                      <input className={field} placeholder="Farmacia (ej: Dr. Simi)" value={lugar} onChange={(e) => setLugar(e.target.value)} />
                      <input className={field} inputMode="numeric" placeholder="Precio que viste" value={precio} onChange={(e) => setPrecio(e.target.value)} />
                      <button onClick={() => addPrecio(c.id)} className="w-full rounded-full bg-primary py-2.5 font-bold text-primary-foreground">Guardar precio</button>
                    </div>
                  ) : (
                    <button onClick={() => { setPrecioFor(c.id); setLugar(""); setPrecio(""); }} className="flex items-center gap-1 font-bold text-primary"><Plus className="h-4 w-4" /> Anotar un precio</button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {adding ? (
        <div className="animate-rise space-y-3 rounded-3xl bg-card p-5 shadow-soft">
          <p className="font-bold">¿Qué viene sí o sí?</p>
          <input className={field} placeholder="Ej: remedios de la mamá" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <select className={field} value={dia} onChange={(e) => setDia(Number(e.target.value))} aria-label="Día">
            {DIAS.map((d, i) => <option key={d} value={i}>Cada {d}</option>)}
          </select>
          <input className={field} inputMode="numeric" placeholder="Cuánto cuesta aprox." value={monto} onChange={(e) => setMonto(e.target.value)} />
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={remedio} onChange={(e) => setRemedio(e.target.checked)} className="h-5 w-5 accent-primary" /> Es un remedio (quiero comparar farmacias)</label>
          <button onClick={add} className="w-full rounded-full bg-primary py-3.5 font-bold text-primary-foreground">Guardar</button>
          <button onClick={() => setAdding(false)} className="w-full text-sm font-bold text-muted-foreground underline">Cancelar</button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary py-3.5 font-bold text-primary"><Plus className="h-5 w-5" /> Anotar algo que viene</button>
      )}

      <div className="space-y-3 rounded-3xl bg-card p-5 shadow-soft">
        <p className="font-bold">¿De qué viene tu plata extra?</p>
        <div className="grid gap-2">
          {(Object.keys(PERFILES) as PerfilId[]).map((id) => (
            <button key={id} onClick={() => onPerfil({ id, valor: PERFILES[id].valorInicial })}
              className={`rounded-2xl border-2 p-3 text-left font-semibold transition ${perfil.id === id ? "border-primary bg-accent text-accent-foreground" : "border-border"}`}>{PERFILES[id].label}</button>
          ))}
        </div>
        <label className="block text-sm font-semibold">¿Cuánto te queda libre por cada {perfil.unidad}?
          <input className={`${field} mt-1`} inputMode="numeric" value={perfil.valor.toLocaleString("es-CL")}
            onChange={(e) => onPerfil({ id: perfil.id, valor: num(e.target.value) })} />
        </label>
        <p className="text-xs text-muted-foreground">Mi aire y tu camino se cuentan en {perfil.plural}, con lo que tú anotes.</p>
      </div>
    </section>
  );
}
