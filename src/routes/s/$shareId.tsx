import { createFileRoute } from "@tanstack/react-router";
import Earn from "@/pages/Earn";

export const Route = createFileRoute("/s/$shareId")({
  component: Earn,
});
