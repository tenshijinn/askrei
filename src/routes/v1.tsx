import { createFileRoute } from "@tanstack/react-router";
import JoinRei from "@/pages/JoinRei";

export const Route = createFileRoute("/v1")({
  component: JoinRei,
});
