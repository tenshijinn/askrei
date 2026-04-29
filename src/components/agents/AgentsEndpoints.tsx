import { ScrollFadeIn } from '../joinrei/ScrollFadeIn';

const endpoints = [
  { method: 'GET', path: '/tasks', desc: 'List active tasks & bounties (filter by role, skill, since)' },
  { method: 'GET', path: '/tasks/:id', desc: 'Fetch a single task' },
  { method: 'GET', path: '/jobs', desc: 'List active jobs (full-time, contract, etc.)' },
  { method: 'GET', path: '/jobs/:id', desc: 'Fetch a single job' },
  { method: 'GET', path: '/skill-categories', desc: 'Full skill taxonomy with task/job counts' },
  { method: 'GET', path: '/feed', desc: 'Combined incremental feed — best for polling agents' },
  { method: 'GET', path: '/health', desc: 'Self-describing healthcheck' },
];

const sample = `{
  "data": [
    {
      "id": "5f2c…",
      "title": "Build a Solana token indexer",
      "description": "Index all SPL transfers for…",
      "role_tags": ["developer", "rust"],
      "compensation": "$2,500",
      "company_name": "Helius",
      "link": "https://earn.superteam.fun/…",
      "skill_category_ids": ["a1b2…"],
      "created_at": "2026-04-29T10:12:00Z"
    }
  ],
  "count": 142,
  "next_cursor": "2026-04-29T10:12:00Z"
}`;

export const AgentsEndpoints = () => (
  <section className="min-h-screen snap-start relative flex items-center justify-center bg-[#0a0a0a] py-20">
    <div className="container mx-auto px-8 lg:px-16">
      <ScrollFadeIn>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-primary text-center mb-4">
          Seven endpoints. One JSON shape.
        </h2>
        <p className="text-cream/60 text-center font-mono text-sm max-w-2xl mx-auto mb-12">
          Stable schema, cursor-based pagination, OpenAPI-friendly. Your agent loop can be a 5-line cron.
        </p>
      </ScrollFadeIn>

      <div className="grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
        <ScrollFadeIn>
          <div className="rounded-2xl border border-white/10 bg-[#141414] overflow-hidden">
            {endpoints.map((e, i) => (
              <div
                key={e.path}
                className={`flex items-center gap-3 px-5 py-3.5 font-mono text-xs ${
                  i !== endpoints.length - 1 ? 'border-b border-white/5' : ''
                }`}
              >
                <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] uppercase tracking-wider">
                  {e.method}
                </span>
                <span className="text-cream font-medium w-44">{e.path}</span>
                <span className="text-cream/50 flex-1">{e.desc}</span>
              </div>
            ))}
          </div>
        </ScrollFadeIn>

        <ScrollFadeIn delay={150}>
          <div className="rounded-2xl border border-white/10 bg-[#0d0d0d] overflow-hidden h-full">
            <div className="px-4 py-2.5 border-b border-white/10 font-mono text-[10px] uppercase tracking-wider text-cream/50">
              Example response · GET /tasks?limit=1
            </div>
            <pre className="p-5 text-[11px] leading-relaxed font-mono text-cream/80 overflow-x-auto">
              {sample}
            </pre>
          </div>
        </ScrollFadeIn>
      </div>
    </div>
  </section>
);
