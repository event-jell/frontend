import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  url?: string;
}

export default function SEO({
  title = 'EventJell | Premium Floor & Stage Planner',
  description = 'Premium event management. Floor plans, guest lists, ticketing, vendors, communications — all in one place.',
  ogImage = 'https://eventjell.com/thumbnail.png',
  ogType = 'website',
  url = 'https://eventjell.com',
}: SEOProps) {
  // If a specific title is provided, append the brand, otherwise just use the brand.
  const fullTitle = title === 'EventJell' || title === 'EventJell | Premium Floor & Stage Planner'
    ? title
    : `${title} | EventJell`;

  const absoluteImageUrl = ogImage.startsWith('http://') || ogImage.startsWith('https://')
    ? ogImage
    : `https://eventjell.com${ogImage.startsWith('/') ? '' : '/'}${ogImage}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={absoluteImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="EventJell" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteImageUrl} />
    </Helmet>
  );
}
