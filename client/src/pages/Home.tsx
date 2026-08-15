import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { SecurityKpiCard } from "@/components/SecurityKpiCard";
import { SocChartFrame } from "@/components/SocChartFrame";
import { SocPageHeader } from "@/components/SocPageHeader";
import { RiskMeter, SeverityBadge } from "@/components/SocStatus";
import { Button } from "@/components/ui/button";
import { getRiskPresentation } from "@/lib/security-ui";
import { trpc } from "@/lib/trpc";
import { Activity, AlertTriangle, ArrowUpRight, BellRing, Cpu, DatabaseZap, Gauge, Network, ShieldAlert } from "lucide-react";
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
    onSuccess: result => { if (result.created) toast.success("Jeu de démonstration chargé. Toutes les entrées sont explicitement étiquetées [Démo]."); else toast.info("Le jeu de démonstration ne peut être chargé que dans un inventaire vide."); void utils.soc.dashboard.invalidate(); void utils.soc.assets.invalidate(); void utils.soc.alerts.invalidate(); void utils.soc.incidents.invalidate(); },
    onError: error => toast.error(error.message),
  });
  const metrics = dashboardQuery.data?.metrics;
  const risk = getRiskPresentation(metrics?.globalRiskScore);
  const systemsStatus = metrics ? `${metrics.onlineSystems}/${metrics.monitoredSystems}` : "—";
  const criticalAlerts = metrics?.criticalAlerts ?? 0;
  const severityDistribution = dashboardQuery.data?.alertsBySeverity ?? [];

  return <div className="space-y-4 soc-reference-dashboard">
    <SocPageHeader eyebrow="Security overview" title="Posture de sécurité" description="Vue consolidée des signaux, risques et décisions à prendre." actions={<>{user?.role === "admin" && !dashboardQuery.data?.isDemoData ? <Button size="sm" variant="outline" className="soc-secondary-button" disabled={seedDemo.isPending} onClick={() => seedDemo.mutate()}><DatabaseZap className="mr-2 size-3.5" />Charger les données de démo</Button> : null}</>} />
    {dashboardQuery.data?.isDemoData ? <div className="soc-notice" role="status"><AlertTriangle className="size-4 shrink-0" /><p><strong>Mode démonstration.</strong> Les éléments affichés avec le préfixe <code>[Démo]</code> sont fictifs et servent uniquement à valider les parcours de l’interface.</p></div> : null}

    <section className={`soc-threat-brief soc-threat-brief-compact soc-threat-brief--${risk.tone}`} aria-labelledby="threat-brief-title"><div className="soc-threat-icon"><ShieldAlert className="size-5" /></div><div className="min-w-0 flex-1"><p className="soc-eyebrow">État prioritaire</p><div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1"><h2 id="threat-brief-title">{risk.label}</h2>{metrics ? <span className="font-mono text-sm text-slate-300">{metrics.globalRiskScore}/100</span> : null}</div></div><div className="flex shrink-0 flex-wrap items-center gap-2"><span className="soc-count-chip"><BellRing className="size-3.5" aria-hidden="true" />{criticalAlerts} critique{criticalAlerts > 1 ? "s" : ""}</span><Button size="sm" onClick={() => setLocation("/alerts")}>Alertes <ArrowUpRight className="ml-2 size-3.5" /></Button></div></section>

    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Indicateurs clés de sécurité"><SecurityKpiCard icon={BellRing} label="Alertes actives" value={metrics?.activeAlerts ?? "—"} detail={`${criticalAlerts} critique${criticalAlerts > 1 ? "s" : ""} à examiner`} tone={criticalAlerts > 0 ? "critical" : "info"} /><SecurityKpiCard icon={Activity} label="Incidents ouverts" value={metrics?.openIncidents ?? "—"} detail="Dossiers nécessitant un suivi" tone={(metrics?.openIncidents ?? 0) > 0 ? "high" : "success"} /><SecurityKpiCard icon={Gauge} label="Score de risque" value={metrics ? `${metrics.globalRiskScore}/100` : "—"} detail={risk.shortLabel} tone="info" /><SecurityKpiCard icon={Network} label="Couverture systèmes" value={systemsStatus} detail="Disponibles / inventoriés" tone={metrics && metrics.onlineSystems < metrics.monitoredSystems ? "high" : "success"} /></section>

    <section className="grid gap-3 xl:grid-cols-[minmax(0,2.25fr)_minmax(320px,1fr)]">
      <article className="soc-panel soc-chart-card"><div className="soc-card-header"><div><p className="soc-card-kicker">Détection</p><h2>Répartition des alertes</h2><p>Le volume visible par niveau de sévérité dans le périmètre courant.</p></div><button className="soc-text-link" onClick={() => setLocation("/analysis")}>Analyse complète <ArrowUpRight className="size-3.5" /></button></div>{dashboardQuery.isLoading ? <div className="mt-5 h-64"><ChartSkeleton /></div> : dashboardQuery.data ? <SocChartFrame className="mt-5 h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={severityDistribution}><XAxis dataKey="severity" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} /><Tooltip cursor={{ fill: "#172033" }} contentStyle={{ background: "#101827", border: "1px solid #30415d", borderRadius: 12, color: "#e5edf8" }} /><Bar dataKey="count" name="Alertes" radius={[7, 7, 0, 0]}>{severityDistribution.map(entry => <Cell fill={colors[entry.severity]} key={entry.severity} />)}</Bar></BarChart></ResponsiveContainer></SocChartFrame> : <div className="mt-5 h-64"><EmptyChart /></div>}</article>
      <article className="soc-panel soc-priority-card"><div className="soc-card-header"><div><p className="soc-card-kicker">Exposition</p><h2>Actifs prioritaires</h2><p>Les systèmes dont le score mérite une vérification proactive.</p></div><button className="soc-text-link" onClick={() => setLocation("/assets")}>Inventaire <ArrowUpRight className="size-3.5" /></button></div><div className="mt-5 space-y-3">{dashboardQuery.data?.highRiskAssets.length ? dashboardQuery.data.highRiskAssets.map(asset => <button className="soc-priority-row" key={asset.id} onClick={() => setLocation("/assets")}><span className="soc-priority-row-icon"><Network className="size-4" /></span><span className="min-w-0 flex-1 text-left"><strong>{asset.name}</strong><small>{asset.assetType} · {asset.ipAddress ?? "Adresse inconnue"}</small></span><RiskMeter value={asset.riskScore} /></button>) : <EmptyPriority />}</div></article>
    </section>

    <section className="grid gap-3 xl:grid-cols-[minmax(0,2.25fr)_minmax(320px,1fr)]">
      <article className="soc-panel overflow-hidden"><div className="soc-card-header border-b border-slate-800/80 px-5 py-4"><div><p className="soc-card-kicker">Triage</p><h2>Flux d’alertes récent</h2><p>Derniers signaux reçus par le centre SOC.</p></div><button className="soc-text-link" onClick={() => setLocation("/alerts")}>Ouvrir le centre <ArrowUpRight className="size-3.5" /></button></div><div className="overflow-x-auto"><table className="soc-table min-w-[760px]"><thead className="sr-only"><tr><th>Alerte</th><th>Sévérité</th><th>Risque</th><th>Heure</th></tr></thead><tbody>{dashboardQuery.isLoading ? <tr><td className="px-5 py-10 text-sm text-slate-400" colSpan={4}>Chargement des signaux…</td></tr> : null}{dashboardQuery.data?.recentAlerts.length === 0 ? <tr><td className="px-5 py-12 text-center text-sm text-slate-400" colSpan={4}>Aucune alerte active dans ce périmètre. Les prochains signaux apparaîtront ici avec leur priorité.</td></tr> : null}{dashboardQuery.data?.recentAlerts.map(alert => <tr key={alert.id}><td><div className="flex items-center gap-3"><span className="soc-row-icon"><AlertTriangle className="size-4" /></span><div><p className="font-medium text-slate-100">{alert.title}</p><p>{alert.category} · {alert.sourceIp ?? "Source non disponible"}</p></div></div></td><td><SeverityBadge severity={alert.severity} /></td><td><RiskMeter value={alert.riskScore} /></td><td className="font-mono text-[11px] text-slate-500">{new Date(alert.createdAt).toLocaleString("fr-FR")}</td></tr>)}</tbody></table></div></article>
      <aside className="soc-panel soc-ai-brief"><div className="soc-ai-brief-icon"><Cpu className="size-5" /></div><p className="soc-card-kicker">Intelligence assistée</p><h2>Préparer l’analyse IA</h2><p>Interrogez l’assistant avec le contexte d’une alerte ou d’un incident pour distinguer les faits, hypothèses et vérifications recommandées.</p><Button variant="outline" className="soc-secondary-button mt-5 w-full" onClick={() => setLocation("/assistant")}>Ouvrir l’assistant IA <ArrowUpRight className="ml-2 size-3.5" /></Button></aside>
    </section>
  </div>;
}

function ChartSkeleton() { return <div className="h-full animate-pulse rounded-xl bg-slate-900/70" />; }
function EmptyChart() { return <p className="grid h-full place-items-center text-center text-sm text-slate-500">Les données de détection apparaîtront ici lorsqu’un premier signal sera enregistré.</p>; }
function EmptyPriority() { return <div className="flex flex-col items-center gap-2 py-11 text-center"><Cpu className="size-6 text-slate-600" /><p className="text-sm font-medium text-slate-300">Aucun actif prioritaire à afficher.</p><p className="max-w-xs text-xs leading-5 text-slate-500">La surveillance consolidée fera apparaître ici les systèmes aux scores les plus élevés.</p></div>; }
export default function Home() { return <DashboardLayout><DashboardContent /></DashboardLayout>; }
