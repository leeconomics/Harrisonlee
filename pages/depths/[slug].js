// pages/depths/[slug].js
// One long article per series. Background is a surface→abyssal gradient,
// each Part N: heading is anchored, and a sticky side rail jumps you to a part.
import Head from 'next/head';
import Link from 'next/link';
import { getAllDepthsMeta, getDepthBySlug } from '../../lib/depths';

export default function DepthArticle({ depth }) {
  if (!depth) return null;

  return (
    <div className="depth-page">
      <Head>
        <title>{depth.title} — blog.harrisonlee.dev</title>
        <meta name="description" content={depth.sub} />
        <meta property="og:title" content={depth.title} />
        <meta property="og:description" content={depth.sub} />
      </Head>

      {/* Top strip */}
      <header className="depth-topnav">
        <Link href="/" className="depth-topnav-home">
          <span className="depth-topnav-arrow">←</span>
          <span>The Depths</span>
        </Link>
        <span className="depth-topnav-brand">blog.harrisonlee.dev</span>
      </header>

      {/* Hero */}
      <section className="depth-hero">
        <p className="depth-hero-eyebrow">
          Series · {(depth.parts && depth.parts.length) || 0} parts
          {depth.date ? <span className="depth-hero-dot"> · </span> : null}
          {depth.date ? <span>{depth.date}</span> : null}
        </p>
        <h1 className="depth-hero-title">{depth.title}</h1>
        <p className="depth-hero-sub">{depth.sub}</p>
      </section>

      <div className="depth-layout">
        {depth.parts && depth.parts.length > 0 && (
          <nav className="depth-rail" aria-label="Series parts">
            <p className="depth-rail-label">Descend</p>
            <ol className="depth-rail-list">
              {depth.parts.map((p, i) => (
                <li key={i}>
                  <a href={`#part-${i + 1}`}>
                    <span className="depth-rail-num">{p.n || (i + 1)}.</span>
                    <span className="depth-rail-title">{p.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <article className="depth-body" dangerouslySetInnerHTML={{ __html: depth.html }} />
      </div>

      <footer className="depth-footer">
        <Link href="/" className="depth-footer-back">← Back to Depths</Link>
      </footer>

      {/* Styles. Global so they apply to the dangerouslySetInnerHTML content. */}
      <style jsx global>{`
        :root { --depth-fade: 6000px; }

        .depth-page {
          min-height: 100vh;
          color: oklch(0.94 0.02 200);
          font-family: "Lora", Georgia, serif;
          font-size: 17px;
          line-height: 1.7;
          font-weight: 300;
          background:
            linear-gradient(
              180deg,
              oklch(0.78 0.04 220) 0%,
              oklch(0.55 0.06 230) 18%,
              oklch(0.32 0.07 238) 38%,
              oklch(0.18 0.05 242) 60%,
              oklch(0.10 0.04 246) 85%,
              oklch(0.06 0.03 250) 100%
            );
          background-attachment: fixed;
        }

        .depth-topnav {
          display: flex; justify-content: space-between; align-items: center;
          padding: 16px 48px;
          background: oklch(0.10 0.04 246 / 0.75);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          position: sticky; top: 0; z-index: 20;
          border-bottom: 1px solid oklch(0.74 0.10 210 / 0.12);
        }
        .depth-topnav-home {
          display: flex; align-items: center; gap: 10px;
          color: oklch(0.74 0.10 210); text-decoration: none;
          font-family: "Geist Mono", ui-monospace, monospace;
          font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase;
        }
        .depth-topnav-home:hover { color: oklch(0.86 0.16 200); }
        .depth-topnav-arrow { font-size: 16px; }
        .depth-topnav-brand {
          font-family: "Geist Mono", ui-monospace, monospace;
          font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
          color: oklch(0.55 0.08 210);
        }

        .depth-hero {
          max-width: 760px;
          margin: 0 auto;
          padding: 96px 48px 48px;
          text-align: left;
        }
        .depth-hero-eyebrow {
          font-family: "Geist Mono", ui-monospace, monospace;
          font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase;
          color: oklch(0.20 0.06 230 / 0.7);
          margin: 0 0 22px;
        }
        .depth-hero-title {
          font-family: "Cormorant Garamond", Georgia, serif;
          font-style: italic;
          font-weight: 500;
          font-size: clamp(48px, 7vw, 84px);
          line-height: 1.0;
          letter-spacing: -0.025em;
          color: oklch(0.18 0.05 240);
          margin: 0 0 24px;
        }
        .depth-hero-sub {
          font-size: 19px;
          line-height: 1.6;
          color: oklch(0.22 0.06 230 / 0.85);
          max-width: 560px;
          margin: 0;
          font-weight: 300;
        }

        .depth-layout {
          max-width: 1080px;
          margin: 0 auto;
          padding: 64px 48px 96px;
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: 64px;
          align-items: start;
        }
        .depth-rail {
          position: sticky;
          top: 96px;
          align-self: start;
          padding: 0;
          margin: 0;
        }
        .depth-rail-label {
          font-family: "Geist Mono", ui-monospace, monospace;
          font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase;
          color: oklch(0.94 0.02 200 / 0.4);
          margin: 0 0 16px;
        }
        .depth-rail-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
          position: relative;
        }
        .depth-rail-list::before {
          content: "";
          position: absolute;
          left: 0; top: 4px; bottom: 4px;
          width: 1px;
          background: linear-gradient(180deg,
            oklch(0.7 0.13 200 / 0.5),
            oklch(0.7 0.13 200 / 0.1));
        }
        .depth-rail-list a {
          display: grid;
          grid-template-columns: 32px 1fr;
          gap: 8px;
          padding: 4px 0 4px 14px;
          color: oklch(0.94 0.02 200 / 0.7);
          text-decoration: none;
          font-size: 13px;
          line-height: 1.3;
          transition: color 0.25s ease;
        }
        .depth-rail-list a:hover { color: oklch(0.86 0.16 200); }
        .depth-rail-num {
          font-family: "Cormorant Garamond", Georgia, serif;
          font-style: italic;
          color: oklch(0.7 0.13 200);
        }
        .depth-rail-title {
          font-family: "Cormorant Garamond", Georgia, serif;
          font-size: 15px;
        }

        .depth-body {
          max-width: 720px;
          color: inherit;
        }
        .depth-body p {
          margin: 0 0 1.4em;
        }
        .depth-body p:first-of-type { font-size: 19px; }
        .depth-body h2.depth-part-heading {
          font-family: "Cormorant Garamond", Georgia, serif;
          font-style: italic;
          font-weight: 500;
          font-size: clamp(32px, 4vw, 44px);
          line-height: 1.1;
          letter-spacing: -0.015em;
          color: oklch(0.96 0.02 200);
          margin: 96px 0 24px;
          padding-top: 24px;
          border-top: 1px solid oklch(0.94 0.02 200 / 0.15);
          scroll-margin-top: 96px;
        }
        .depth-body h2.depth-part-heading:first-child {
          margin-top: 0; padding-top: 0; border-top: none;
        }
        .depth-body strong { color: oklch(0.96 0.02 200); font-weight: 500; }
        .depth-body em { font-style: italic; }
        .depth-body ul, .depth-body ol { margin: 0 0 1.4em 1.4em; padding: 0; }
        .depth-body li { margin: 0.4em 0; }
        .depth-body a { color: oklch(0.86 0.16 200); }
        .depth-body blockquote {
          margin: 1.4em 0;
          padding-left: 1.2em;
          border-left: 2px solid oklch(0.7 0.13 200 / 0.5);
          color: oklch(0.94 0.02 200 / 0.85);
          font-style: italic;
        }

        .depth-footer {
          max-width: 1080px;
          margin: 0 auto;
          padding: 64px 48px 96px;
          text-align: center;
        }
        .depth-footer-back {
          color: oklch(0.7 0.13 200);
          text-decoration: none;
          font-family: "Geist Mono", ui-monospace, monospace;
          font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase;
        }
        .depth-footer-back:hover { color: oklch(0.86 0.16 200); }

        @media (max-width: 880px) {
          .depth-topnav { padding: 14px 20px; }
          .depth-hero { padding: 64px 24px 32px; }
          .depth-layout {
            grid-template-columns: 1fr;
            gap: 32px;
            padding: 32px 24px 64px;
          }
          .depth-rail {
            position: static;
            border: 1px solid oklch(0.94 0.02 200 / 0.15);
            border-radius: 4px;
            padding: 20px;
          }
          .depth-body h2.depth-part-heading { margin-top: 64px; }
          .depth-footer { padding: 32px 24px 64px; }
        }
      `}</style>
    </div>
  );
}

export async function getStaticPaths() {
  const all = getAllDepthsMeta();
  return {
    paths: all.map(d => ({ params: { slug: d.slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const depth = getDepthBySlug(params.slug);
  return { props: { depth } };
}
