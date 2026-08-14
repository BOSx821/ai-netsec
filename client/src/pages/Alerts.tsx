import DashboardLayout from "@/components/DashboardLayout";
import { SocPageHeader } from "@/components/SocPageHeader";
import { AlertStatusBadge, RiskMeter, SeverityBadge } from "@/components/SocStatus";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Filter, RefreshCw, ShieldAlert, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const severityOptions = ["", "critical", "high", "medium", "low"] as const;
const statusOptions = ["", "open", "in_progress", "resolved"] as const;

function AlertsContent() {
  const [severity, setSeverity] = useState<(typeof severityOptions)[number]>("");
  const [status, setStatus] = useState<(typeof statusOptions)[number]>("");
  const [selectedAlertId, setSelectedAlertId] = useState<number | null>(null);
  const filters = { ...(severity ? { severity } : {}), ...(status ? { status } : {}) };
  const alertsQuery = trpc.soc.alerts.list.useQuery(filters);
  const detailQuery = trpc.soc.alerts.get.useQuery({ id: selectedAlertId ?? 0 }, { enabled: selectedAlertId !== null });
  const utils = trpc.useUtils();
  const updateStatus = trpc.soc.alerts.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Statut de l’alerte mis à jour.");
      void utils.soc.alerts.list.invalidate();
      void utils.soc.dashboard.invalidate();
    },
    onError: error => toast.error(error.message),
  });

  return (
    <div className="space-y-7">
      <SocPageHeader eyebrow="Détection & qualification" title="Centre d’alertes" description="Filtrez, priorisez et faites progresser les signaux de sécurité. Les actions sont journalisées côté serveur." />

      <section className="soc-panel flex flex-col gap-4 p-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="h-4 w-4 text-cyan-400" />
          <label className="text-sm text-slate-400">
            <span className="sr-only">Sévérité</span>
            <select className="soc-select" value={severity} onChange={event => setSeverity(event.target.value as (typeof severityOptions)[number])}>
              <option value="">Toutes les sévérités</option>
              <option value="critical">Critique</option>
              <option value="high">Élevée</option>
              <option value="medium">Moyenne</option>
              <option value="low">Faible</option>
            </select>
          </label>
          <label className="text-sm text-slate-400">
            <span className="sr-only">Statut</span>
            <select className="soc-select" value={status} onChange={event => setStatus(event.target.value as (typeof statusOptions)[number])}>
              <option value="">Tous les statuts</option>
              <option value="open">Ouverte</option>
              <option value="in_progress">En cours</option>
              <option value="resolved">Résolue</option>
            </select>
          </label>
        </div>
        <Button variant="outline" className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800" onClick={() => void alertsQuery.refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Actualiser
        </Button>
      </section>

      <section className="soc-panel hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead className="border-b border-slate-800 bg-slate-950/40 text-[11px] uppercase tracking-[0.18em] text-slate-500">
              <tr><th className="px-5 py-4 font-semibold">Alerte</th><th className="px-5 py-4 font-semibold">Sévérité</th><th className="px-5 py-4 font-semibold">Actif</th><th className="px-5 py-4 font-semibold">Risque</th><th className="px-5 py-4 font-semibold">Statut</th><th className="px-5 py-4 font-semibold">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {alertsQuery.isLoading ? <tr><td className="px-5 py-10 text-sm text-slate-400" colSpan={6}>Chargement du centre d’alertes…</td></tr> : null}
              {alertsQuery.isError ? <tr><td className="px-5 py-10 text-sm text-rose-300" colSpan={6}>Impossible de charger les alertes : {alertsQuery.error.message}</td></tr> : null}
              {!alertsQuery.isLoading && !alertsQuery.isError && alertsQuery.data?.length === 0 ? <tr><td className="px-5 py-14" colSpan={6}><EmptyAlerts /></td></tr> : null}
              {alertsQuery.data?.map(({ alert, assetName }) => (
                <tr key={alert.id} className="transition-colors hover:bg-slate-900/50">
                  <td className="px-5 py-4"><p className="max-w-md font-medium text-slate-100">{alert.title}</p><p className="mt-1 max-w-md truncate text-xs text-slate-500">{alert.category} · {new Date(alert.createdAt).toLocaleString("fr-FR")}</p></td>
                  <td className="px-5 py-4"><SeverityBadge severity={alert.severity} /></td>
                  <td className="px-5 py-4 text-sm text-slate-300">{assetName ?? "Non associé"}</td>
                  <td className="px-5 py-4"><RiskMeter value={alert.riskScore} /></td>
                  <td className="px-5 py-4"><AlertStatusBadge status={alert.status} /></td>
                  <td className="px-5 py-4"><div className="flex items-center gap-2"><Button size="sm" variant="outline" className="border-slate-700 bg-slate-900 text-xs text-slate-200 hover:bg-slate-800" onClick={() => setSelectedAlertId(alert.id)}>Détails</Button><select aria-label={`Statut de ${alert.title}`} className="soc-select !py-1.5 text-xs" value={alert.status} disabled={updateStatus.isPending} onChange={event => updateStatus.mutate({ id: alert.id, status: event.target.value as "open" | "in_progress" | "resolved" })}><option value="open">Marquer ouverte</option><option value="in_progress">Prendre en charge</option><option value="resolved">Résoudre</option></select></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="space-y-3 md:hidden">
        {alertsQuery.isLoading ? <div className="soc-panel p-6 text-sm text-slate-400">Chargement du centre d’alertes…</div> : null}
        {alertsQuery.isError ? <div className="soc-panel p-6 text-sm text-rose-300">Impossible de charger les alertes : {alertsQuery.error.message}</div> : null}
        {!alertsQuery.isLoading && !alertsQuery.isError && alertsQuery.data?.length === 0 ? <div className="soc-panel p-4"><EmptyAlerts /></div> : null}
        {alertsQuery.data?.map(({ alert, assetName }) => <article className="soc-panel p-4" key={alert.id}><div className="flex items-start justify-between gap-3"><div><p className="font-medium leading-6 text-slate-100">{alert.title}</p><p className="mt-1 text-xs text-slate-500">{alert.category} · {new Date(alert.createdAt).toLocaleString("fr-FR")}</p></div><SeverityBadge severity={alert.severity} /></div><div className="mt-4 grid grid-cols-2 gap-3 border-y border-slate-800 py-3"><div><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Actif</p><p className="mt-1 truncate text-sm text-slate-300">{assetName ?? "Non associé"}</p></div><div><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Statut</p><div className="mt-1"><AlertStatusBadge status={alert.status} /></div></div></div><div className="mt-4 flex items-center justify-between gap-3"><RiskMeter value={alert.riskScore} /><div className="flex items-center gap-2"><Button size="sm" variant="outline" className="border-slate-700 bg-slate-900 text-xs text-slate-200 hover:bg-slate-800" onClick={() => setSelectedAlertId(alert.id)}>Détails</Button><select aria-label={`Statut de ${alert.title}`} className="soc-select !py-1.5 text-xs" value={alert.status} disabled={updateStatus.isPending} onChange={event => updateStatus.mutate({ id: alert.id, status: event.target.value as "open" | "in_progress" | "resolved" })}><option value="open">Ouverte</option><option value="in_progress">En cours</option><option value="resolved">Résolue</option></select></div></div></article>)}
      </section>
      {selectedAlertId !== null ? <section className="soc-panel border-cyan-400/20 bg-slate-950/60 p-5"><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-cyan-300" /><p className="text-sm font-semibold text-slate-100">Détail de l’alerte</p></div><p className="mt-1 font-mono text-[11px] text-slate-500">ALT-{String(selectedAlertId).padStart(5, "0")}</p></div><Button size="sm" variant="ghost" className="text-slate-400 hover:bg-slate-800 hover:text-slate-100" onClick={() => setSelectedAlertId(null)}>Fermer</Button></div>{detailQuery.isLoading ? <p className="py-8 text-sm text-slate-500">Chargement du contexte de l’alerte…</p> : detailQuery.data ? <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]"><div className="space-y-5"><div><div className="flex flex-wrap items-center gap-2"><SeverityBadge severity={detailQuery.data.alert.severity} /><AlertStatusBadge status={detailQuery.data.alert.status} /></div><h2 className="mt-3 text-xl font-semibold text-slate-100">{detailQuery.data.alert.title}</h2><p className="mt-3 text-sm leading-6 text-slate-400">{detailQuery.data.alert.description}</p></div><div className="grid gap-3 sm:grid-cols-2"><DetailItem label="Catégorie" value={detailQuery.data.alert.category} /><DetailItem label="Méthode de détection" value={detailQuery.data.alert.detectionMethod.toUpperCase()} /><DetailItem label="Source" value={detailQuery.data.alert.sourceIp ?? "Non disponible"} mono /><DetailItem label="Destination" value={detailQuery.data.alert.destinationIp ?? "Non disponible"} mono /><DetailItem label="Actif" value={detailQuery.data.assetName ?? "Non associé"} /><DetailItem label="Confiance" value={`${detailQuery.data.alert.confidence}%`} /></div></div><aside className="rounded-xl border border-cyan-400/15 bg-cyan-400/5 p-4"><div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-cyan-300" /><p className="text-sm font-semibold text-cyan-100">Contexte IA</p></div><p className="mt-3 text-sm leading-6 text-slate-300">{detailQuery.data.alert.aiExplanation ?? "Aucune analyse IA n’a encore été générée pour cette alerte."}</p><div className="mt-4 border-t border-cyan-400/15 pt-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">Actions recommandées</p><p className="mt-2 text-sm leading-6 text-slate-400">{detailQuery.data.alert.recommendedActions ?? "Utilisez l’assistant IA pour demander une analyse contextuelle et les prochaines vérifications pertinentes."}</p></div><div className="mt-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">Score de risque</p><div className="mt-2"><RiskMeter value={detailQuery.data.alert.riskScore} /></div></div></aside></div> : <p className="py-8 text-sm text-rose-300">Cette alerte n’est plus disponible.</p>}</section> : null}
    </div>
  );
}

function DetailItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) { return <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3"><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p><p className={`mt-1.5 text-sm text-slate-200 ${mono ? "font-mono" : ""}`}>{value}</p></div>; }

function EmptyAlerts() {
  return <div className="flex flex-col items-center justify-center gap-3 py-4 text-center"><div className="rounded-xl border border-cyan-400/15 bg-cyan-400/5 p-3"><ShieldAlert className="h-5 w-5 text-cyan-300" /></div><p className="font-medium text-slate-200">Aucune alerte ne correspond aux filtres.</p><p className="max-w-sm text-sm text-slate-500">Les alertes issues de sources autorisées apparaîtront ici avec leur contexte et leur niveau de priorité.</p></div>;
}

export default function Alerts() { return <DashboardLayout><AlertsContent /></DashboardLayout>; }
