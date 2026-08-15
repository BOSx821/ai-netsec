import { describe, expect, it } from "vitest";
import { getRiskPresentation, getRiskProgressLabel, securitySeverityMeta } from "./security-ui";

describe("security UI presentation helpers", () => {
  it("classifies risk scores into explicit and ordered security states", () => {
    expect(getRiskPresentation(12).shortLabel).toBe("Maîtrisé");
    expect(getRiskPresentation(35).shortLabel).toBe("Modéré");
    expect(getRiskPresentation(60).shortLabel).toBe("Élevé");
    expect(getRiskPresentation(80).shortLabel).toBe("Critique");
  });

  it("keeps risk progress text bounded for accessible labels", () => {
    expect(getRiskProgressLabel(-4)).toBe("0 sur 100");
    expect(getRiskProgressLabel(140)).toBe("100 sur 100");
  });

  it("provides an explicit label for every severity level", () => {
    expect(Object.values(securitySeverityMeta).map(meta => meta.label)).toEqual(["Critique", "Élevée", "Moyenne", "Faible"]);
  });
});
