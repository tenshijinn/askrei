import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { blogPosts } from "./blogPosts";

const Blog = () => {
  useEffect(() => {
    document.title = "Research & Blog | Rei";
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        "content",
        "Onchain research notes from Rei on airdrops, holder retention, diamond hands and crypto growth marketing.",
      );
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[900px] px-6 pb-32 pt-20">
        <header className="mb-14">
          <div className="mb-5 flex items-center gap-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-primary">
              Research / Blog
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <h1 className="mb-3 text-4xl font-light tracking-tight md:text-5xl">
            Onchain notes from Rei
          </h1>
          <p className="max-w-[560px] text-muted-foreground">
            Short, data-led notes on airdrops, holder retention and what actually keeps
            people holding a token.
          </p>
        </header>

        <div className="space-y-5">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="group block rounded-[14px] border border-border bg-card p-6 transition-colors hover:border-primary/40 md:p-8"
            >
              <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {post.date} · {post.category}
              </div>
              <h2 className="mb-3 text-2xl font-normal tracking-tight transition-colors group-hover:text-primary">
                {post.title}
              </h2>
              <p className="mb-5 max-w-[620px] text-sm leading-relaxed text-muted-foreground">
                {post.excerpt}
              </p>
              <span className="inline-flex items-center gap-2 font-mono text-xs text-primary">
                Read
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-16">
          <Link
            to="/"
            className="font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
          >
            ← Back to rei.chat
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Blog;
