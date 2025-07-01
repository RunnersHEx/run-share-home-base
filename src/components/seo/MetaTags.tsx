
import { Helmet } from 'react-helmet-async';

interface MetaTagsProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  locale?: string;
  structuredData?: any;
}

const MetaTags = ({
  title = 'Runners Home Exchange - Corre el Mundo, Vive como Local',
  description = 'Conecta con corredores locales, descubre carreras auténticas y experimenta destinos como nunca antes. La plataforma que conecta runners de todo el mundo.',
  keywords = 'running, carreras, intercambio, corredores, viajes, maratón, atletismo',
  image = '/images/og-default.jpg',
  url = typeof window !== 'undefined' ? window.location.href : '',
  type = 'website',
  locale = 'es_ES',
  structuredData
}: MetaTagsProps) => {
  const siteName = 'Runners Home Exchange';
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="Runners Home Exchange" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* Open Graph Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Additional SEO */}
      <link rel="canonical" href={url} />
      <meta name="robots" content="index, follow" />
      <meta name="theme-color" content="#1E40AF" />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default MetaTags;

// Helper functions for structured data
export const createRaceStructuredData = (race: any) => ({
  "@context": "https://schema.org",
  "@type": "SportsEvent",
  "name": race.name,
  "description": race.description,
  "startDate": race.race_date,
  "location": {
    "@type": "Place",
    "name": race.start_location || race.property?.locality
  },
  "sport": "Running",
  "offers": {
    "@type": "Offer",
    "price": race.points_cost,
    "priceCurrency": "PTS",
    "availability": "https://schema.org/InStock"
  }
});

export const createProfileStructuredData = (profile: any) => ({
  "@context": "https://schema.org",
  "@type": "Person",
  "name": `${profile.first_name} ${profile.last_name}`,
  "description": profile.bio,
  "image": profile.profile_image_url,
  "hasCredential": profile.verification_status === 'approved'
});
