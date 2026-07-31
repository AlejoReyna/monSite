import Link from "next/link";
import { getAllPosts, formatDate } from "@/lib/blog/posts";

export default async function BlogIndex() {
  const posts = getAllPosts();
  const featuredPost = posts[0];

  return (
    <>
      <div className="blog-home">
        <section className="blog-feature" aria-labelledby="featured-post-title">
          <div className="blog-feature-image" aria-hidden="true">
            <video
              className="blog-feature-video"
              autoPlay
              loop
              muted
              playsInline
            >
              <source src="/article_bg.mov" type="video/quicktime" />
              <source src="/article_bg.mov" type="video/mp4" />
            </video>
          </div>
          <div className="blog-feature-shade" aria-hidden="true" />

          <div className="blog-feature-content">
            <div className="blog-feature-copy">
              <h1 id="featured-post-title">{featuredPost.title}</h1>
              <p>{featuredPost.summary}</p>
              <Link className="blog-feature-link" href={`/blog/${featuredPost.slug}`}>
                Read the story <span aria-hidden="true">↗</span>
              </Link>
            </div>

            <div className="blog-feature-byline">
              <p>
                <time dateTime={featuredPost.date}>{formatDate(featuredPost.date)}</time>
                <span aria-hidden="true">•</span>
                {featuredPost.readingMinutes} min read
              </p>
            </div>

            <div className="blog-feature-dots" aria-label="Featured post 1 of 2">
              <span data-active="true" />
              <span />
            </div>
          </div>
        </section>
      </div>

      <div className="blog-shell" style={{ minHeight: "100vh", padding: "3.5rem 0 1.5rem", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p className="blog-coming-soon" style={{ margin: 0 }}>
          There are no other posts yet, but soon will be!
        </p>
      </div>
    </>
  );
}
