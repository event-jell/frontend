import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://eventjell.com';
const SITE_NAME = 'EventJell';
const DEFAULT_TITLE = 'EventJell | Premium Floor & Stage Planner';
const DEFAULT_DESCRIPTION =
  'Premium event management. Floor plans, guest lists, ticketing, vendors, communications — all in one place.';
const DEFAULT_OG_IMAGE = `${SITE_URL}/thumbnail.png`;

type JsonLd = Record<string, unknown>;

interface SEOProps {
  title?: string;
  description?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product' | 'profile';
  /** Absolute URL or path (e.g. "/explore"). Sets both og:url and <link rel="canonical">. */
  url?: string;
  /** Explicit canonical override. Defaults to `url`. Consolidates duplicate/alias routes. */
  canonical?: string;
  /** Comma-separated or array of keywords. */
  keywords?: string | string[];
  /** When true, tells crawlers not to index this page (used for auth/app screens). */
  noindex?: boolean;
  /** Structured data (schema.org). Object or array of objects — rendered as JSON-LD. */
  jsonLd?: JsonLd | JsonLd[];
  /** Alt text for the social share image. */
  imageAlt?: string;
}

/** Resolve a path or absolute URL to an absolute https URL on the site origin. */
function toAbsolute(value: string): string {
  if (!value) return SITE_URL;
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `${SITE_URL}${value.startsWith('/') ? '' : '/'}${value}`;
}

export default function SEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  url = SITE_URL,
  canonical,
  keywords,
  noindex = false,
  jsonLd,
  imageAlt,
}: SEOProps) {
  // If a specific title is provided, append the brand, otherwise just use the brand.
  const fullTitle =
    title === SITE_NAME || title === DEFAULT_TITLE ? title : `${title} | ${SITE_NAME}`;

  const absoluteImageUrl = toAbsolute(ogImage);
  const canonicalUrl = toAbsolute(canonical ?? url);
  const keywordsContent = Array.isArray(keywords) ? keywords.join(', ') : keywords;
  const robots = noindex
    ? 'noindex, nofollow'
    : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

  const jsonLdBlocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      {keywordsContent ? <meta name="keywords" content={keywordsContent} /> : null}
      <meta name="robots" content={robots} />
      <meta name="googlebot" content={robots} />

      {/* Canonical — consolidates duplicate/alias routes for a single ranking signal */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={absoluteImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      {imageAlt ? <meta property="og:image:alt" content={imageAlt} /> : null}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteImageUrl} />
      {imageAlt ? <meta name="twitter:image:alt" content={imageAlt} /> : null}

      {/* Structured data */}
      {jsonLdBlocks.map((block, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}
    </Helmet>
  );
}
