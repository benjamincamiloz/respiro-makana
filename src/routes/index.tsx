import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Camera, FileText, Sparkles, Wind, Home as HomeIcon, Heart, Play, Pause, Eye, EyeOff,
  ShoppingBag, X, ArrowRight, Phone, Footprints, Mic, Leaf, ShieldCheck,
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

const MIN = 59000;
const clp = (n: number) => "$" + Math.round(n).toLocaleString("es-CL");

// Puntos de referencia: extra sobre el mínimo -> días de aire, ahorro en intereses
const POINTS = [
  { extra: 0, days: 0, saved: 0 },
  { extra: 18000, days: 420, saved: 323800 },
  { extra: 59000, days: 570, saved: 435600 },
];
function calc(extra: number) {
  const i = extra <= 18000 ? 0 : 1;
  const a = POINTS[i]!, b = POINTS[i + 1]!;
  const t = (extra - a.extra) / (b.extra - a.extra);
  return { days: Math.round(a.days + t * (b.days - a.days)), saved: Math.round(a.saved + t * (b.saved - a.saved)) };
}

type Screen = "inicio" | "medidor";

function App() {
  const [screen, setScreen] = useState<Screen>("inicio");
  const [loaded, setLoaded] = useState(false);
  const [sos, setSos] = useState(false);

  const load = () => { setLoaded(true); setScreen("medidor"); };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-md px-5 pb-40 pt-8">
        {screen === "inicio" ? <Inicio onLoad={load} /> : <Medidor loaded={loaded} onLoad={load} />}
      </main>

      <button
        onClick={() => setSos(true)}
        className="fixed bottom-24 left-1/2 z-20 flex w-[calc(100%-2.5rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-full bg-warm px-5 py-3.5 text-left font-bold text-warm-foreground shadow-soft transition hover:scale-[1.02]"
      >
        <Heart className="h-5 w-5 shrink-0" /> ¿Tentada a comprar en cuotas por angustia?
      </button>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-md">
          {[
            { id: "inicio" as const, label: "Inicio", icon: HomeIcon },
            { id: "medidor" as const, label: "Mi aire", icon: Wind },
          ].map((t) => (
            <button key={t.id} onClick={() => setScreen(t.id)}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-sm font-bold transition ${screen === t.id ? "text-primary" : "text-muted-foreground"}`}>
              <t.icon className="h-6 w-6" /> {t.label}
            </button>
          ))}
          <button onClick={() => setSos(true)} className="flex flex-1 flex-col items-center gap-1 py-3 text-sm font-bold text-muted-foreground">
            <Leaf className="h-6 w-6" /> Pausa
          </button>
        </div>
      </nav>

      {sos && <PausaSOS onClose={() => setSos(false)} />}
    </div>
  );
}

function Inicio({ onLoad }: { onLoad: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  return (
    <section className="animate-rise space-y-6">
      <div className="relative mx-auto flex h-36 w-36 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-accent animate-breathe" />
        <Wind className="relative h-12 w-12 text-primary" />
      </div>
      <h1 className="text-center text-3xl leading-tight">Hola Patricia, respira hondo.<br /><span className="text-secondary">Cuidemos tu tranquilidad hoy.</span></h1>
      <p className="text-center text-muted-foreground">Sube tu cartola y yo me encargo de leerla. Tú solo verás lo que te da aire.</p>

      <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFileName(f.name); setTimeout(onLoad, 1200); } }} />
      <button onClick={() => fileRef.current?.click()}
        className="flex w-full items-center justify-center gap-3 rounded-3xl bg-primary px-6 py-6 text-xl font-extrabold text-primary-foreground shadow-soft transition active:scale-95">
        <Camera className="h-7 w-7" /> Subir foto o PDF de cartola
      </button>
      {fileName && <p className="animate-rise text-center text-sm text-muted-foreground">Leyendo “{fileName}” con calma…</p>}

      <button onClick={onLoad}
        className="flex w-full items-center gap-3 rounded-3xl border-2 border-dashed border-secondary/40 bg-calm px-5 py-4 text-left font-bold text-calm-foreground transition active:scale-95">
        <FileText className="h-6 w-6 shrink-0" />
        <span>Cargar cartola de ejemplo<br /><span className="text-sm font-semibold opacity-80">CMR Falabella · Septiembre</span></span>
        <ArrowRight className="ml-auto h-5 w-5" />
      </button>
    </section>
  );
}

function Medidor({ loaded, onLoad }: { loaded: boolean; onLoad: () => void }) {
  const [extra, setExtra] = useState(18000);
  const [detail, setDetail] = useState(false);
  if (!loaded) {
    return (
      <div className="animate-rise space-y-4 pt-16 text-center">
        <Wind className="mx-auto h-12 w-12 text-primary" />
        <p className="text-lg">Aún no tenemos tu cartola. Sin apuro.</p>
        <button onClick={onLoad} className="rounded-full bg-primary px-6 py-4 font-bold text-primary-foreground">Usar cartola de ejemplo</button>
      </div>
    );
  }
  const { days, saved } = calc(extra);
  const pay = MIN + extra;
  const sales = Math.ceil(extra / 9000);
  const options = [
    { extra: 0, title: "Pagar el mínimo", tone: "bg-muted text-muted-foreground" },
    { extra: 18000, title: "Mínimo + $18.000", tone: "bg-primary text-primary-foreground", rec: true },
    { extra: 59000, title: "Doble del mínimo", tone: "bg-secondary text-secondary-foreground" },
  ];

  return (
    <section className="animate-rise space-y-5">
      <div className="flex items-start gap-3 rounded-3xl bg-accent p-5 text-accent-foreground">
        <ShieldCheck className="mt-1 h-7 w-7 shrink-0" />
        <p className="font-semibold">Tu cuenta está al día y tu mamá está protegida. Vamos a ver cuánto aire le ganamos al banco este mes.</p>
      </div>

      <VoiceNote />

      <div className="rounded-3xl bg-card p-6 text-center shadow-soft">
        <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Tu medidor de respiración</p>
        <div className="relative mx-auto my-4 flex h-44 w-44 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-accent transition-transform duration-500 animate-breathe"
            style={{ transform: `scale(${0.7 + days / 1900})` }} />
          <div className="relative">
            <p className="font-display text-5xl text-primary">+{days}</p>
            <p className="font-bold text-accent-foreground">días de aire</p>
          </div>
        </div>
        <p className="text-lg">Pagas <b>{clp(pay)}</b> este mes</p>
        <p className="text-muted-foreground">{saved > 0 ? <>Te ahorras <b className="text-primary">{clp(saved)}</b> en intereses</> : <>Le regalas $36.500 de interés al banco</>}</p>

        <input type="range" min={0} max={59000} step={1000} value={extra}
          onChange={(e) => setExtra(Number(e.target.value))}
          aria-label="Monto extra sobre el mínimo"
          className="mt-6 h-3 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary" />
        <div className="mt-1 flex justify-between text-xs font-semibold text-muted-foreground"><span>Mínimo</span><span>Doble</span></div>
      </div>

      <div className="space-y-3">
        {options.map((o) => {
          const r = calc(o.extra); const active = extra === o.extra;
          return (
            <button key={o.extra} onClick={() => setExtra(o.extra)}
              className={`w-full rounded-3xl border-2 bg-card p-4 text-left transition ${active ? "border-primary shadow-soft" : "border-transparent"}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold">{o.title} <span className="font-semibold text-muted-foreground">({clp(MIN + o.extra)})</span></span>
                {o.rec && <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">Recomendado</span>}
              </div>
              <span className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-bold ${o.tone}`}>+{r.days} días de aire ganado</span>
              <p className="mt-2 text-sm text-muted-foreground">
                {o.extra === 0 && "Sigues en el mismo lugar y le regalas $36.500 de interés al banco este mes."}
                {o.extra === 18000 && "Te ahorras $323.800 en intereses y matas 1 cuota vieja."}
                {o.extra === 59000 && "Ahorras $435.600 en intereses y compras tranquilidad total para imprevistos."}
              </p>
            </button>
          );
        })}
      </div>

      {extra > 0 && (
        <div key={sales} className="animate-rise flex gap-3 rounded-3xl bg-warm p-5 text-warm-foreground">
          <ShoppingBag className="mt-1 h-7 w-7 shrink-0" />
          <p className="font-semibold">Esos {clp(extra)} extra son solo <b>{sales} {sales === 1 ? "venta" : "ventas"}</b> de cremas o perfumes de tu catálogo de esta semana. ¿A quién le ofrecemos hoy?</p>
        </div>
      )}

      <button onClick={() => setDetail(!detail)} className="mx-auto flex items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:underline">
        {detail ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {detail ? "Ocultar" : "Ver"} detalle técnico
      </button>
      {detail && (
        <dl className="animate-rise grid grid-cols-2 gap-2 rounded-2xl bg-muted p-4 text-sm">
          <dt>Deuda en tarjeta</dt><dd className="text-right font-bold">$1.180.000</dd>
          <dt>Pago mínimo (5%)</dt><dd className="text-right font-bold">$59.000</dd>
          <dt>Interés mensual (solo mínimo)</dt><dd className="text-right font-bold">$36.500</dd>
        </dl>
      )}
    </section>
  );
}

function VoiceNote() {
  const [playing, setPlaying] = useState(false);
  const [p, setP] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setP((v) => { if (v >= 60) { setPlaying(false); return 0; } return v + 1; }), 1000);
    return () => clearInterval(id);
  }, [playing]);
  const bars = [4, 9, 14, 7, 12, 18, 10, 6, 15, 11, 8, 16, 5, 12, 9, 14, 7, 10, 13, 6, 11, 8];
  return (
    <div className="flex items-center gap-3 rounded-3xl bg-calm p-4 text-calm-foreground">
      <button onClick={() => setPlaying(!playing)} aria-label={playing ? "Pausar" : "Escuchar"}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        {playing ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 text-sm font-bold"><Mic className="h-4 w-4" /> Escuchar resumen de voz de Clara (1 min)</p>
        <div className="mt-2 flex h-5 items-end gap-0.5">
          {bars.map((h, i) => (
            <span key={i} className={`w-1 rounded-full transition-colors ${i / bars.length < p / 60 ? "bg-secondary" : "bg-secondary/30"}`} style={{ height: h }} />
          ))}
          <span className="ml-2 text-xs font-semibold">0:{String(p % 60).padStart(2, "0")}</span>
        </div>
      </div>
    </div>
  );
}

function PausaSOS({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const gifts = [
    { icon: Phone, t: "Una videollamada con cuento", d: "Léele un cuento al nieto por videollamada esta noche." },
    { icon: Footprints, t: "Una tarde juntos", d: "Una caminata a la plaza y un helado de agua hecho en casa." },
    { icon: Sparkles, t: "Una receta tuya", d: "Enséñale a preparar tu queque o sopaipillas favoritas." },
  ];
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-foreground/30 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="animate-rise w-full max-w-md rounded-t-[2rem] bg-card p-6 pb-8 shadow-soft sm:rounded-[2rem]">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-1.5">{[0, 1, 2].map((i) => <span key={i} className={`h-2 rounded-full transition-all ${i <= step ? "w-8 bg-primary" : "w-2 bg-muted"}`} />)}</div>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-full p-2 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>

        {step === 0 && (
          <div key="0" className="animate-rise space-y-5 text-center">
            <div className="relative mx-auto h-24 w-24"><div className="absolute inset-0 rounded-full bg-accent animate-breathe" /><Heart className="relative mx-auto mt-7 h-10 w-10 text-primary" /></div>
            <h2 className="text-2xl">Sabemos que cuidar a tu mamá es agotador y te mereces un respiro.</h2>
            <p className="text-muted-foreground">Inhala en 4… sostén… exhala en 6. Aquí no hay apuro.</p>
            <button onClick={() => setStep(1)} className="w-full rounded-full bg-primary py-4 text-lg font-bold text-primary-foreground">Ya respiré</button>
          </div>
        )}
        {step === 1 && (
          <div key="1" className="animate-rise space-y-4">
            <h2 className="text-2xl">¿Es para ti o es un regalo por culpa para el nieto?</h2>
            {["Es para mí", "Es para el nieto", "No lo sé, solo quiero sentirme mejor"].map((a) => (
              <button key={a} onClick={() => { setAnswer(a); setStep(2); }}
                className="w-full rounded-2xl border-2 border-border p-4 text-left font-bold transition hover:border-primary">{a}</button>
            ))}
          </div>
        )}
        {step === 2 && (
          <div key="2" className="animate-rise space-y-4">
            <h2 className="text-2xl">Antes de pasar la tarjeta, prueba un regalo que no cuesta plata</h2>
            {answer === "Es para mí" && <p className="text-muted-foreground">También valen para ti: date 20 minutos solo tuyos.</p>}
            {gifts.map((g) => (
              <div key={g.t} className="flex gap-3 rounded-2xl bg-accent p-4 text-accent-foreground">
                <g.icon className="mt-0.5 h-6 w-6 shrink-0" /><div><p className="font-bold">{g.t}</p><p className="text-sm">{g.d}</p></div>
              </div>
            ))}
            <button onClick={onClose} className="w-full rounded-full bg-primary py-4 text-lg font-bold text-primary-foreground">Gracias, me quedo con el aire</button>
          </div>
        )}
      </div>
    </div>
  );
}
