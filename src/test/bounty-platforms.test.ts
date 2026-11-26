import { describe, expect, it } from "vitest";
import { bountyPlatformLabel } from "../../supabase/functions/_shared/bounty-platforms";

describe("bounty platform labels", () => {
  it("shows makefun as make.fun", () => {
    expect(bountyPlatformLabel("makefun")).toBe("make.fun");
  });
  it("shows pumpfun as pump.fun", () => {
    expect(bountyPlatformLabel("pumpfun")).toBe("pump.fun");
  });
  it("keeps an unknown platform visible under its own name", () => {
    expect(bountyPlatformLabel("brandnewsource")).toBe("brandnewsource");
  });
});
