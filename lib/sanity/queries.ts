import {defineQuery} from 'next-sanity'

export const SITE_SETTINGS_QUERY = defineQuery(`
  *[_type == "siteSettings"][0]{
    _id,
    title,
    description,
    announcement,
    logo,
    primaryNavigation[] {
      _key,
      label,
      linkType,
      externalUrl,
      "internalSlug": internalRef->slug.current
    },
    footerText,
    socialLinks[] {
      _key,
      label,
      linkType,
      externalUrl,
      "internalSlug": internalRef->slug.current
    },
    contactEmail
  }
`)

export const HOME_HERO_QUERY = defineQuery(`
  *[_type == "page" && slug.current == "/"][0]{
    "heroBlock": pageBuilder[_type == "heroBlock"][0]{
      _key,
      eyebrow,
      heading,
      subheading,
      image,
      primaryCta {
        _key,
        label,
        linkType,
        externalUrl,
        "internalSlug": internalRef->slug.current
      },
      secondaryCta {
        _key,
        label,
        linkType,
        externalUrl,
        "internalSlug": internalRef->slug.current
      }
    }
  }
`)

export type HomeHeroQueryResult = {
  heroBlock: {
    _key: string;
    eyebrow: string | null;
    heading: string | null;
    subheading: string | null;
    image: {
      asset?: { _ref?: string } | { url?: string } | null;
      hotspot?: { x: number; y: number; height: number; width: number } | null;
      crop?: { top: number; bottom: number; left: number; right: number } | null;
      _type: "image";
    } | null;
    primaryCta: {
      label: string | null;
      linkType: "internal" | "external";
      externalUrl: string | null;
      internalSlug: string | null;
    } | null;
    secondaryCta: {
      label: string | null;
      linkType: "internal" | "external";
      externalUrl: string | null;
      internalSlug: string | null;
    } | null;
  } | null;
};

export const PAGE_BY_SLUG_QUERY = defineQuery(`
  *[_type == "page" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    seo,
    pageBuilder[] {
      _key,
      _type,
      eyebrow,
      heading,
      subheading,
      image,
      primaryCta {
        _key,
        label,
        linkType,
        externalUrl,
        "internalSlug": internalRef->slug.current
      },
      secondaryCta {
        _key,
        label,
        linkType,
        externalUrl,
        "internalSlug": internalRef->slug.current
      },
      content,
      altText,
      caption,
      items
    }
  }
`)

export const ALL_PAGE_SLUGS_QUERY = defineQuery(`
  *[_type == "page" && defined(slug.current)]{ "slug": slug.current }
`)
