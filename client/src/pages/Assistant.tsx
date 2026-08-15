import { AIChatBox, Message } from "@/components/AIChatBox";
import DashboardLayout from "@/components/DashboardLayout";
import { SocPageHeader } from "@/components/SocPageHeader";
import { SocInsightCard } from "@/components/SocInsightCard";
import { trpc } from "@/lib/trpc";
import { BrainCircuit, FileSearch, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function AssistantContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [alertId, setAlertId] = useState<string>("");
  const [incidentId, setIncidentId] = useState<string>("");
  const alertsQuery = trpc.soc.alerts.list.useQuery();
  const incidentsQuery = trpc.soc.incidents.list.useQuery();
  const ask = trpc.soc.assistant.ask.useMutation({
    onSuccess: response => setMessages(current => [...current, { role: "assistant", content: response.answer }]),
    onError: error => { toast.error(error.message); setMessages(current => [...current, { role: "assistant", content: "Je ne peux pas analyser cette demande pour le moment. Vérifiez le contexte sélectionné ou réessayez ultérieurement." }]); },
  });

  const sendMessage = (question: string) => {
    setMessages(current => [...current, { role: "user", content: question }]);
    ask.mutate({ question, ...(alertId ? { alertId: Number(alertId) } : {}), ...(incidentId ? { incidentId: Number(incidentId) } : {}) });
  };

  return <div className="space-y-7"><SocPageHeader eyebrow="Intelligence assistée" title="Assistant IA de sécurité" description="Interrogez le contexte SOC disponible. Les réponses distinguent les faits observés, les hypothèses et les vérifications recommandées." />
    <section className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_340px]"><AIChatBox messages={messages} onSendMessage={sendMessage} isLoading={ask.isPending} height="620px" placeholder="Posez une question à propos des alertes, incidents ou actifs…" emptyStateMessage="Demandez une analyse du contexte de sécurité actuel." suggestedPrompts={["Quelles priorités dois-je traiter en premier ?", "Explique les risques associés aux alertes actives.", "Propose des vérifications défensives pour les incidents ouverts."]} className="soc-panel border-slate-800 bg-slate-950/40" />
      <aside className="space-y-4"><section className="soc-panel border-slate-800 bg-slate-950/40 p-5"><div className="flex items-center gap-2"><FileSearch className="h-4 w-4 text-cyan-300" /><h2 className="text-sm font-semibold text-slate-100">Contexte ciblé</h2></div><p className="mt-2 text-xs leading-5 text-slate-500">Facultatif : sélectionnez une alerte ou un incident afin de l’ajouter à l’analyse.</p><div className="mt-4 space-y-3"><label className="block"><span className="mb-1.5 block text-xs font-medium text-slate-300">Alerte</span><select className="soc-select w-full" value={alertId} onChange={event => setAlertId(event.target.value)}><option value="">Aucune alerte</option>{alertsQuery.data?.map(({ alert }) => <option value={alert.id} key={alert.id}>ALT-{String(alert.id).padStart(5, "0")} · {alert.title}</option>)}</select></label><label className="block"><span className="mb-1.5 block text-xs font-medium text-slate-300">Incident</span><select className="soc-select w-full" value={incidentId} onChange={event => setIncidentId(event.target.value)}><option value="">Aucun incident</option>{incidentsQuery.data?.map(({ incident }) => <option value={incident.id} key={incident.id}>INC-{String(incident.id).padStart(4, "0")} · {incident.title}</option>)}</select></label></div></section>
        <SocInsightCard icon={ShieldCheck} eyebrow="Cadre d’usage" title="Limites d’assistance" description="L’assistant propose des pistes d’analyse. Il ne confirme pas une compromission, n’exécute aucune action et ne remplace pas la validation d’un analyste." tone="warning" />
        <SocInsightCard icon={BrainCircuit} eyebrow="Méthode" title="Bon usage" description="Utilisez des demandes précises, vérifiez les sources et ajoutez les décisions retenues dans la chronologie de l’incident." />
      </aside></section></div>;
}

export default function Assistant() { return <DashboardLayout><AssistantContent /></DashboardLayout>; }
