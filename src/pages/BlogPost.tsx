import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import NotFound from "./NotFound";
import { getPost } from "./blogPosts";
import FeaturedImagePlaceholder from "@/components/FeaturedImagePlaceholder";
import { ReferralLeaderboardCard } from "@/components/rei/ReferralLeaderboardCard";

const BlogPost = () => {
  const { slug } = useParams();
  const post = getPost(slug);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(1200);

  useEffect(() => {
    if (!post) return;
    document.title = `${post.title} | Rei`;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", post.description);
  }, [post]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "rei-blog-height" && typeof e.data.height === "number") {
        setHeight(Math.max(400, e.data.height + 40));
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  if (!post) return <NotFound />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[960px] px-4 pb-24 pt-8">
        <Link
          to="/articles"
          className="inline-block font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
        >
          ← All articles
        </Link>

        <div className="mt-4 overflow-hidden rounded-[14px]">
          {post.image ? (
            <img
              src={post.image}
              alt={post.title}
              className="aspect-[16/6] w-full object-cover"
            />
          ) : (
            <FeaturedImagePlaceholder title={post.title} />
          )}
        </div>

        <iframe
          ref={iframeRef}
          src={post.file}
          title={post.title}
          className="mt-4 w-full border-0"
          style={{ height }}
          scrolling="no"
        />
        {slug === "refer-to-earn-with-rei-ai" && (
          <section className="mt-6">
            <h2 className="mb-3 text-lg font-medium">This month's top 10 referrers</h2>
            <ReferralLeaderboardCard compact />
          </section>
        )}
        <div className="mt-10 border-t border-border pt-8">
          <Link
            to="/articles"
            className="font-mono text-xs text-primary transition-opacity hover:opacity-80"
          >
            ← All articles
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BlogPost;
