import { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/blog/posts';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.alexisreyna.dev';

  const posts: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updated ?? post.date),
    changeFrequency: 'yearly',
    priority: 0.6,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/skills`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog/guidelines`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    ...posts,
  ];
}
