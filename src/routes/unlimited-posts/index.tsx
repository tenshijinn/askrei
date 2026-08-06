import { createFileRoute } from "@tanstack/react-router";
import UnlimitedPosts from "@/pages/UnlimitedPosts";

export const Route = createFileRoute("/unlimited-posts/")({
  component: UnlimitedPosts,
});
