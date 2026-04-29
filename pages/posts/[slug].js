// pages/posts/[slug].js
// Direct article URL: /posts/<slug>
// Renders a single memo from its markdown file. Pre-built at deploy time.

import Head from 'next/head';
import Link from 'next/link';
import { getAllPostSlugs, getPostBySlug } from '../../lib/posts';

export default function PostPage({ post }) {
  if (!post) return null;

  return (
    <>
      <Head>
        <title>{`${post.title} — Harry Lee`}</title>
        <meta name="description" content={post.subtitle || ''} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,200..700;1,9..144,200..700&family=Newsreader:ital,opsz,wght@0,6..72,200..700;1,6..72,200..700&family=Geist:wght@300..700&family=Geist+Mono:wght@400..600&display=swap"
          rel="stylesheet"
        />
      </Head>
      {/* Ocean reading mode — same palette + typography as the Currents modal,
          so direct article URLs and the modal feel like one continuous reading
          surface. Typography rules live in globals.css under .memo-body.ocean-mode */}
      <div style={{
        background: 'linear-gradient(180deg, oklch(0.16 0.05 242) 0%, oklch(0.10 0.04 246) 100%)',
        minHeight: '100vh', overflowY: 'auto'
      }}>
        <div className="tidal-modal-inner" style={{ maxWidth: 880, margin: '0 auto', padding: '64px 48px 120px' }}>
          <Link href="/" className="eyebrow" style={{
            display: 'inline-block',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'oklch(0.74 0.10 210)',
            marginBottom: 48,
            padding: 0,
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.18em',
            textDecoration: 'none',
          }}>← Back to Tidal</Link>
          <article>
            <div className="grid grid-cols-12 gap-6 mb-16">
              <div className="col-span-12 md:col-span-9 md:col-start-2">
                <p className="heading-sans text-xs mb-6" style={{
                  color: 'oklch(0.74 0.16 200)', letterSpacing: '0.18em',
                  textTransform: 'uppercase', fontSize: 11, fontWeight: 500
                }}>{post.tag}</p>
                <h1 style={{
                  fontFamily: 'Fraunces, Georgia, serif',
                  fontSize: 'clamp(2.2rem, 4.4vw, 3.4rem)',
                  fontWeight: 300, lineHeight: 1.08,
                  letterSpacing: '-0.025em',
                  color: 'oklch(0.96 0.014 200)',
                  margin: '0 0 24px',
                }}>
                  {post.title}
                </h1>
                <p className="body-serif" style={{
                  fontSize: '1.25rem', lineHeight: 1.5,
                  color: 'oklch(0.78 0.025 210 / 0.88)',
                  fontStyle: 'italic', fontWeight: 300
                }}>
                  {post.subtitle}
                </p>
                <div className="flex items-center gap-6 mt-10 flex-wrap">
                  <span className="tag-pill" style={{ color: 'oklch(0.74 0.04 215)' }}>{post.displayDate}</span>
                  <span className="tag-pill" style={{ color: 'oklch(0.74 0.04 215)', opacity: 0.7 }}>{post.readTime}</span>
                  {post.cats && post.cats.map(c => (<span key={c} className="tag-chip">{c}</span>))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 md:col-span-9 md:col-start-2 memo-body ocean-mode">
                <div dangerouslySetInnerHTML={{ __html: post.contentHtml || '' }} />
              </div>
            </div>
          </article>
        </div>
      </div>
    </>
  );
}

export async function getStaticPaths() {
  const slugs = getAllPostSlugs();
  return {
    paths: slugs.map(slug => ({ params: { slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const post = getPostBySlug(params.slug);
  if (!post) {
    return { notFound: true };
  }
  return { props: { post } };
}
