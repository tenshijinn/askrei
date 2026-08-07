import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchBounties from "./tools/search-bounties";
import searchJobs from "./tools/search-jobs";
import listSkillCategories from "./tools/list-skill-categories";
import whoami from "./tools/whoami";

// Build issuer from the project ref so it survives publish and matches the
// direct Supabase auth issuer that discovery advertises.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "rei-chat-mcp",
  title: "Rei.chat MCP",
  version: "0.1.0",
  instructions:
    "Read-only access to rei.chat's aggregated Web3 opportunity index. Use `search_bounties` for active bounties/tasks (Superteam, Zealy, QuestN, Scribble, etc.), `search_jobs` for active jobs, `list_skill_categories` for the taxonomy, and `whoami` to verify the connection.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchBounties, searchJobs, listSkillCategories, whoami],
});
