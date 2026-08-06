import { createFileRoute } from "@tanstack/react-router";
import Rei from "@/pages/Rei";

export const Route = createFileRoute("/rei")({
  component: Rei,
});
