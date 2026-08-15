import DashboardLayout from "@/components/DashboardLayout";
import { SocPageHeader } from "@/components/SocPageHeader";
import { IncidentStatusBadge, RiskMeter, SeverityBadge } from "@/components/SocStatus";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowRight, ClipboardCheck, History, MessageSquarePlus, Plus, RefreshCw, UserRoundCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

const nextSteps = {
  open: { nextStatus: "in_progress" as const, label: "Démarrer l’analyse" },
  in_progress: { nextStatus: "resolved" as const, label: "Marquer résolu" },
  resolved: { nextStatus: "closed" as const, label: "Clôturer" },
};

function IncidentsContent() {
  const incidentsQuery = trpc.soc.incidents.list.useQuery();
  const utils = trpc.useUtils();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [form, setForm] = useState({ title: "", description: "", severity: "high" as "critical" | "high" | "medium" | "low", riskScore: 70 });
  const detailQuery = trpc.soc.incidents.get.useQuery({ id: selectedIncidentId ?? 0 }, { enabled: selectedIncidentId !== null });
  const transition = trpc.soc.incidents.transition.useMutation({
    onSuccess: () => { toast.success("Cycle de vie de l’incident mis à jour."); void utils.soc.incidents.list.invalidate(); void utils.soc.dashboard.invalidate(); },
    onError: error => toast.error(error.message),
  });
  const createIncident = trpc.soc.incidents.create.useMutation({
    onSuccess: incident => { toast.success("Incident créé et ouvert."); setForm({ title: "", description: "", severity: "high", riskScore: 70 }); setShowCreate(false); setSelectedIncidentId(incident.id); void utils.soc.incidents.list.invalidate(); void utils.soc.dashboard.invalidate(); },
    onError: error => toast.error(error.message),
  });
  const assignSelf = trpc.soc.incidents.assignSelf.useMutation({
    onSuccess: () => { toast.success("Incident assigné à votre compte."); void utils.soc.incidents.list.invalidate(); void detailQuery.refetch(); },
    onError: error => toast.error(error.message),
  });
  const addComment = trpc.soc.incidents.addComment.useMutation({
    onSuccess: () => { setComment(""); toast.success("Commentaire ajouté à l’historique."); void detailQuery.refetch(); },
    onError: error => toast.error(error.message),
  });

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createIncident.mutate(form);
  };

  return (
    <div className="space-y-7">
      <SocPageHeader eyebrow="Réponse à incident" title="Dossiers d’investigation" description="Le cycle de vie est contrôlé : ouvert → en cours → résolu → fermé. Chaque transition génère une entrée d’historique." actions={<><Button className="bg-cyan-500 text-slate-950 hover:bg-cyan-300" onClick={() => setShowCreate(value => !value)}><Plus className="mr-2 h-4 w-4" />Nouvel incident</Button><Button variant="outline" className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800" onClick={() => void incidentsQuery.refetch()}><RefreshCw className="mr-2 h-4 w-4" />Actualiser</Button></>} />
      {showCreate ? <form className="soc-panel grid gap-4 border-cyan-400/20 bg-slate-950/60 p-5 lg:grid-cols-2" onSubmit={handleCreate}><div className="lg:col-span-2"><p className="text-sm font-semibold text-slate-100">Ouvrir un incident</p><p className="mt-1 text-xs text-slate-500">Le dossier est créé au statut « Ouvert » et sera ensuite progressé via la séquence contrôlée.</p></div><label className="space-y-2"><span className="text-xs font-medium text-slate-300">Titre</span><input required minLength={3} className="soc-select w-full" value={form.title} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} placeholder="Ex. Activité de reconnaissance coordonnée" /></label><label className="space-y-2"><span className="text-xs font-medium text-slate-300">Sévérité</span><select className="soc-select w-full" value={form.severity} onChange={event => setForm(current => ({ ...current, severity: event.target.value as typeof form.severity }))}><option value="critical">Critique</option><option value="high">Élevée</option><option value="medium">Moyenne</option><option value="low">Faible</option></select></label><label className="space-y-2 lg:col-span-2"><span className="text-xs font-medium text-slate-300">Contexte initial</span><textarea required minLength={5} className="soc-select min-h-24 w-full resize-y" value={form.description} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} placeholder="Décrivez les faits observés et le périmètre concerné." /></label><label className="space-y-2"><span className="text-xs font-medium text-slate-300">Score de risque (0–100)</span><input required type="number" min="0" max="100" className="soc-select w-full" value={form.riskScore} onChange={event => setForm(current => ({ ...current, riskScore: Number(event.target.value) }))} /></label><div className="flex items-end justify-end gap-3"><Button type="button" variant="ghost" className="text-slate-400 hover:bg-slate-800 hover:text-slate-100" onClick={() => setShowCreate(false)}>Annuler</Button><Button type="submit" className="bg-cyan-500 text-slate-950 hover:bg-cyan-300" disabled={createIncident.isPending}>Créer l’incident</Button></div></form> : null}
      <section className="grid gap-4 xl:grid-cols-2">
        {incidentsQuery.isLoading ? <LoadingCards /> : null}
        {incidentsQuery.isError ? <p className="soc-panel p-6 text-rose-300">Impossible de charger les incidents : {incidentsQuery.error.message}</p> : null}
        {incidentsQuery.data?.length === 0 ? <EmptyIncidents /> : null}
        {incidentsQuery.data?.map(({ incident, assetName, assigneeName }) => {
          const step = incident.status === "closed" ? undefined : nextSteps[incident.status];
          return (
            <article className="soc-panel group p-5" key={incident.id}>
              <div className="flex items-start justify-between gap-4"><div><p className="font-mono text-xs text-slate-500">INC-{String(incident.id).padStart(4, "0")}</p><h2 className="mt-2 text-lg font-semibold text-slate-100">{incident.title}</h2></div><SeverityBadge severity={incident.severity} /></div>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-400">{incident.description}</p>
              <div className="mt-5 grid grid-cols-2 gap-4 border-y border-slate-800/80 py-4 text-sm"><div><p className="text-xs text-slate-500">Actif concerné</p><p className="mt-1 text-slate-200">{assetName ?? "Non associé"}</p></div><div><p className="text-xs text-slate-500">Responsable</p><p className="mt-1 text-slate-200">{assigneeName ?? "À affecter"}</p></div></div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><div className="space-y-2"><IncidentStatusBadge status={incident.status} /><RiskMeter value={incident.riskScore} /></div><div className="flex flex-wrap items-center gap-2"><Button size="sm" variant="outline" className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800" onClick={() => setSelectedIncidentId(incident.id)}><History className="mr-1.5 h-3.5 w-3.5" />Historique</Button>{!assigneeName ? <Button size="sm" variant="outline" className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800" disabled={assignSelf.isPending} onClick={() => assignSelf.mutate({ id: incident.id })}><UserRoundCheck className="mr-1.5 h-3.5 w-3.5" />Prendre en charge</Button> : null}{step ? <Button size="sm" className="bg-cyan-500 text-slate-950 hover:bg-cyan-300" disabled={transition.isPending} onClick={() => transition.mutate({ id: incident.id, nextStatus: step.nextStatus })}>{step.label}<ArrowRight className="ml-2 h-3.5 w-3.5" /></Button> : <span className="text-xs font-medium text-emerald-300">Dossier clôturé</span>}</div></div>
            </article>
          );
        })}
      </section>
      {selectedIncidentId !== null ? <section className="soc-panel border-cyan-400/20 bg-slate-950/60 p-5"><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><History className="h-4 w-4 text-cyan-300" /><p className="text-sm font-semibold text-slate-100">Historique de l’incident</p></div><p className="mt-1 text-xs text-slate-500">INC-{String(selectedIncidentId).padStart(4, "0")} · actions et décisions enregistrées</p></div><Button size="sm" variant="ghost" className="text-slate-400 hover:bg-slate-800 hover:text-slate-100" onClick={() => setSelectedIncidentId(null)}>Fermer</Button></div>{detailQuery.isLoading ? <p className="py-8 text-sm text-slate-500">Chargement de l’historique…</p> : <><div className="mt-5 space-y-3">{detailQuery.data?.history.length ? detailQuery.data.history.map(({ action, actorName }) => <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3" key={action.id}><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium text-slate-200">{action.actionType === "created" ? "Incident créé" : action.actionType === "status_changed" ? `Statut : ${action.previousStatus} → ${action.nextStatus}` : action.actionType === "assignment" ? "Incident assigné" : "Commentaire ajouté"}</p><p className="font-mono text-[11px] text-slate-500">{new Date(action.createdAt).toLocaleString("fr-FR")}</p></div>{action.comment ? <p className="mt-2 text-sm leading-6 text-slate-400">{action.comment}</p> : null}<p className="mt-2 text-xs text-slate-500">Par {actorName ?? "utilisateur système"}</p></div>) : <p className="py-5 text-sm text-slate-500">Aucune action n’a encore été enregistrée.</p>}</div><form className="mt-5 flex flex-col gap-3 border-t border-slate-800 pt-5 md:flex-row" onSubmit={event => { event.preventDefault(); if (comment.trim()) addComment.mutate({ incidentId: selectedIncidentId, comment: comment.trim() }); }}><textarea className="soc-select min-h-20 flex-1 resize-y" value={comment} onChange={event => setComment(event.target.value)} placeholder="Ajouter une observation à la chronologie…" /><Button type="submit" className="self-end bg-cyan-500 text-slate-950 hover:bg-cyan-300" disabled={!comment.trim() || addComment.isPending}><MessageSquarePlus className="mr-2 h-4 w-4" />Ajouter</Button></form></>}</section> : null}
    </div>
  );
}

function LoadingCards() { return <><div className="soc-panel h-64 animate-pulse bg-slate-900/70" /><div className="soc-panel h-64 animate-pulse bg-slate-900/70" /></>; }
function EmptyIncidents() { return <div className="soc-panel col-span-full flex flex-col items-center gap-3 py-16 text-center"><ClipboardCheck className="h-7 w-7 text-cyan-300" /><p className="font-medium text-slate-200">Aucun incident ouvert.</p><p className="max-w-md text-sm text-slate-500">Les dossiers d’investigation créés par les analystes permettront d’associer plusieurs alertes et d’en tracer la réponse.</p></div>; }
export default function Incidents() { return <DashboardLayout><IncidentsContent /></DashboardLayout>; }
