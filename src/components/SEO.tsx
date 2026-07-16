import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
}

export default function SEO({
  title = 'EventJelly',
  description = 'Premium event management. Floor plans, guest lists, ticketing, vendors, communications — all in one place.',
  ogImage = '/thumbnail.png',
  ogType = 'website',
}: SEOProps) {
  // If a specific title is provided, append the brand, otherwise just use the brand.
  const fullTitle = title === 'EventJelly' ? title : `${title} | EventJelly`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={ogImage} />
    </Helmet>
  );
}
