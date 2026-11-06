/**
 * site.ts — Single source of truth for brand, contact, and config.
 * Change values here, never in components.
 */

export const site = {
  /** Brand */
  name: 'Stamp',
  tagline: 'Paper stamp cards, without the paper.',
  domain: 'stamp.example.com', // [[FILL: real domain]]
  appUrl: 'https://app.stamp.example.com', // [[FILL: real app subdomain]]

  /** Contact */
  whatsapp: '+919876543210', // [[FILL: real WhatsApp number]]
  whatsappMessage: 'Hi, I run a shop and I am interested in Stamp.',
  phone: '+919876543210', // [[FILL: real phone]]
  email: 'hello@stamp.example.com', // [[FILL: real email]]
  socialLinks: {
    instagram: '', // [[FILL: Instagram URL if any]]
  },

  /** Location */
  city: 'Pune', // [[FILL: city]]

  /** Legal */
  legalEntity: '[[FILL: legal entity name, e.g. "Stamp Technologies LLP"]]',
  registeredAddress: '[[FILL: full registered address]]',
  grievanceOfficer: {
    name: '[[FILL: grievance officer name]]',
    email: '[[FILL: grievance officer email]]',
  },
  policyLastUpdated: '2026-11-01', // [[FILL: actual date]]

  /** Pricing */
  pricing: {
    visible: false,
    plans: [] as Array<{
      name: string;
      price: string;
      period: string;
      features: string[];
      highlight?: boolean;
    }>,
  },

  /** Analytics */
  analyticsEnabled: false,
} as const;

export type SiteConfig = typeof site;

