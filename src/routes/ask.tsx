import { createFileRoute } from "@tanstack/react-router";
import Ask from "@/pages/Ask";

export const Route = createFileRoute("/ask")({
  component: Ask,
});
