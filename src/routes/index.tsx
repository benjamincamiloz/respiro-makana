import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Camera, FileText, Wind, Home as HomeIcon, Play, Pause, Eye, EyeOff,
  ShoppingBag, X, ArrowRight, Mic, Moon, ShieldCheck, User, BookOpen, Pill, Shirt,
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
const SALE = 9000;

type Cartola = { id: string; name: string; sub: string; debt: number; min: number; interest: number };
const CARTOLAS: Cartola[] = [
  { id: "cmr", name: "CMR Falabella / Tarjeta Retail", sub: "Deuda $850.000 en cuotas chicas de farmacia y ropa", debt: 850000, min: 42500, interest: 26300 },
  { id: "be", name: "BancoEstado / CuentaRut", sub: "Pago mínimo de $42.000", debt: 840000, min: 42000, interest: 25900 },
];

function calc(extra: number, c: Cartola) {
  const r = extra / SALE; // ventas
  return { days: Math.round(r * 140 - r * r * 8), saved: Math.round(extra * (c.debt / c.min) * 0.45) };
}

type Screen = "inicio" | "medidor";

function App() {
  const [screen, setScreen] = useState<Screen>("inicio");
  const [cartola, setCartola] = useState<Cartola | null>(null);
  const [sos, setSos] = useState(false);
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
        {screen === "inicio" ? <Inicio onLoad={load} /> : <Medidor cartola={cartola} onLoad={load} />}
        <Evidencia />
      </main>

      <button onClick={() => setSos(true)}
        className="fixed bottom-24 left-1/2 z-20 flex w-[calc(100%-2.5rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-full bg-warm px-5 py-3.5 text-left font-bold text-warm-foreground shadow-soft transition hover:scale-[1.02]">
        <Moon className="h-5 w-5 shrink-0" /> Pausa Nocturna (Tu momento libre)
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
          <button onClick={() => document.getElementById("evidencia")?.scrollIntoView({ behavior: "smooth" })}
            className="flex flex-1 flex-col items-center gap-1 py-3 text-sm font-bold text-muted-foreground">
            <BookOpen className="h-6 w-6" /> Evidencia
          </button>
        </div>
      </nav>

      {sos && <PausaSOS onClose={() => setSos(false)} />}
    </div>
  );
}

function Inicio({ onLoad }: { onLoad: (c: Cartola) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  return (
    <section className="animate-rise space-y-6">
      <div className="flex items-center gap-3 rounded-3xl bg-card p-4 shadow-soft">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground"><User className="h-6 w-6" /></div>
        <p className="font-semibold">Patricia, 58 años<br /><span className="text-sm text-muted-foreground">Cuidadora y vendedora de catálogo en Talca</span></p>
      </div>
      <div className="relative mx-auto flex h-32 w-32 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-accent animate-breathe" />
        <Wind className="relative h-12 w-12 text-primary" />
      </div>
      <h1 className="text-center text-3xl leading-tight">Hola Patricia, respira hondo.<br /><span className="text-secondary">Cuidemos tu tranquilidad hoy.</span></h1>
      <p className="text-center text-muted-foreground">Sube tu cartola y yo me encargo de leerla. Tú solo verás lo que te da aire.</p>

      <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFileName(f.name); setTimeout(() => onLoad(CARTOLAS[0]!), 1200); } }} />
      <button onClick={() => fileRef.current?.click()}
        className="flex w-full items-center justify-center gap-3 rounded-3xl bg-primary px-6 py-6 text-xl font-extrabold text-primary-foreground shadow-soft transition active:scale-95">
        <Camera className="h-7 w-7" /> Subir foto o PDF de cartola
      </button>
      {fileName && <p className="animate-rise text-center text-sm text-muted-foreground">Leyendo “{fileName}” con calma…</p>}

      <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">O elige una cartola de ejemplo</p>
      {CARTOLAS.map((c) => (
        <button key={c.id} onClick={() => onLoad(c)}
          className="flex w-full items-center gap-3 rounded-3xl border-2 border-dashed border-secondary/40 bg-calm px-5 py-4 text-left font-bold text-calm-foreground transition active:scale-95">
          <FileText className="h-6 w-6 shrink-0" />
          <span>{c.name}<br /><span className="text-sm font-semibold opacity-80">{c.sub}</span></span>
          <ArrowRight className="ml-auto h-5 w-5 shrink-0" />
        </button>
      ))}
    </section>
  );
}

type Ventas = "bajas" | "normales" | "buenas";

function Medidor({ cartola, onLoad }: { cartola: Cartola | null; onLoad: (c: Cartola) => void }) {
  const [ventas, setVentas] = useState<Ventas | null>(null);
  const [extra, setExtra] = useState(2 * SALE);
  const [detail, setDetail] = useState(false);
  if (!cartola) {
    return (
      <div className="animate-rise space-y-4 pt-16 text-center">
        <Wind className="mx-auto h-12 w-12 text-primary" />
        <p className="text-lg">Aún no tenemos tu cartola. Sin apuro.</p>
        <button onClick={() => onLoad(CARTOLAS[0]!)} className="rounded-full bg-primary px-6 py-4 font-bold text-primary-foreground">Usar cartola de ejemplo</button>
      </div>
    );
  }
  const c = cartola;
  const maxSales = ventas === "buenas" ? 3 : 2;
  const { days, saved } = calc(extra, c);
  const sales = Math.round(extra / SALE);
  const pick = (v: Ventas) => { setVentas(v); setExtra(v === "buenas" ? 3 * SALE : 2 * SALE); };

  return (
    <section className="animate-rise space-y-5">
      <div className="flex items-start gap-3 rounded-3xl bg-accent p-5 text-accent-foreground">
        <ShieldCheck className="mt-1 h-7 w-7 shrink-0" />
        <p className="font-semibold">Tu cuenta {c.name.split(" /")[0]} está al día y tu mamá está protegida. Vamos a ver cuánto aire le ganamos al banco este mes.</p>
      </div>

      <VoiceNote />

      <div className="rounded-3xl bg-card p-5 shadow-soft">
        <p className="font-extrabold">¿Cómo estuvieron tus ventas de catálogo esta semana?</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {(["bajas", "normales", "buenas"] as const).map((v) => (
            <button key={v} onClick={() => pick(v)}
              className={`rounded-2xl border-2 py-3 font-bold capitalize transition ${ventas === v ? "border-primary bg-accent text-accent-foreground" : "border-border"}`}>{v}</button>
          ))}
        </div>
      </div>

      {ventas === "bajas" && (
        <div className="animate-rise space-y-3 rounded-3xl bg-calm p-6 text-center text-calm-foreground">
          <ShieldCheck className="mx-auto h-10 w-10" />
          <p className="text-lg font-bold">Esta semana protegemos tu caja: pagamos el mínimo seguro y no sumamos ninguna cuota nueva.</p>
          <p>Pagas <b>{clp(c.min)}</b>. Sin sobregirarte. La próxima semana vemos si ganamos más aire.</p>
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
          <input type="range" min={0} max={maxSales * SALE} step={SALE} value={Math.min(extra, maxSales * SALE)}
            onChange={(e) => setExtra(Number(e.target.value))} aria-label="Ventas extra destinadas al pago"
            className="mt-6 h-3 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary" />
          <div className="mt-1 flex justify-between text-xs font-semibold text-muted-foreground">
            {Array.from({ length: maxSales + 1 }, (_, i) => <span key={i}>{i === 0 ? "Mínimo" : `${i} venta${i > 1 ? "s" : ""}`}</span>)}
          </div>
          {extra > 0 && (
            <div className="mt-5 flex gap-3 rounded-3xl bg-warm p-4 text-left text-warm-foreground">
              <ShoppingBag className="mt-1 h-6 w-6 shrink-0" />
              <p className="font-semibold">Esos {clp(extra)} extra son solo <b>{sales} {sales === 1 ? "venta" : "ventas"}</b> de cremas o perfumes de tu catálogo. ¿A quién le ofrecemos hoy?</p>
            </div>
          )}
        </div>
      )}

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

function Evidencia() {
  const studies = [
    { a: "Fernandes (2014)", d: "La educación financiera funciona mejor justo a tiempo, en el momento de decidir." },
    { a: "Medina (2021)", d: "No forzar pagos que generen sobregiros: proteger la caja primero." },
    { a: "USS-Equifax (2026)", d: "El endeudamiento de mujeres mayores se concentra en tarjetas de retail." },
  ];
  return (
    <footer id="evidencia" className="mt-12 space-y-3 rounded-3xl bg-muted p-5">
      <p className="flex items-center gap-2 font-extrabold"><BookOpen className="h-5 w-5 text-primary" /> Respaldado por evidencia</p>
      {studies.map((s) => <p key={s.a} className="text-sm"><b>{s.a}:</b> {s.d}</p>)}
    </footer>
  );
}
