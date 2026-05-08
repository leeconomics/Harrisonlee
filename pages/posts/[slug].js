// pages/posts/[slug].js
import Head from 'next/head';
import Link from 'next/link';
import { getAllPostsMeta, getPostBySlug } from '../../lib/posts';

// ─── Top navigation strip ────────────────────────────────────────────────────
function ArticleNav({ prev, next }) {
  const linkStyle = {
    display: 'flex', alignItems: 'center', gap: 8,
    color: 'oklch(0.74 0.10 210)', textDecoration: 'none',
    transition: 'color 0.2s ease',
    maxWidth: 300,
    fontFamily: '"Geist", "Inter", system-ui, sans-serif',
    fontSize: 13,
    fontWeight: 400,
    lineHeight: 1.35,
  };
  const arrowStyle = {
    fontFamily: '"Geist Mono", monospace',
    fontSize: 16,
    flexShrink: 0,
    color: 'oklch(0.60 0.10 210)',
  };
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '14px 48px',
      borderBottom: '1px solid oklch(0.74 0.10 210 / 0.12)',
      background: 'oklch(0.14 0.045 242 / 0.85)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      position: 'sticky', top: 0, zIndex: 10,
    }}>
      {prev ? (
        <Link href={`/posts/${prev.slug}`} style={linkStyle}
          onMouseEnter={e => e.currentTarget.style.color = 'oklch(0.86 0.16 200)'}
          onMouseLeave={e => e.currentTarget.style.color = 'oklch(0.74 0.10 210)'}
        >
          <span style={arrowStyle}>←</span>
          <span style={{ opacity: 0.85 }}>{prev.title}</span>
        </Link>
      ) : <span />}

      <Link href="/" style={{
        fontFamily: '"Geist Mono", monospace', fontSize: 10, letterSpacing: '0.18em',
        textTransform: 'uppercase', color: 'oklch(0.55 0.08 210)', textDecoration: 'none',
        transition: 'color 0.2s',
      }}
        onMouseEnter={e => e.currentTarget.style.color = 'oklch(0.74 0.10 210)'}
        onMouseLeave={e => e.currentTarget.style.color = 'oklch(0.55 0.08 210)'}
      >
        Tidal
      </Link>

      {next ? (
        <Link href={`/posts/${next.slug}`} style={{ ...linkStyle, justifyContent: 'flex-end', textAlign: 'right' }}
          onMouseEnter={e => e.currentTarget.style.color = 'oklch(0.86 0.16 200)'}
          onMouseLeave={e => e.currentTarget.style.color = 'oklch(0.74 0.10 210)'}
        >
          <span style={{ opacity: 0.85 }}>{next.title}</span>
          <span style={arrowStyle}>→</span>
        </Link>
      ) : <span />}
    </div>
  );
}

// ─── Category accent color (matches PersonalSite catColorMap) ─────────────────
const CAT_ACCENT = {
  Careers:   'oklch(0.34 0.07 230)',
  Business:  'oklch(0.30 0.08 220)',
  Marketing: 'oklch(0.34 0.09 200)',
  AI:        'oklch(0.30 0.09 245)',
  Japan:     'oklch(0.32 0.08 175)',
  Personal:  'oklch(0.40 0.07 65)',
};
const CAT_BG = {
  Careers:   'oklch(0.93 0.025 230 / 0.18)',
  Business:  'oklch(0.92 0.035 215 / 0.18)',
  Marketing: 'oklch(0.93 0.04 195 / 0.18)',
  AI:        'oklch(0.91 0.045 240 / 0.18)',
  Japan:     'oklch(0.93 0.04 175 / 0.18)',
  Personal:  'oklch(0.93 0.035 75 / 0.18)',
};

// ─── Bottom same-category CTAs ────────────────────────────────────────────────
function RelatedArticles({ posts, primaryCat }) {
  if (!posts || posts.length === 0) return null;
  const accent = CAT_ACCENT[primaryCat] || 'oklch(0.74 0.16 200)';
  return (
    <div style={{ marginTop: 80, paddingTop: 48, borderTop: '1px solid oklch(0.74 0.10 210 / 0.18)' }}>
      <div style={{
        fontFamily: '"Geist Mono", monospace', fontSize: 10, letterSpacing: '0.18em',
        textTransform: 'uppercase', color: 'oklch(0.55 0.08 210)', marginBottom: 24,
      }}>
        More in {primaryCat}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {posts.map(p => (
          <Link key={p.slug} href={`/posts/${p.slug}`} style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              padding: '18px 22px',
              background: 'oklch(0.20 0.05 235 / 0.45)',
              border: `1px solid ${accent}33`,
              borderLeft: `3px solid ${accent}`,
              borderRadius: 6,
              transition: 'background 0.25s ease, border-color 0.25s ease',
              cursor: 'pointer',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'oklch(0.24 0.06 232 / 0.6)';
                e.currentTarget.style.borderLeftColor = accent;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'oklch(0.20 0.05 235 / 0.45)';
                e.currentTarget.style.borderLeftColor = `${accent}`;
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: '"Fraunces", Georgia, serif',
                  fontSize: 17, fontWeight: 400, lineHeight: 1.25,
                  color: 'oklch(0.92 0.018 200)',
                  marginBottom: 4,
                }}>
                  {p.title}
                </div>
                <div style={{
                  fontFamily: '"Newsreader", Georgia, serif',
                  fontSize: 14, fontStyle: 'italic', fontWeight: 300,
                  color: 'oklch(0.72 0.025 210 / 0.80)',
                  lineHeight: 1.4,
                }}>
                  {p.subtitle || p.sub}
                </div>
              </div>
              <div style={{
                flexShrink: 0, marginLeft: 20,
                fontFamily: '"Geist Mono", monospace', fontSize: 10,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: 'oklch(0.55 0.08 210)',
                textAlign: 'right', paddingTop: 2,
              }}>
                <div>{p.readTime || p.read}</div>
                <div style={{ marginTop: 4, color: accent, opacity: 0.85 }}>Read →</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function PostPage({ post, prevPost, nextPost, sameCatPosts }) {
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
      <div style={{
        background: 'linear-gradient(180deg, oklch(0.16 0.05 242) 0%, oklch(0.10 0.04 246) 100%)',
        minHeight: '100vh', overflowY: 'auto'
      }}>
        <ArticleNav prev={prevPost} next={nextPost} />
        <div className="tidal-modal-inner" style={{ maxWidth: 880, margin: '0 auto', padding: '64px 48px 120px' }}>
          <article>
            <div className="grid grid-cols-12 gap-6 mb-16">
              <div className="col-span-12 md:col-span-9 md:col-start-2">
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
                <RelatedArticles posts={sameCatPosts} primaryCat={post.cats && post.cats[0]} />
              </div>
            </div>
          </article>
        </div>
      </div>
    </>
  );
}

export async function getStaticPaths() {
  const allPosts = getAllPostsMeta();
  return {
    paths: allPosts.map(p => ({ params: { slug: p.slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const post = getPostBySlug(params.slug);
  if (!post) return { notFound: true };

  // All posts sorted newest-first (same order as Currents feed)
  const allMeta = getAllPostsMeta();
  const idx = allMeta.findIndex(p => p.slug === params.slug);

  // prev = older (higher index), next = newer (lower index)
  const prevPost = allMeta[idx + 1]
    ? { slug: allMeta[idx + 1].slug, title: allMeta[idx + 1].title }
    : null;
  const nextPost = allMeta[idx - 1]
    ? { slug: allMeta[idx - 1].slug, title: allMeta[idx - 1].title }
    : null;

  // Up to 3 articles sharing the primary category, excluding self
  const primaryCat = post.cats && post.cats[0];
  const sameCatPosts = primaryCat
    ? allMeta
        .filter(p => p.slug !== params.slug && p.cats && p.cats.includes(primaryCat))
        .slice(0, 3)
        .map(p => ({ slug: p.slug, title: p.title, subtitle: p.subtitle || p.sub, read: p.read, readTime: p.readTime }))
    : [];

  return { props: { post, prevPost, nextPost, sameCatPosts } };
}
