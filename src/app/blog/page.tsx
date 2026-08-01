import Link from "next/link";
import BlogFeatureVideo from "@/components/blog/blog-feature-video";
import { getAllPosts, formatDate } from "@/lib/blog/posts";

export default async function BlogIndex() {
  const posts = getAllPosts();
  const featuredPost = posts[0];
  const remainingPosts = posts.slice(1);
  const featuredIsSpanish =
    featuredPost.locale?.toLowerCase().startsWith("es") ?? false;

  return (
    <>
      <div className="blog-home">
        <section className="blog-feature" aria-labelledby="featured-post-title">
          <div className="blog-feature-image" aria-hidden="true">
            <BlogFeatureVideo />
          </div>
          <div className="blog-feature-shade" aria-hidden="true" />

          <div className="blog-feature-content">
            <div className="blog-feature-copy">
              <h1 id="featured-post-title">{featuredPost.title}</h1>
              <p>{featuredPost.summary}</p>
              <Link className="blog-feature-link" href={`/blog/${featuredPost.slug}`}>
                {featuredIsSpanish ? "Lee el post" : "Read the story"}
              </Link>
            </div>

            <div className="blog-feature-byline">
              <p>
                <time dateTime={featuredPost.date}>
                  {formatDate(featuredPost.date, featuredPost.locale)}
                </time>
                <span aria-hidden="true">•</span>
                {featuredPost.readingMinutes}{" "}
                {featuredIsSpanish ? "min de lectura" : "min read"}
              </p>
            </div>

            <div className="blog-feature-dots" aria-label="Featured post">
              <span data-active="true" />
            </div>
          </div>
        </section>
      </div>

      {remainingPosts.length > 0 ? (
        <section className="blog-index blog-shell" aria-labelledby="all-posts-title">
          <div className="blog-index-heading">
            <div>
              <p className="blog-eyebrow">Archivo</p>
              <h2 id="all-posts-title">Más notas técnicas</h2>
            </div>
            <p>
              Arquitectura, sistemas de diseño y decisiones pequeñas que hacen
              que el software se sienta sólido.
            </p>
          </div>

          <ul className="blog-list blog-index-list">
            {remainingPosts.map((post) => (
              <li className="blog-row" key={post.slug}>
                <Link href={`/blog/${post.slug}`}>
                  <time className="blog-row-date" dateTime={post.date}>
                    {formatDate(post.date, post.locale)}
                  </time>
                  <div>
                    <h3 className="blog-row-title">{post.title}</h3>
                    <p className="blog-row-summary">{post.summary}</p>
                    <div className="blog-row-meta">
                      {post.tags.map((tag) => (
                        <span className="blog-index-tag" key={tag}>
                          {tag}
                        </span>
                      ))}
                      <span className="blog-readtime">
                        {post.readingMinutes}{" "}
                        {post.locale?.startsWith("es")
                          ? "min de lectura"
                          : "min read"}
                      </span>
                    </div>
                  </div>
                  <span className="blog-index-arrow" aria-hidden="true">
                    ↗
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <p className="blog-coming-soon" style={{ marginTop: "3.5rem", marginBottom: "4rem" }}>
            No hay más publicaciones por ahora, ¡pero pronto habrá más!
          </p>
        </section>
      ) : (
        <div className="blog-shell" style={{ padding: "4rem 0 5rem", textAlign: "center" }}>
          <p className="blog-coming-soon" style={{ margin: 0 }}>
            No hay más publicaciones por ahora, ¡pero pronto habrá más!
          </p>
        </div>
      )}
    </>
  );
}
