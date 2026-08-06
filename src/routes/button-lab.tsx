import { createFileRoute } from "@tanstack/react-router";
import ButtonLab from "@/pages/ButtonLab";

export const Route = createFileRoute("/button-lab")({
  component: ButtonLab,
});
