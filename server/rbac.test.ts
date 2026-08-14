import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function analystContext(): TrpcContext {
  return {
    user: {
      id: 42,
      openId: "security-analyst",
      name: "Analyste SOC",
      email: "analyst@example.test",
      loginMethod: "manus",
      role: "analyst",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("RBAC SOC", () => {
  it("refuse les journaux d’audit à un analyste avant tout accès aux données", async () => {
    const caller = appRouter.createCaller(analystContext());
    await expect(caller.soc.admin.auditLogs()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
