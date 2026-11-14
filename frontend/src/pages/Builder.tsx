import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { ArrowDown, ArrowUp, BookOpen, ChevronLeft, Library, Minus, Plus, Rocket, Search, Trash2, TriangleAlert, CircleX, Lightbulb, Eraser } from "lucide-react";
import { useAnalysis, useAstronaut, useAstronautId, useCatalog, useSaveBlueprint } from "@/lib/hooks";
import type { Blueprint, Catalog, GuideIssue, Part, StackItem } from "@/lib/types";
import { PartShape, propColor } from "@/components/RocketGraphic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const MULTI = new Set(["engine", "booster"]);

function LibraryPanel({ catalog, onAdd }: { catalog: Catalog; onAdd: (id: string) => void }) {
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const parts = catalog.parts.filter((p) => (cat === "all" || p.category === cat) && (p.name + p.program).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="flex flex-col min-h-0 h-full" data-testid="parts-library">
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search NASA parts" className="pl-9 h-10 text-base bg-[#050914] font-mono" data-testid="library-search-input" />
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {[{ id: "all", label: "All" }, ...catalog.categories].map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)} data-testid={`library-category-${c.id}`}
            className={cn("px-2.5 py-1 rounded-full text-[11px] font-mono border transition-colors duration-150",
              cat === c.id ? "border-cyan-300 bg-cyan-300/15 text-cyan-100" : "border-slate-700 text-slate-400 hover:text-white")}>
            {c.label}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
        {parts.map((p) => (
          <div key={p.id} draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", `part:${p.id}`)}
            data-testid={`part-item-${p.id}`}
            className="group flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/60 p-2.5 cursor-grab active:cursor-grabbing hover:border-cyan-400/60 hover:-translate-y-0.5 transition-[transform,border-color] duration-200">
            <div className="w-12 h-12 shrink-0 grid place-items-center rounded-md blueprint-grid overflow-hidden">
              <div className="scale-[0.85]"><PartShape part={p} qty={1} scale={Math.min(4, 38 / Math.max(p.diameter_m, 1))} /></div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm text-white truncate">{p.name}</div>
              <div className="font-mono text-[10px] text-slate-500 truncate">{p.program}</div>
              <div className="font-mono text-[10px] text-slate-400 flex gap-2 mt-0.5">
                <span>{p.mass_t}t</span>
                {p.thrust_vac_kn > 0 && <span>{p.thrust_sl_kn || p.thrust_vac_kn}kN</span>}
                {p.propellant && <span style={{ color: propColor(p.propellant) }}>{p.propellant}</span>}
              </div>
            </div>
            <button onClick={() => onAdd(p.id)} data-testid={`part-add-${p.id}`} aria-label={`Add ${p.name}`}
              className="size-8 shrink-0 grid place-items-center rounded-md border border-cyan-500/30 text-cyan-300 hover:bg-cyan-400/15 transition-colors duration-150">
              <Plus className="size-4" />
            </button>
          </div>
        ))}
        {parts.length === 0 && <p className="text-sm text-slate-500 font-mono">No parts match.</p>}
      </div>
    </div>
  );
}

function GuideDialog() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" data-testid="open-help-guide-button" />}>
        <BookOpen className="size-4" /> Help guide
      </DialogTrigger>
      <DialogContent className="max-w-lg" data-testid="help-guide-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading">Beginner's assembly guide</DialogTitle>
          <DialogDescription>Build from the top down, as NASA engineers stack a vehicle in the VAB.</DialogDescription>
        </DialogHeader>
        <ol className="space-y-3 text-sm text-slate-300">
          {[
            ["Crew / payload on top", "Start with a capsule (Orion, Apollo CSM) or a payload like Perseverance."],
            ["Upper stage + engine", "Add an upper-stage tank, then a vacuum engine (RL10, J-2) directly below it."],
            ["Interstage (optional)", "Use an adapter between stages of different widths."],
            ["Core stage + main engines", "A big tank (S-IC, SLS Core) with powerful engines (F-1 ×5, RS-25 ×4). Use the + button on an engine row to cluster engines."],
            ["Boosters for liftoff", "Add solid boosters if TWR is below 1.2."],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-3"><span className="font-mono text-cyan-300">0{i + 1}</span><div><div className="text-white">{t}</div><div className="text-slate-400">{d}</div></div></li>
          ))}
        </ol>
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 p-3 text-xs text-amber-100 font-mono leading-relaxed">
          Rules: an engine must burn the same propellant as the tank above it (colour stripe). RL10 and LR91 are vacuum engines and give no thrust at liftoff. Liftoff TWR must be above 1. The guide panel suggests compatible alternatives; click "Use" to swap one in.
        </div>
      </DialogContent>
    </Dialog>
  );
}

function IssueCard({ issue, parts, onFix }: { issue: GuideIssue; parts: Record<string, Part>; onFix: (issue: GuideIssue, partId: string) => void }) {
  const Icon = issue.severity === "error" ? CircleX : issue.severity === "warning" ? TriangleAlert : Lightbulb;
  return (
    <div data-testid={`guide-issue-${issue.code}`}
      className={cn("rounded-lg border p-3", issue.severity === "error" ? "border-rose-400/40 bg-[#2a0e15]" : issue.severity === "warning" ? "border-amber-400/40 bg-amber-400/5" : "border-emerald-400/30 bg-[#0b291b]")}>
      <div className="flex gap-2 items-start">
        <Icon className={cn("size-4 mt-0.5 shrink-0", issue.severity === "error" ? "text-rose-300" : issue.severity === "warning" ? "text-amber-300" : "text-emerald-300")} />
        <div className="min-w-0">
          <div className="text-sm text-white">{issue.title}</div>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{issue.message}</p>
        </div>
      </div>
      {issue.alternatives.length > 0 && (
        <div className="mt-2.5 space-y-1.5">
          <div className="hud-label text-[9px]">Alternatives</div>
          {issue.alternatives.map((a) => parts[a] && (
            <div key={a} className="flex items-center justify-between gap-2 rounded-md bg-black/30 px-2 py-1.5">
              <span className="text-xs text-slate-200 truncate">{parts[a].name}</span>
              <button onClick={() => onFix(issue, a)} data-testid={`guide-use-${issue.code}-${a}`}
                className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded border border-cyan-400/40 text-cyan-200 hover:bg-cyan-400/15 transition-colors duration-150 shrink-0">Use</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone, testid }: { label: string; value: string; tone?: string; testid: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-[#050914] p-2.5" data-testid={testid}>
      <div className="hud-label text-[9px] text-slate-500">{label}</div>
      <div className={cn("font-mono text-lg tabular-nums", tone ?? "text-white")}>{value}</div>
    </div>
  );
}

function BuilderInner({ catalog, initial, astronautId }: { catalog: Catalog; initial: Blueprint; astronautId: string }) {
  const nav = useNavigate();
  const parts = useMemo(() => Object.fromEntries(catalog.parts.map((p) => [p.id, p])), [catalog]);
  const [stack, setStack] = useState<StackItem[]>(initial.stack);
  const [label, setLabel] = useState(initial.label);
  const [sel, setSel] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [libOpen, setLibOpen] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data: analysis } = useAnalysis(stack, astronautId);
  const { save, isPending } = useSaveBlueprint();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => { save({ label, stack }).catch(() => undefined); }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stack, label]);

  const insertAt = (pos: number, partId: string, qty = 1) => {
    setStack((s) => [...s.slice(0, pos), { part_id: partId, qty }, ...s.slice(pos)]);
    setSel(pos);
  };
  const move = (from: number, to: number) => {
    setStack((s) => {
      const c = [...s];
      const [it] = c.splice(from, 1);
      c.splice(to > from ? to - 1 : to, 0, it);
      return c;
    });
    setSel(null);
  };
  const handleDrop = (pos: number, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOverIdx(null);
    const d = e.dataTransfer.getData("text/plain");
    if (d.startsWith("part:")) insertAt(pos, d.slice(5));
    else if (d.startsWith("idx:")) move(Number(d.slice(4)), pos);
  };
  const setQty = (i: number, delta: number) => setStack((s) => s.map((it, j) => (j === i ? { ...it, qty: Math.min(9, Math.max(1, it.qty + delta)) } : it)));
  const remove = (i: number) => { setStack((s) => s.filter((_, j) => j !== i)); setSel(null); };
  const replace = (i: number, partId: string) => setStack((s) => s.map((it, j) => (j === i ? { ...it, part_id: partId } : it)));

  const fix = (issue: GuideIssue, partId: string) => {
    const idx = issue.item_index;
    const cat = parts[partId]?.category;
    if (issue.code === "TANK_NO_ENGINE" && idx !== null) insertAt(idx + 1, partId);
    else if (issue.code === "ENGINE_NO_TANK" && idx !== null) insertAt(idx, partId);
    else if (issue.code === "NO_PAYLOAD" || issue.code === "EMPTY") insertAt(0, partId);
    else if (cat === "booster") insertAt(stack.length, partId, 2);
    else if (idx !== null) replace(idx, partId);
    else insertAt(stack.length, partId);
    toast.success(`${parts[partId]?.name} fitted`);
  };

  const launch = async () => {
    await save({ label, stack });
    nav("/launch");
  };

  const stats = analysis?.stats;
  const errored = new Set(analysis?.issues.filter((i) => i.severity === "error" && i.item_index !== null).map((i) => i.item_index));
  const scale = 9;
  const addEnd = (id: string) => { insertAt(stack.length, id); setSheetOpen(false); };

  return (
    <div className="flex flex-col h-[calc(100dvh-5.5rem)]">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2 px-4 lg:px-6 py-3 border-b border-cyan-500/10">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger render={<Button variant="outline" size="sm" className="lg:hidden" data-testid="open-library-sheet-button" />}>
            <Library className="size-4" /> Library
          </SheetTrigger>
          <SheetContent side="left" className="w-[88vw] sm:max-w-sm p-4 bg-[#0d1424]">
            <SheetHeader className="p-0 mb-2"><SheetTitle className="font-heading">NASA parts library</SheetTitle></SheetHeader>
            <LibraryPanel catalog={catalog} onAdd={addEnd} />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <span className="hud-label hidden sm:inline">Vehicle</span>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} className="h-9 w-44 sm:w-56 font-mono bg-[#050914] text-base sm:text-sm" data-testid="rocket-name-input" />
        </div>
        <span className="font-mono text-[10px] text-slate-500" data-testid="save-status">{isPending ? "SAVING…" : "SAVED"}</span>
        <div className="ml-auto flex items-center gap-2">
          <GuideDialog />
          <Button variant="ghost" size="sm" onClick={() => { setStack([]); setSel(null); }} data-testid="clear-stack-button"><Eraser className="size-4" /> Clear</Button>
          <Button size="sm" disabled={!analysis?.ready} onClick={launch} data-testid="go-to-launch-button" className="font-mono uppercase tracking-wider">
            <Rocket className="size-4" /> Launch mission
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[auto_minmax(0,1fr)_320px] gap-4 p-4 lg:p-6 overflow-y-auto lg:overflow-hidden">
        {/* side menu rail + library */}
        <aside className="hidden lg:flex gap-3 min-h-0">
          <div className="flex flex-col gap-2 pt-1">
            <button onClick={() => setLibOpen((o) => !o)} data-testid="side-menu-library-button" aria-label="Toggle library"
              className={cn("size-10 grid place-items-center rounded-lg border transition-colors duration-150", libOpen ? "border-cyan-300 bg-cyan-300/10 text-cyan-200" : "border-slate-700 text-slate-400 hover:text-white")}>
              {libOpen ? <ChevronLeft className="size-4" /> : <Library className="size-4" />}
            </button>
          </div>
          <AnimatePresence initial={false}>
            {libOpen && (
              <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 300, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.22 }}
                className="overflow-hidden rounded-xl border border-cyan-500/20 bg-slate-900/60">
                <div className="w-[300px] h-full p-4 flex flex-col min-h-0">
                  <div className="hud-label mb-3">NASA parts library · {catalog.parts.length} parts</div>
                  <LibraryPanel catalog={catalog} onAdd={(id) => insertAt(stack.length, id)} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>

        {/* blueprint canvas */}
        <section
          className="relative min-h-[480px] lg:min-h-0 rounded-xl border border-cyan-500/30 blueprint-grid overflow-auto hud-corners"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(stack.length, e)}
          data-testid="blueprint-canvas"
        >
          <div className="absolute top-3 left-4 hud-label pointer-events-none">Blueprint · top = nose</div>
          <div className="absolute top-3 right-4 font-mono text-[10px] text-cyan-300/60 pointer-events-none">{stack.length} parts</div>
          {stack.length === 0 ? (
            <div className="h-full min-h-[420px] grid place-items-center text-center px-6" data-testid="blueprint-empty">
              <div>
                <div className="mx-auto mb-4 size-16 rounded-full border border-dashed border-cyan-400/50 grid place-items-center"><Plus className="size-6 text-cyan-300" /></div>
                <p className="font-heading text-xl text-white">Drag parts here</p>
                <p className="text-sm text-slate-400 mt-1 max-w-xs">Drag parts from the library, or tap + on a part. Start with a capsule at the top.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-12 px-4 min-w-fit">
              {stack.map((it, i) => {
                const p = parts[it.part_id];
                if (!p) return null;
                return (
                  <div key={`${i}-${it.part_id}`} className="flex flex-col items-center w-full">
                    <div onDragOver={(e) => { e.preventDefault(); setOverIdx(i); }} onDragLeave={() => setOverIdx(null)} onDrop={(e) => handleDrop(i, e)}
                      data-testid={`drop-zone-${i}`}
                      className={cn("w-full max-w-[420px] transition-[height,background-color] duration-150 rounded", overIdx === i ? "h-6 bg-cyan-400/25 border border-dashed border-cyan-300" : "h-1.5")} />
                    <div draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", `idx:${i}`)}>
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 380, damping: 26 }}
                      onClick={() => setSel(sel === i ? null : i)}
                      data-testid={`stack-item-${i}`}
                      className={cn("relative group flex items-center justify-center cursor-grab rounded px-2 py-0.5 outline outline-1 transition-[outline-color] duration-150",
                        sel === i ? "outline-cyan-300" : errored.has(i) ? "outline-rose-400/80" : "outline-transparent hover:outline-cyan-500/40")}>
                      <PartShape part={p} qty={it.qty} scale={scale} />
                      <div className={cn("absolute left-full ml-3 whitespace-nowrap font-mono text-[10px] pointer-events-none", errored.has(i) ? "text-rose-300" : "text-cyan-200/80")}>
                        {p.name}{MULTI.has(p.category) && it.qty > 1 ? ` ×${it.qty}` : ""}
                      </div>
                    </motion.div>
                    </div>
                    {sel === i && (
                      <div className="flex items-center gap-1 my-1.5 rounded-lg border border-cyan-500/30 bg-slate-950/90 p-1" data-testid={`stack-controls-${i}`} onClick={(e) => e.stopPropagation()}>
                        <button className="size-7 grid place-items-center rounded hover:bg-white/10 disabled:opacity-30" disabled={i === 0} onClick={() => move(i, i - 1)} data-testid={`stack-move-up-${i}`} aria-label="Move up"><ArrowUp className="size-3.5" /></button>
                        <button className="size-7 grid place-items-center rounded hover:bg-white/10 disabled:opacity-30" disabled={i === stack.length - 1} onClick={() => move(i, i + 2)} data-testid={`stack-move-down-${i}`} aria-label="Move down"><ArrowDown className="size-3.5" /></button>
                        {MULTI.has(p.category) && (
                          <>
                            <button className="size-7 grid place-items-center rounded hover:bg-white/10" onClick={() => setQty(i, -1)} data-testid={`stack-qty-minus-${i}`} aria-label="Fewer"><Minus className="size-3.5" /></button>
                            <span className="font-mono text-xs w-6 text-center" data-testid={`stack-qty-${i}`}>×{it.qty}</span>
                            <button className="size-7 grid place-items-center rounded hover:bg-white/10" onClick={() => setQty(i, 1)} data-testid={`stack-qty-plus-${i}`} aria-label="More"><Plus className="size-3.5" /></button>
                          </>
                        )}
                        <button className="size-7 grid place-items-center rounded text-rose-300 hover:bg-rose-500/15" onClick={() => remove(i)} data-testid={`stack-remove-${i}`} aria-label="Remove"><Trash2 className="size-3.5" /></button>
                      </div>
                    )}
                  </div>
                );
              })}
              <div onDragOver={(e) => { e.preventDefault(); setOverIdx(stack.length); }} onDragLeave={() => setOverIdx(null)} onDrop={(e) => handleDrop(stack.length, e)}
                data-testid="drop-zone-end"
                className={cn("mt-2 w-full max-w-[420px] rounded border border-dashed text-center font-mono text-[10px] py-2 transition-colors duration-150",
                  overIdx === stack.length ? "border-cyan-300 bg-cyan-400/20 text-cyan-100" : "border-cyan-500/20 text-cyan-300/50")}>
                DROP BELOW TO ADD
              </div>
              <div className="mt-3 h-1 w-64 bg-gradient-to-r from-transparent via-slate-500 to-transparent" />
              <div className="font-mono text-[9px] text-slate-500 mt-1">LAUNCH PAD</div>
            </div>
          )}
        </section>

        {/* telemetry + guide */}
        <aside className="min-h-0 overflow-y-auto rounded-xl border border-cyan-500/20 bg-slate-900/60 p-4 space-y-4" data-testid="guide-panel">
          <div>
            <div className="hud-label mb-2">Vehicle telemetry</div>
            <div className="grid grid-cols-2 gap-2">
              <Stat testid="stat-mass" label="Mass" value={`${stats?.total_mass_t ?? 0} t`} />
              <Stat testid="stat-thrust" label="Liftoff thrust" value={`${((stats?.liftoff_thrust_kn ?? 0) / 1000).toFixed(1)} MN`} />
              <Stat testid="stat-twr" label="TWR" value={(stats?.twr ?? 0).toFixed(2)} tone={(stats?.twr ?? 0) >= 1 ? "text-emerald-300" : "text-rose-300"} />
              <Stat testid="stat-dv" label="Δv (ideal)" value={`${((stats?.delta_v_ms ?? 0) / 1000).toFixed(2)} km/s`} tone="text-cyan-200" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="hud-label">Flight engineering guide</span>
              <span className={cn("font-mono text-[10px] px-2 py-0.5 rounded-full border", analysis?.ready ? "border-emerald-400/50 text-emerald-300" : "border-rose-400/50 text-rose-300")} data-testid="ready-badge">
                {analysis?.ready ? "GO" : "NO-GO"}
              </span>
            </div>
            <div className="space-y-2">
              {analysis?.issues.map((iss, k) => <IssueCard key={`${iss.code}-${k}`} issue={iss} parts={parts} onFix={fix} />)}
            </div>
          </div>
          {sel !== null && stack[sel] && parts[stack[sel].part_id] && (
            <div className="rounded-lg border border-cyan-500/20 p-3" data-testid="selected-part-details">
              <div className="hud-label mb-1">Selected part</div>
              <div className="text-white text-sm">{parts[stack[sel].part_id].name}</div>
              <p className="text-xs text-slate-400 mt-1">{parts[stack[sel].part_id].description}</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 font-mono text-[11px] text-slate-300">
                <span>Ø {parts[stack[sel].part_id].diameter_m} m</span><span>{parts[stack[sel].part_id].mass_t} t</span>
                {parts[stack[sel].part_id].isp_vac_s > 0 && <><span>Isp {parts[stack[sel].part_id].isp_vac_s}s vac</span><span>{parts[stack[sel].part_id].thrust_vac_kn} kN vac</span></>}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default function Builder() {
  const id = useAstronautId();
  const { data: catalog } = useCatalog();
  const { data: astro } = useAstronaut();
  if (!catalog || !astro || !id) {
    return <div className="p-10 font-mono text-sm text-cyan-300/70" data-testid="builder-loading">Loading vehicle assembly building…</div>;
  }
  return <BuilderInner key={astro.id} catalog={catalog} initial={astro.blueprint} astronautId={id} />;
}
