import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShieldCheck, Fingerprint, Radio } from "lucide-react";
import { apiPost, ApiError } from "@/lib/api";
import { setAstronautId, useAstronautId } from "@/lib/hooks";
import { translate, useT, LANG_LABELS } from "@/lib/i18n";
import { getSettings, updateSettings, useSettings, type Lang } from "@/lib/settings";
import type { Astronaut, EnrollRequest } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ApodBackground from "@/components/ApodBackground";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SPECS = ["Flight Commander", "Mission Pilot", "Propulsion Specialist", "Orbital Navigator", "Systems Engineer", "Mission Specialist"];
const HERO = "https://images.unsplash.com/photo-1517976487492-5750f3195933?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600";

function errMsg(e: unknown) {
  if (e instanceof ApiError) {
    const d = (e.body as { detail?: unknown } | null)?.detail;
    if (typeof d === "string") return d;
    if (Array.isArray(d)) return translate(getSettings().lang, "err.check");
  }
  return translate(getSettings().lang, "err.uplink");
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="hud-label">{label}</Label>
      {children}
    </div>
  );
}

const inputCls = "h-11 text-base bg-[#050914] border-cyan-500/25 font-mono focus-visible:border-cyan-300";

export default function Login() {
  const t = useT();
  const { lang } = useSettings();
  const existing = useAstronautId();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [enroll, setEnroll] = useState<EnrollRequest>({
    full_name: "", callsign: "", agency_id: "NASA/JSC-", specialization: "Flight Commander", nationality: "", pin: "",
  });
  const [login, setLogin] = useState({ callsign: "", pin: "" });

  const onAuthed = (a: Astronaut) => {
    qc.setQueryData(["astronaut", a.id], a);
    setAstronautId(a.id);
    toast.success(t("welcome", { cs: a.callsign }));
    nav("/builder");
  };
  const enrollM = useMutation({ mutationFn: (b: EnrollRequest) => apiPost<Astronaut>("/astronauts/enroll", b), onSuccess: onAuthed, onError: (e) => toast.error(errMsg(e)) });
  const loginM = useMutation({ mutationFn: (b: typeof login) => apiPost<Astronaut>("/astronauts/login", b), onSuccess: onAuthed, onError: (e) => toast.error(errMsg(e)) });

  if (existing) return <Navigate to="/builder" replace />;
  const set = (k: keyof EnrollRequest) => (e: React.ChangeEvent<HTMLInputElement>) => setEnroll({ ...enroll, [k]: e.target.value });

  return (
    <div className="relative isolate min-h-dvh grid lg:grid-cols-[minmax(0,560px)_1fr]">
      <ApodBackground />
      <section className="relative flex flex-col justify-center px-6 sm:px-12 py-10 border-r border-cyan-500/10 bg-[#070b12]/55 backdrop-blur-md">
        <div className="mb-8">
          <div className="flex gap-1.5 mb-6" data-testid="login-lang-switch">
            {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
              <button key={l} type="button" onClick={() => updateSettings({ lang: l })} data-testid={`login-lang-${l}`}
                className={"px-2.5 py-1 rounded-full font-mono text-[11px] border transition-colors duration-150 " + (lang === l ? "border-cyan-300 bg-cyan-300/15 text-cyan-100" : "border-slate-700 text-slate-400 hover:text-white")}>{LANG_LABELS[l]}</button>
            ))}
          </div>
          <p className="hud-label mb-3">{t("login.kicker")}</p>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight text-white leading-[1.02]">
            ORBITAL<span className="text-cyan-300">FORGE</span>
          </h1>
          <p className="mt-3 text-slate-400 max-w-md">{t("login.intro")}</p>
        </div>
        <Tabs defaultValue="enroll" className="w-full">
          <TabsList className="mb-5 w-full" data-testid="auth-tabs">
            <TabsTrigger value="enroll" data-testid="tab-enroll">{t("tab.enroll")}</TabsTrigger>
            <TabsTrigger value="login" data-testid="tab-login">{t("tab.login")}</TabsTrigger>
          </TabsList>
          <TabsContent value="enroll">
            <form
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-cyan-500/20 bg-[#0d1424]/80 p-5 hud-corners"
              onSubmit={(e) => { e.preventDefault(); enrollM.mutate(enroll); }}
              data-testid="enroll-form"
            >
              <div className="sm:col-span-2"><Field id="full_name" label={t("f.full_name")}><Input id="full_name" className={inputCls} value={enroll.full_name} onChange={set("full_name")} placeholder="Sally Ride" data-testid="enroll-full-name-input" required /></Field></div>
              <Field id="callsign" label={t("f.callsign")}><Input id="callsign" className={inputCls + " uppercase"} value={enroll.callsign} onChange={set("callsign")} placeholder="NOVA" data-testid="enroll-callsign-input" required /></Field>
              <Field id="agency_id" label={t("f.agency")}><Input id="agency_id" className={inputCls} value={enroll.agency_id} onChange={set("agency_id")} data-testid="enroll-agency-input" required /></Field>
              <Field id="spec" label={t("f.spec")}>
                <Select value={enroll.specialization} onValueChange={(v: string) => setEnroll({ ...enroll, specialization: v })}>
                  <SelectTrigger id="spec" className="h-11 w-full bg-[#050914] border-cyan-500/25 font-mono" data-testid="enroll-specialization-select"><SelectValue>{(v) => t(`spec.${v as string}`)}</SelectValue></SelectTrigger>
                  <SelectContent>{SPECS.map((s) => <SelectItem key={s} value={s}>{t(`spec.${s}`)}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field id="nat" label={t("f.nat")}><Input id="nat" className={inputCls} value={enroll.nationality} onChange={set("nationality")} placeholder="USA" data-testid="enroll-nationality-input" /></Field>
              <div className="sm:col-span-2"><Field id="pin" label={t("f.pin")}><Input id="pin" type="password" inputMode="numeric" className={inputCls} value={enroll.pin} onChange={set("pin")} placeholder="••••" data-testid="enroll-pin-input" required /></Field></div>
              <Button type="submit" disabled={enrollM.isPending} className="sm:col-span-2 h-11 font-mono uppercase tracking-[0.18em]" data-testid="enroll-submit-button">
                <Fingerprint className="size-4" /> {enrollM.isPending ? t("btn.enrolling") : t("btn.enroll")}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="login">
            <form
              className="grid gap-4 rounded-xl border border-cyan-500/20 bg-[#0d1424]/80 p-5 hud-corners"
              onSubmit={(e) => { e.preventDefault(); loginM.mutate(login); }}
              data-testid="login-form"
            >
              <Field id="l_cs" label={t("f.callsign")}><Input id="l_cs" className={inputCls + " uppercase"} value={login.callsign} onChange={(e) => setLogin({ ...login, callsign: e.target.value })} data-testid="login-callsign-input" required /></Field>
              <Field id="l_pin" label={t("f.pin2")}><Input id="l_pin" type="password" inputMode="numeric" className={inputCls} value={login.pin} onChange={(e) => setLogin({ ...login, pin: e.target.value })} data-testid="login-pin-input" required /></Field>
              <Button type="submit" disabled={loginM.isPending} className="h-11 font-mono uppercase tracking-[0.18em]" data-testid="login-submit-button">
                <ShieldCheck className="size-4" /> {loginM.isPending ? t("btn.authing") : t("btn.auth")}
              </Button>
              <p className="text-xs text-slate-500 font-mono">{t("demo")}</p>
            </form>
          </TabsContent>
        </Tabs>
      </section>
      <section className="relative hidden lg:block overflow-hidden">
        <img src={HERO} alt="Rocket launch" className="absolute inset-0 size-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070b12] via-[#070b12]/40 to-transparent" />
        <div className="absolute inset-0 scanlines opacity-40" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-cyan-300/10 to-transparent animate-scan" />
        <div className="absolute bottom-10 right-10 w-[340px] rounded-xl border border-cyan-500/25 bg-slate-950/80 backdrop-blur-xl p-5 hud-glow" data-testid="login-telemetry-panel">
          <div className="flex items-center gap-2 mb-4"><Radio className="size-4 text-emerald-300" /><span className="hud-label text-emerald-300/90">{t("tel.title")}</span></div>
          {[[t("tel.range"), "GO"], [t("tel.weather"), "GO"], [t("tel.vab"), t("awaiting")], [t("tel.crew"), t("pending")]].map(([k, v]) => (
            <div key={k} className="flex justify-between py-1.5 border-b border-slate-800 last:border-0 font-mono text-xs">
              <span className="text-slate-400">{k}</span>
              <span className={v === "GO" ? "text-emerald-300" : "text-amber-300"}>{v}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
