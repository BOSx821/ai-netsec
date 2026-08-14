import { z } from "zod";
import * as db from "../db";
import { invokeLLM, listLLMModels } from "../_core/llm";
import { protectedProcedure, router } from "../_core/trpc";

function toJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export const assistantRouter = router({
  ask: protectedProcedure
    .input(z.object({ question: z.string().min(2).max(1600), alertId: z.number().int().positive().optional(), incidentId: z.number().int().positive().optional() }))
    .mutation(async ({ ctx, input }) => {
      const [summary, alertContext, incidentContext] = await Promise.all([
        db.getSocSummary(),
        input.alertId ? db.getAlertById(input.alertId) : undefined,
        input.incidentId ? db.getIncidentById(input.incidentId) : undefined,
      ]);
      const incidentHistory = input.incidentId ? await db.listIncidentActions(input.incidentId) : [];
      const { data: models } = await listLLMModels();
      const model = models.find(modelInfo => modelInfo.id === "gpt-5-mini")?.id ?? models.find(modelInfo => modelInfo.id.startsWith("claude-haiku"))?.id ?? models[0]?.id;
      if (!model) throw new Error("Aucun modèle IA n’est disponible pour l’assistant.");

      const response = await invokeLLM({
        model,
        messages: [
          {
            role: "system",
            content: "Tu es AI-NETSEC Assistant, un assistant d’aide à l’analyse SOC. Réponds exclusivement en français. Utilise seulement le contexte fourni. Distingue explicitement les faits observés, les hypothèses et les vérifications recommandées. Ne prétends jamais avoir exécuté une action, observé un élément absent du contexte, ou confirmé une compromission. Ne fournis pas d’instructions offensives exploitables; privilégie les mesures de défense, de collecte de preuves et d’escalade.",
          },
          {
            role: "user",
            content: `Question de l’analyste : ${input.question}\n\nContexte SOC agrégé :\n${toJson(summary)}\n\nAlerte éventuellement sélectionnée :\n${toJson(alertContext ?? "Aucune")}\n\nIncident éventuellement sélectionné :\n${toJson(incidentContext ?? "Aucun")}\n\nHistorique d’incident éventuellement sélectionné :\n${toJson(incidentHistory)}`,
          },
        ],
        maxTokens: 900,
      });
      const answer = response.choices[0]?.message.content;
      if (!answer || typeof answer !== "string") throw new Error("L’assistant n’a pas produit de réponse exploitable.");
      await db.writeAuditLog({ actorUserId: ctx.user.id, action: "assistant.ask", resourceType: "assistant", metadata: { model, alertId: input.alertId, incidentId: input.incidentId } });
      return { answer, model };
    }),
});
