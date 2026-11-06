/**
 * images.ts — Image slot registry.
 * Drop files into public/images/{id}.jpg to replace placeholders.
 */

export interface ImageSlot {
  id: string;
  aspectRatio: string; // CSS aspect-ratio value e.g. "4 / 5"
  width: number;
  height: number;
  alt: string;
  caption?: string;
  src?: string; // path relative to /images/, e.g. "hero-counter.jpg"
}

export const images: Record<string, ImageSlot> = {
  'hero-counter': {
    id: 'hero-counter',
    aspectRatio: '4 / 5',
    width: 640,
    height: 800,
    alt: 'A shopkeeper at a counter with the QR stand, natural light',
    caption: 'Your counter, your QR',
  },
  'app-scan': {
    id: 'app-scan',
    aspectRatio: '9 / 19.5',
    width: 360,
    height: 780,
    alt: 'App screenshot: scanning the QR code',
    caption: 'Scan the QR',
  },
  'app-stamp': {
    id: 'app-stamp',
    aspectRatio: '9 / 19.5',
    width: 360,
    height: 780,
    alt: 'App screenshot: stamp landing on the card',
    caption: 'Stamp collected',
  },
  'app-scratch': {
    id: 'app-scratch',
    aspectRatio: '9 / 19.5',
    width: 360,
    height: 780,
    alt: 'App screenshot: scratch card reveal',
    caption: 'Scratch for a surprise',
  },
  'app-reward': {
    id: 'app-reward',
    aspectRatio: '9 / 19.5',
    width: 360,
    height: 780,
    alt: 'App screenshot: claiming a reward',
    caption: 'Claim your reward',
  },
  'app-ledger': {
    id: 'app-ledger',
    aspectRatio: '9 / 19.5',
    width: 360,
    height: 780,
    alt: 'App screenshot: shopkeeper dashboard ledger',
    caption: 'Your ledger',
  },
  'benefit-lead': {
    id: 'benefit-lead',
    aspectRatio: '3 / 2',
    width: 720,
    height: 480,
    alt: 'A regular customer at the counter with a phone',
    caption: 'Customers who come back',
  },
  'customers-scan': {
    id: 'customers-scan',
    aspectRatio: '4 / 5',
    width: 640,
    height: 800,
    alt: 'A customer scanning the QR code at a shop',
    caption: 'One scan, one stamp',
  },
  'shops-chai': {
    id: 'shops-chai',
    aspectRatio: '4 / 3',
    width: 640,
    height: 480,
    alt: 'A chai stall with morning light',
    caption: 'Chai stalls',
  },
  'shops-cafe': {
    id: 'shops-cafe',
    aspectRatio: '4 / 3',
    width: 640,
    height: 480,
    alt: 'A neighbourhood café counter',
    caption: 'Cafés',
  },
  'shops-salon': {
    id: 'shops-salon',
    aspectRatio: '4 / 3',
    width: 640,
    height: 480,
    alt: 'A salon reception area',
    caption: 'Salons',
  },
  'about-founder': {
    id: 'about-founder',
    aspectRatio: '4 / 5',
    width: 640,
    height: 800,
    alt: 'Founder portrait',
  },
  'about-workshop': {
    id: 'about-workshop',
    aspectRatio: '3 / 2',
    width: 720,
    height: 480,
    alt: 'Laptop and notebook sketches on a desk',
    caption: 'Where it started',
  },
  'about-visit': {
    id: 'about-visit',
    aspectRatio: '3 / 2',
    width: 720,
    height: 480,
    alt: 'Setting up a QR code in a real shop',
    caption: 'First pilot setup',
  },
  'contact-front': {
    id: 'contact-front',
    aspectRatio: '16 / 9',
    width: 1200,
    height: 675,
    alt: 'Shopfront or static map image',
  },
  'og-image': {
    id: 'og-image',
    aspectRatio: '1200 / 630',
    width: 1200,
    height: 630,
    alt: 'Stamp — QR-based loyalty for local shops',
  },
};

export function getImage(id: string): ImageSlot {
  const slot = images[id];
  if (!slot) throw new Error(`Unknown image slot: ${id}`);
  return slot;
}

export function hasImage(id: string): boolean {
  const slot = images[id];
  return Boolean(slot?.src);
}

