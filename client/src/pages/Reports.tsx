import DashboardLayout from "@/components/DashboardLayout";
import { SocPageHeader } from "@/components/SocPageHeader";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Download, FileBarChart2, FileJson2, Printer, Sparkles } from "lucide-react";
import { toast } from "sonner";

function downloadJson(filename: string, content: unknown) {
  const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function ReportsContent() {
  const reportsQuery = trpc.soc.reports.list.useQuery();
  const utils = trpc.useUtils();
  const generate = trpc.soc.reports.generatePosture.useMutation({
    onSuccess: report => { toast.success("Rapport de posture généré."); void utils.soc.reports.list.invalidate(); downloadJson(`ai-netsec-posture-${report.id}.json`, report.content); },
    onError: error => toast.error(error.message),
  });
  return <div className="space-y-7"><SocPageHeader eyebrow="Gouvernance & synthèse" title="Rapports de posture" description="Générez une synthèse consolidée des risques, alertes, incidents et actifs prioritaires. Les données sont exportables au format JSON." actions={<><Button className="bg-cyan-500 text-slate-950 hover:bg-cyan-300" disabled={generate.isPending} onClick={() => generate.mutate()}><Sparkles className="mr-2 h-4 w-4" />{generate.isPending ? "Génération…" : "Générer le rapport"}</Button><Button variant="outline" className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Imprimer / PDF</Button></>} />
    <section className="grid gap-4 md:grid-cols-3"><ReportFeature icon={FileBarChart2} title="Posture consolidée" text="Score global, disponibilité, signaux actifs et tendance de risque." /><ReportFeature icon={FileJson2} title="Export structuré" text="Téléchargement JSON pour archivage, audit ou analyse complémentaire." /><ReportFeature icon={Download} title="Version traçable" text="Chaque génération est persistée et journalisée côté serveur." /></section>
    <section className="soc-panel overflow-hidden"><div className="border-b border-slate-800 px-5 py-4"><h2 className="text-sm font-semibold text-slate-100">Rapports générés</h2><p className="mt-1 text-xs text-slate-500">Les rapports reflètent les données disponibles au moment de leur génération.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="border-b border-slate-800 bg-slate-950/40 text-[11px] uppercase tracking-[0.18em] text-slate-500"><tr><th className="px-5 py-4">Rapport</th><th className="px-5 py-4">Type</th><th className="px-5 py-4">Date</th><th className="px-5 py-4">Export</th></tr></thead><tbody className="divide-y divide-slate-800/80">{reportsQuery.isLoading ? <tr><td colSpan={4} className="px-5 py-10 text-sm text-slate-500">Chargement de l’historique des rapports…</td></tr> : null}{reportsQuery.data?.length === 0 ? <tr><td colSpan={4} className="px-5 py-14 text-center text-sm text-slate-500">Aucun rapport n’a encore été généré.</td></tr> : null}{reportsQuery.data?.map(report => <tr key={report.id} className="hover:bg-slate-900/40"><td className="px-5 py-4"><p className="font-medium text-slate-200">{report.title}</p><p className="mt-1 font-mono text-xs text-slate-500">RPT-{String(report.id).padStart(4, "0")}</p></td><td className="px-5 py-4 text-sm capitalize text-slate-300">{report.reportType}</td><td className="px-5 py-4 text-sm text-slate-400">{new Date(report.createdAt).toLocaleString("fr-FR")}</td><td className="px-5 py-4"><Button size="sm" variant="outline" className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800" onClick={() => downloadJson(`ai-netsec-${report.id}.json`, report.content)}><Download className="mr-1.5 h-3.5 w-3.5" />JSON</Button></td></tr>)}</tbody></table></div></section></div>;
}

function ReportFeature({ icon: Icon, title, text }: { icon: typeof FileBarChart2; title: string; text: string }) { return <div className="soc-panel border-slate-800 bg-slate-950/35 p-5"><div className="rounded-xl border border-cyan-400/15 bg-cyan-400/5 p-2.5 w-fit"><Icon className="h-5 w-5 text-cyan-300" /></div><h2 className="mt-4 font-semibold text-slate-100">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{text}</p></div>; }
export default function Reports() { return <DashboardLayout><ReportsContent /></DashboardLayout>; }
