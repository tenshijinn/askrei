import { createFileRoute } from "@tanstack/react-router";
import AdminMockups from "@/pages/AdminMockups";

export const Route = createFileRoute("/admin/mockups")({
  component: AdminMockups,
});
