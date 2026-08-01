import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Blocks from "@/components/blog/blocks";
import ChapterNavigation from "@/components/blog/chapter-navigation";
import { getPostChapters } from "@/lib/blog/chapters";
import { getPost, getAllPosts, formatDate } from "@/lib/blog/posts";
import {
  countReadableWords,
  getReadingMinutes,
} from "@/lib/blog/reading-time";

const SITE_URL = "https://www.alexisreyna.dev";
const AUTHOR_URL = `${SITE_URL}/`;

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

  const path = `/blog/${post.slug}`;
  const image = post.ogImage
    ? [
        {
          url: post.ogImage,
          width: 1200,
          height: 630,
          alt: `${post.title} — artículo de Alexis Reyna`,
        },
      ]
    : undefined;

  return {
    title: post.seoTitle ? { absolute: post.seoTitle } : post.title,
    description: post.summary,
    keywords: post.keywords,
    authors: [{ name: "Alexis Reyna", url: AUTHOR_URL }],
    creator: "Alexis Reyna",
    publisher: "Alexis Reyna",
    alternates: {
      canonical: path,
      ...(post.locale ? { languages: { [post.locale]: path } } : {}),
    },
    openGraph: {
      type: "article",
      url: path,
      title: post.title,
      description: post.summary,
      publishedTime: post.date,
      modifiedTime: post.updated,
      authors: [AUTHOR_URL],
      tags: post.tags,
      locale: post.locale?.replace("-", "_"),
      images: image,
    },
    twitter: {
      card: post.ogImage ? "summary_large_image" : "summary",
      title: post.title,
      description: post.summary,
      images: post.ogImage ? [post.ogImage] : undefined,
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
  const readingMinutes = post.readingMinutes ?? getReadingMinutes(post.blocks);
  const isSpanish = post.locale?.toLowerCase().startsWith("es") ?? false;

  const isArtisanalBrewHero =
    post.slug === "red-neuronal-javascript-robots-pixel-art";
  const postUrl = `${SITE_URL}/blog/${post.slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    url: postUrl,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    inLanguage: post.locale ?? "en-US",
    wordCount: countReadableWords(post.blocks),
    timeRequired: `PT${readingMinutes}M`,
    keywords: post.keywords ?? post.tags,
    articleSection: post.tags,
    isAccessibleForFree: true,
    author: {
      "@type": "Person",
      name: "Alexis Reyna",
      url: AUTHOR_URL,
      sameAs: [
        "https://github.com/AlejoReyna",
        "https://www.linkedin.com/in/alexis-alberto-reyna-sánchez-6953102b4",
      ],
    },
    publisher: {
      "@type": "Person",
      name: "Alexis Reyna",
      url: AUTHOR_URL,
    },
    ...(post.ogImage
      ? { image: `${SITE_URL}${post.ogImage}` }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />

      <article
        className={`blog-article${isArtisanalBrewHero ? " blog-article--pixel-hero" : ""}`}
        lang={post.locale}
      >
        <div className="blog-article-grid">
          <ChapterNavigation chapters={chapters} />

          <div className="blog-article-content">
            <header
              className={`blog-article-head${post.titleAsset ? " blog-article-head--robots" : ""}`}
              id="article-introduction"
            >
              <div className="blog-row-meta" style={{ marginTop: 0 }}>
                <time className="blog-row-date" dateTime={post.date}>
                  {formatDate(post.date, post.locale)}
                </time>
                <span className="blog-readtime" style={{ marginLeft: "auto" }}>
                  {isSpanish ? `${readingMinutes} minutos de lectura` : `${readingMinutes} min read`}
                </span>
              </div>
              <div className="blog-article-title-row">
                <h1>{post.title}</h1>
              </div>
              <p className="blog-row-summary">{post.summary}</p>
              <ul className="blog-article-tags" aria-label={isSpanish ? "Temas" : "Topics"}>
                {post.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
              {post.titleAsset && (
                <div
                  className="blog-title-robots"
                  role="img"
                  aria-label={post.titleAsset.alt}
                >
                  <span
                    aria-hidden
                    className="blog-title-sprite blog-title-sprite--dance"
                    style={
                      {
                        backgroundImage: `url("${post.titleAsset.src}")`,
                        backgroundSize: `${post.titleAsset.frames * 100}% 100%`,
                        width: post.titleAsset.frameWidth,
                        height: post.titleAsset.frameHeight,
                      }
                    }
                  />
                  <span
                    aria-hidden
                    className="blog-title-sprite blog-title-sprite--jump"
                    style={
                      {
                        backgroundImage: `url("${post.titleAsset.src}")`,
                        backgroundSize: `${post.titleAsset.frames * 100}% 100%`,
                        width: post.titleAsset.frameWidth,
                        height: post.titleAsset.frameHeight,
                      }
                    }
                  />
                </div>
              )}
            </header>

            <Blocks blocks={post.blocks} />
          </div>
        </div>
      </article>
    </>
  );
}
