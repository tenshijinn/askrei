import { createFileRoute } from "@tanstack/react-router";
import CampaignRedirect from "@/pages/CampaignRedirect";

export const Route = createFileRoute("/c/$code")({
  component: CampaignRedirect,
});
