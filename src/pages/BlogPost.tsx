import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import NotFound from "./NotFound";
import { getPost } from "./blogPosts";

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
          to="/blog"
          className="inline-block font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
        >
          ← All posts
        </Link>
        <iframe
          ref={iframeRef}
          src={post.file}
          title={post.title}
          className="mt-4 w-full border-0"
          style={{ height }}
          scrolling="no"
        />
        <div className="mt-10 border-t border-border pt-8">
          <Link
            to="/blog"
            className="font-mono text-xs text-primary transition-opacity hover:opacity-80"
          >
            ← All posts
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BlogPost;
