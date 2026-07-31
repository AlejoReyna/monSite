import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Blocks from "@/components/blog/blocks";
import ChapterNavigation from "@/components/blog/chapter-navigation";
import PixelScene from "@/components/blog/pixel-scene";
import { getPostChapters } from "@/lib/blog/chapters";
import { getPost, getAllPosts, formatDate } from "@/lib/blog/posts";

/** Static params so every post is prerendered at build time. */
export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);

  if (!post) return { title: "Not found" };

  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      url: `/blog/${post.slug}`,
      title: post.title,
      description: post.summary,
      publishedTime: post.date,
      tags: post.tags,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);

  if (!post) notFound();
  const chapters = getPostChapters(post.blocks);

  const isArtisanalBrewHero = post.slug === "hero-pixel-artisanal-brew";

  return (
    <>
      {isArtisanalBrewHero && (
        <div className="blog-pixel-route-bg">
          <PixelScene decorative />
        </div>
      )}

      <article
        className={`blog-article${isArtisanalBrewHero ? " blog-article--pixel-hero" : ""}`}
      >
        <div className="blog-article-grid">
        <ChapterNavigation chapters={chapters} />

        <div className="blog-article-content">
          <header className="blog-article-head" id="article-introduction">
            <div className="blog-row-meta" style={{ marginTop: 0 }}>
              <time className="blog-row-date" dateTime={post.date}>
                {formatDate(post.date)}
              </time>
              <span className="blog-readtime">
                {post.readingMinutes} min read
              </span>
            </div>
            <div className="blog-article-title-row">
              <h1>{post.title}</h1>
              {post.titleAsset && (
                <span
                  className="blog-title-sprite"
                  role="img"
                  aria-label={post.titleAsset.alt}
                  style={
                    {
                      backgroundImage: `url("${post.titleAsset.src}")`,
                      backgroundSize: `${post.titleAsset.frames * 100}% 100%`,
                      width: post.titleAsset.frameWidth,
                      height: post.titleAsset.frameHeight,
                    }
                  }
                />
              )}
            </div>
            <p className="blog-row-summary">{post.summary}</p>
          </header>

          <Blocks blocks={post.blocks} />
        </div>
      </div>
      </article>
    </>
  );
}
