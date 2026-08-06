import { createFileRoute } from "@tanstack/react-router";
import UnlimitedPostsReturn from "@/pages/UnlimitedPostsReturn";

export const Route = createFileRoute("/unlimited-posts/return")({
  component: UnlimitedPostsReturn,
});
