/**
 * Article Draft Preview Page
 * ==========================
 * Accessible at /preview/:token
 * Allows sharing unpublished articles for review via a secret link.
 * No authentication required — anyone with the link can view.
 */

import { trpc } from "@/lib/trpc";
import { useParams } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function ArticlePreviewPage() {
  const { token } = useParams<{ token: string }>();
  const { data: article, isLoading, error } = trpc.articles.byPreviewToken.useQuery(
    { token: token! },
    { enabled: !!token }
  );

  if (isLoading) return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <div className="container py-16 text-center">
        <div className="text-[#F5C518] text-3xl animate-pulse mb-4">✈</div>
        <p className="text-gray-500">Loading preview...</p>
      </div>
    </div>
  );

  if (error || !article) return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <div className="container py-16 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-2xl font-black text-white mb-2">Preview Not Found</h1>
        <p className="text-gray-500 mb-4">This preview link may have expired or been revoked.</p>
        <a href="/" className="text-[#F5C518] hover:underline">← Back to Flight Drama</a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />

      {/* Draft preview banner */}
      <div className="bg-[#F5C518] text-black py-2 px-4 text-center text-sm font-bold">
        🔍 DRAFT PREVIEW — This article has not been published yet. This link is for review purposes only.
      </div>

      <main className="container py-8 max-w-4xl mx-auto">
        {/* Category */}
        {article.categoryName && (
          <div className="mb-4">
            <span
              className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded"
              style={{ background: article.categoryColour || '#F5C518', color: '#000' }}
            >
              {article.categoryName}
            </span>
          </div>
        )}

        {/* Title */}
        <h1 className="text-4xl font-black text-white leading-tight mb-4">{article.title}</h1>

        {/* Excerpt */}
        {article.excerpt && (
          <p className="text-xl text-gray-400 mb-6 border-l-4 border-[#F5C518] pl-4">{article.excerpt}</p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-6 pb-6 border-b border-[oklch(0.18_0_0)]">
          {article.authorName && <span>By <strong className="text-white">{article.authorName}</strong></span>}
          <span>{new Date(article.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          {article.content && (() => {
            const words = article.content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
            return <span>{Math.max(1, Math.round(words / 200))} min read</span>;
          })()}
        </div>

        {/* Featured image */}
        {article.featuredImage && (
          <img
            src={article.featuredImage}
            alt={article.title}
            className="w-full rounded-xl object-cover mb-8"
            style={{ maxHeight: 480 }}
          />
        )}

        {/* Article content */}
        <div
          className="article-prose max-w-none"
          dangerouslySetInnerHTML={{ __html: article.content || '' }}
        />
      </main>

      <Footer />
    </div>
  );
}
