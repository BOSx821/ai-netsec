import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { SocPageHeader } from "@/components/SocPageHeader";
import { RiskMeter, SeverityBadge } from "@/components/SocStatus";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Activity, AlertTriangle, ArrowUpRight, BellRing, Cpu, DatabaseZap, Gauge, Network, ShieldCheck } from "lucide-react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useLocation } from "wouter";
import { toast } from "sonner";

const colors = { critical: "#fb7185", high: "#fb923c", medium: "#fbbf24", low: "#22d3ee" };

function DashboardContent() {
  const { user } = useAuth();
  const dashboardQuery = trpc.soc.dashboard.useQuery();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const seedDemo = trpc.soc.admin.seedDemo.useMutation({
    onSuccess: result => {
      if (result.created) toast.success("Jeu de démonstration chargé. Toutes les entrées sont explicitement étiquetées [Démo].");
      else toast.info("Le jeu de démonstration ne peut être chargé que dans un inventaire vide.");
      void utils.soc.dashboard.invalidate();
      void utils.soc.assets.invalidate();
      void utils.soc.alerts.invalidate();
      void utils.soc.incidents.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const metrics = dashboardQuery.data?.metrics;
  const systemsStatus = metrics ? `${metrics.onlineSystems}/${metrics.monitoredSystems}` : "—";

  return <div className="space-y-7"><SocPageHeader eyebrow="Vue opérationnelle" title="Posture de sécurité" description="Synthèse en temps réel des éléments à qualifier, investiguer et protéger." actions={<><div className="flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/5 px-3 py-2 text-xs font-medium text-emerald-200"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />Supervision active</div>{user?.role === "admin" && !dashboardQuery.data?.isDemoData ? <Button size="sm" variant="outline" className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800" disabled={seedDemo.isPending} onClick={() => seedDemo.mutate()}><DatabaseZap className="mr-2 h-3.5 w-3.5" />Charger les données de démo</Button> : null}</>} />
    {dashboardQuery.data?.isDemoData ? <div className="rounded-xl border border-amber-300/15 bg-amber-300/5 px-4 py-3 text-sm text-amber-100"><strong>Mode démonstration.</strong> Les éléments affichés avec le préfixe <code className="font-mono text-xs">[Démo]</code> sont fictifs et servent uniquement à valider les parcours de l’interface.</div> : null}
    <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4"><MetricCard icon={BellRing} label="Alertes actives" value={metrics?.activeAlerts ?? "—"} detail={`${metrics?.criticalAlerts ?? 0} critiques`} accent="rose" /><MetricCard icon={Activity} label="Incidents en cours" value={metrics?.openIncidents ?? "—"} detail="À investiguer ou clôturer" accent="orange" /><MetricCard icon={Gauge} label="Score global" value={metrics ? `${metrics.globalRiskScore}/100` : "—"} detail="Niveau de risque consolidé" accent="cyan" /><MetricCard icon={Network} label="Systèmes surveillés" value={systemsStatus} detail="Disponibles / inventoriés" accent="emerald" /></section>
    <section className="grid gap-5 2xl:grid-cols-[1.25fr_0.75fr]"><Card className="soc-panel border-slate-800 bg-slate-950/35"><CardContent className="p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-slate-100">Répartition des alertes</p><p className="mt-1 text-xs text-slate-500">Distribution par niveau de sévérité</p></div><button className="inline-flex items-center gap-1 text-xs font-medium text-cyan-300 hover:text-cyan-100" onClick={() => setLocation("/analysis")}>Analyse complète <ArrowUpRight className="h-3.5 w-3.5" /></button></div><div className="mt-5 h-64">{dashboardQuery.isLoading ? <ChartSkeleton /> : dashboardQuery.data ? <ResponsiveContainer width="100%" height="100%"><BarChart data={dashboardQuery.data.alertsBySeverity}><XAxis dataKey="severity" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} /><Tooltip cursor={{ fill: "#1e293b" }} contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 10 }} /><Bar dataKey="count" name="Alertes" radius={[6, 6, 0, 0]}>{dashboardQuery.data.alertsBySeverity.map(entry => <Cell fill={colors[entry.severity]} key={entry.severity} />)}</Bar></BarChart></ResponsiveContainer> : <p className="grid h-full place-items-center text-sm text-slate-500">Les données de détection apparaîtront ici.</p>}</div></CardContent></Card>
      <Card className="soc-panel border-slate-800 bg-slate-950/35"><CardContent className="p-5"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-cyan-300" /><p className="text-sm font-semibold text-slate-100">Priorités immédiates</p></div><div className="mt-5 space-y-3">{dashboardQuery.data?.highRiskAssets.length ? dashboardQuery.data.highRiskAssets.map(asset => <button className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-left transition-colors hover:border-slate-700 hover:bg-slate-900" key={asset.id} onClick={() => setLocation("/assets")}><div><p className="text-sm font-medium text-slate-200">{asset.name}</p><p className="mt-1 text-xs text-slate-500">{asset.assetType} · {asset.ipAddress ?? "adresse inconnue"}</p></div><RiskMeter value={asset.riskScore} /></button>) : <EmptyPriority />}</div></CardContent></Card></section>
    <section className="soc-panel overflow-hidden"><div className="flex items-center justify-between border-b border-slate-800 px-5 py-4"><div><p className="text-sm font-semibold text-slate-100">Flux d’alertes récent</p><p className="mt-1 text-xs text-slate-500">Derniers signaux reçus par le centre SOC</p></div><button className="inline-flex items-center gap-1 text-xs font-medium text-cyan-300 hover:text-cyan-100" onClick={() => setLocation("/alerts")}>Ouvrir le centre <ArrowUpRight className="h-3.5 w-3.5" /></button></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="sr-only"><tr><th>Alerte</th><th>Sévérité</th><th>Risque</th><th>Heure</th></tr></thead><tbody className="divide-y divide-slate-800/80">{dashboardQuery.isLoading ? <tr><td className="px-5 py-10 text-sm text-slate-500" colSpan={4}>Chargement des signaux…</td></tr> : null}{dashboardQuery.data?.recentAlerts.length === 0 ? <tr><td className="px-5 py-12 text-center text-sm text-slate-500" colSpan={4}>Aucune alerte active dans ce périmètre.</td></tr> : null}{dashboardQuery.data?.recentAlerts.map(alert => <tr key={alert.id} className="transition-colors hover:bg-slate-900/40"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="rounded-lg border border-slate-700 bg-slate-900 p-2"><AlertTriangle className="h-4 w-4 text-slate-400" /></span><div><p className="text-sm font-medium text-slate-200">{alert.title}</p><p className="mt-1 text-xs text-slate-500">{alert.category} · {alert.sourceIp ?? "source non disponible"}</p></div></div></td><td className="px-5 py-4"><SeverityBadge severity={alert.severity} /></td><td className="px-5 py-4"><RiskMeter value={alert.riskScore} /></td><td className="px-5 py-4 text-xs text-slate-500">{new Date(alert.createdAt).toLocaleString("fr-FR")}</td></tr>)}</tbody></table></div></section>
  </div>;
}

function MetricCard({ icon: Icon, label, value, detail, accent }: { icon: typeof BellRing; label: string; value: string | number; detail: string; accent: "rose" | "orange" | "cyan" | "emerald" }) { const styles = { rose: "border-rose-400/20 bg-rose-400/10 text-rose-300", orange: "border-orange-400/20 bg-orange-400/10 text-orange-300", cyan: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300", emerald: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" }; return <Card className="soc-panel border-slate-800 bg-slate-950/35"><CardContent className="p-5"><div className="flex items-start justify-between"><div><p className="text-sm text-slate-400">{label}</p><p className="mt-3 text-3xl font-semibold tracking-tight text-slate-50">{value}</p><p className="mt-2 text-xs text-slate-500">{detail}</p></div><div className={`rounded-xl border p-2.5 ${styles[accent]}`}><Icon className="h-5 w-5" /></div></div></CardContent></Card>; }
function ChartSkeleton() { return <div className="h-full animate-pulse rounded-lg bg-slate-900/70" />; }
function EmptyPriority() { return <div className="flex flex-col items-center gap-2 py-11 text-center"><Cpu className="h-6 w-6 text-slate-600" /><p className="text-sm text-slate-500">Aucun actif prioritaire à afficher.</p></div>; }
export default function Home() { return <DashboardLayout><DashboardContent /></DashboardLayout>; }
