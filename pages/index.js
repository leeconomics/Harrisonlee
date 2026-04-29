import Head from 'next/head'
import PersonalSite from '../components/PersonalSite'

export default function Home() {
  return (
    <>
      <Head>
        <title>Harry Lee — Tidal</title>
        <meta name="description" content="Some currents from a mind that won't sit still." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,200..700;1,9..144,200..700&family=Newsreader:ital,opsz,wght@0,6..72,200..700;1,6..72,200..700&family=Geist:wght@300..700&family=Geist+Mono:wght@400..600&display=swap"
          rel="stylesheet"
        />
      </Head>
      <PersonalSite />
    </>
  )
}
