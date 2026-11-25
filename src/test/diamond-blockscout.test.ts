import { afterEach, expect, it, vi } from "vitest";
import { fetchBlockscoutSignals } from "../../supabase/functions/_shared/diamonds/providers/blockscout";

afterEach(() => vi.restoreAllMocks());

it("requests both transaction directions without Blockscout's invalid combined filter", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = new URL(String(input));
    if (url.searchParams.has("filter")) return new Response(JSON.stringify({ errors: [{ detail: "Invalid value for enum" }] }), { status: 422 });
    return new Response(JSON.stringify({ items: [
      { timestamp: "2026-01-01T00:00:00Z" }, { timestamp: "2026-11-01T00:00:00Z" },
    ] }), { status: 200 });
  });
  const result = await fetchBlockscoutSignals("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
  expect(fetchMock).toHaveBeenCalledOnce();
  expect(result.ok).toBe(true);
  expect(result.transaction_count).toBe(2);
  expect(result.first_activity_at).toBe("2026-01-01T00:00:00.000Z");
  expect(result.last_activity_at).toBe("2026-11-01T00:00:00.000Z");
});