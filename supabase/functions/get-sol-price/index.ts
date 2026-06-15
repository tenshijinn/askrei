import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { fetchSolPriceUsd } from "../_shared/sol-price.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const result = await fetchSolPriceUsd("[get-sol-price]");
    return new Response(
      JSON.stringify({
        price: result.price,
        sources: result.sources,
        median: result.median,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("[get-sol-price] failure:", err?.message ?? err);
    return new Response(
      JSON.stringify({
        error: "Unable to fetch a trustworthy SOL price right now. Please try again in a moment.",
      }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
