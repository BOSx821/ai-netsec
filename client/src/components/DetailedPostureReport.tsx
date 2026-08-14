type Severity = "critical" | "high" | "medium" | "low";

export type DetailedReportContent = {
  generatedAt: string;
  generatedBy: string;
  scope: string;
  executiveSummary: {
    globalRiskScore: number;
    activeAlerts: number;
    criticalAlerts: number;
    activeIncidents: number;
    monitoredSystems: number;
    onlineSystems: number;
  };
  riskTrend: Array<{ capturedAt: string; score: number; activeAlerts: number; openIncidents: number }>;
  alertSummary: Array<{ severity: Severity; count: number }>;
  priorityAlerts: Array<{ id: number; title: string; severity: Severity; status: string; riskScore: number; category: string; assetName?: string | null; confidence: number }>;
  activeIncidents: Array<{ id: number; title: string; severity: Severity; status: string; riskScore: number; assetName?: string | null; assigneeName?: string | null }>;
  highRiskAssets: Array<{ id: number; name: string; assetType: string; ipAddress?: string | null; owner?: string | null; status: string; riskLevel: Severity; riskScore: number }>;
  recommendations: string[];
  limitations: string[];
};

const labels: Record<string, string> = { critical: "Critique", high: "Élevée", medium: "Moyenne", low: "Faible", open: "Ouvert", in_progress: "En cours", resolved: "Résolu", closed: "Fermé", online: "En ligne", degraded: "Dégradé", offline: "Hors ligne", unknown: "Inconnu" };

export function asDetailedReportContent(value: unknown): DetailedReportContent | undefined {
  if (!value || typeof value !== "object") return undefined;
  const candidate = value as Partial<DetailedReportContent>;
  return candidate.executiveSummary && Array.isArray(candidate.priorityAlerts) && Array.isArray(candidate.recommendations) ? candidate as DetailedReportContent : undefined;
}

function fmtDate(value: string | Date) { return new Date(value).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }); }
function Label({ value }: { value: string }) { return <span className={`report-label report-label-${value}`}>{labels[value] ?? value}</span>; }

export function DetailedPostureReport({ id, title, content, printOnly = false }: { id: number; title: string; content: DetailedReportContent; printOnly?: boolean }) {
  const summary = content.executiveSummary;
  return <article className={`report-print ${printOnly ? "report-print-source" : "report-preview"}`}>
    <header className="report-cover">
      <div><p className="report-kicker">AI-NETSEC · SECURITY OPERATIONS</p><h1>{title}</h1><p className="report-subtitle">Rapport détaillé de posture de sécurité</p><p className="report-classification">Usage interne · Diffusion restreinte</p></div>
      <div className="report-id"><span>Référence</span><strong>RPT-{String(id).padStart(4, "0")}</strong><span>Généré le {fmtDate(content.generatedAt)}</span></div>
    </header>

    <section className="report-section"><h2>Synthèse exécutive</h2><p className="report-lead">Ce rapport présente les signaux, incidents et actifs disponibles dans la plateforme au moment de sa génération. Il constitue un support de priorisation et ne remplace pas l’analyse humaine.</p><div className="report-metrics"><Metric label="Score global" value={`${summary.globalRiskScore}/100`} /><Metric label="Alertes actives" value={String(summary.activeAlerts)} detail={`${summary.criticalAlerts} critiques`} /><Metric label="Incidents actifs" value={String(summary.activeIncidents)} /><Metric label="Couverture" value={`${summary.onlineSystems}/${summary.monitoredSystems}`} detail="systèmes en ligne" /></div></section>

    <section className="report-section"><h2>Évolution du risque</h2>{content.riskTrend.length ? <table><thead><tr><th>Date</th><th>Score de risque</th><th>Alertes actives</th><th>Incidents actifs</th></tr></thead><tbody>{content.riskTrend.map(point => <tr key={point.capturedAt}><td>{fmtDate(point.capturedAt)}</td><td><strong>{point.score}/100</strong></td><td>{point.activeAlerts}</td><td>{point.openIncidents}</td></tr>)}</tbody></table> : <p className="report-empty">Aucun instantané de risque n’est disponible.</p>}<div className="report-distribution">{content.alertSummary.map(item => <div key={item.severity}><Label value={item.severity} /><strong>{item.count}</strong><span> alerte{item.count > 1 ? "s" : ""}</span></div>)}</div></section>

    <section className="report-section print-page-break"><h2>Alertes prioritaires</h2>{content.priorityAlerts.length ? <table><thead><tr><th>Alerte</th><th>Sévérité</th><th>Statut</th><th>Actif</th><th>Risque</th><th>Confiance</th></tr></thead><tbody>{content.priorityAlerts.map(alert => <tr key={alert.id}><td><strong>ALT-{String(alert.id).padStart(5, "0")}</strong><br />{alert.title}<small>{alert.category}</small></td><td><Label value={alert.severity} /></td><td><Label value={alert.status} /></td><td>{alert.assetName ?? "Non associé"}</td><td>{alert.riskScore}/100</td><td>{alert.confidence}%</td></tr>)}</tbody></table> : <p className="report-empty">Aucune alerte active à présenter.</p>}</section>

    <section className="report-section"><h2>Incidents actifs</h2>{content.activeIncidents.length ? <table><thead><tr><th>Dossier</th><th>Sévérité</th><th>Statut</th><th>Responsable</th><th>Actif</th><th>Risque</th></tr></thead><tbody>{content.activeIncidents.map(incident => <tr key={incident.id}><td><strong>INC-{String(incident.id).padStart(4, "0")}</strong><br />{incident.title}</td><td><Label value={incident.severity} /></td><td><Label value={incident.status} /></td><td>{incident.assigneeName ?? "À affecter"}</td><td>{incident.assetName ?? "Non associé"}</td><td>{incident.riskScore}/100</td></tr>)}</tbody></table> : <p className="report-empty">Aucun incident actif à présenter.</p>}</section>

    <section className="report-section"><h2>Actifs prioritaires</h2>{content.highRiskAssets.length ? <table><thead><tr><th>Actif</th><th>Type</th><th>Adresse</th><th>Propriétaire</th><th>Disponibilité</th><th>Risque</th></tr></thead><tbody>{content.highRiskAssets.map(asset => <tr key={asset.id}><td>{asset.name}</td><td>{asset.assetType}</td><td className="report-mono">{asset.ipAddress ?? "—"}</td><td>{asset.owner ?? "Non défini"}</td><td><Label value={asset.status} /></td><td><Label value={asset.riskLevel} /> {asset.riskScore}/100</td></tr>)}</tbody></table> : <p className="report-empty">Aucun actif de niveau élevé ou critique à présenter.</p>}</section>

    <section className="report-section report-grid"><div><h2>Recommandations</h2><ol>{content.recommendations.map((item, index) => <li key={index}>{item}</li>)}</ol></div><div><h2>Limites et périmètre</h2><p>{content.scope}</p><ul>{content.limitations.map((item, index) => <li key={index}>{item}</li>)}</ul></div></section>

    <footer className="report-footer"><span>Généré par {content.generatedBy}</span><span>AI-NETSEC · Document interne</span><span>RPT-{String(id).padStart(4, "0")}</span></footer>
  </article>;
}

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) { return <div><span>{label}</span><strong>{value}</strong>{detail ? <small>{detail}</small> : null}</div>; }
