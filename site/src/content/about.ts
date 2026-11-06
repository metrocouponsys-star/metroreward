/**
 * about.ts — All copy for the About page.
 */

export const opening = {
  headline: 'We built this for the counter, not the boardroom.',
  sub: 'Stamp is a loyalty system for shopkeepers who know their customers by face but lose them to convenience.',
};

export const why = {
  headline: 'Why we built this',
  paragraphs: [
    '[[FILL: Founder story paragraph 1 — what shop or experience sparked the idea? E.g. "I watched my barber keep a notebook of regulars. One day he lost it."]]',
    '[[FILL: Founder story paragraph 2 — what did you try first, and what didn\'t work?]]',
    '[[FILL: Founder story paragraph 3 — what made you decide to build Stamp?]]',
  ],
};

export const principles = {
  headline: 'What we believe',
  items: [
    {
      title: 'Shopkeepers should own the relationship with their customers',
      description: 'Your data stays yours. We never contact your customers or sell their information.',
    },
    {
      title: 'If it needs a manual, it is too complicated',
      description: 'A shopkeeper should be able to set up and run the program without reading instructions.',
    },
    {
      title: 'Rewards must be fair to both sides',
      description: 'Customers earn something real. Shopkeepers control the cost. Nobody games the system.',
    },
    {
      title: 'We tell you what it cannot do yet',
      description: 'The product is new. We are honest about what is ready and what is coming.',
    },
  ],
};

export const pilotSteps = {
  headline: 'How a pilot works',
  steps: [
    {
      title: 'We talk',
      description: 'Tell us about your shop, your regulars, and what kind of reward makes sense.',
    },
    {
      title: 'We set you up',
      description: 'We create your program, configure your stamp card and scratch card prizes, and give you a QR to show.',
    },
    {
      title: 'You go live',
      description: 'Show the QR at your counter. We check in after a week to see how it is going.',
    },
  ],
};

export const team = {
  headline: 'The people',
  description: '[[FILL: A short line about the team or solo founder. E.g. "Built by one person in Pune, with help from shopkeepers who tested early versions."]]',
};

export const location = {
  headline: 'Where we are',
  text: '[[FILL: city and a brief note, e.g. "Based in Pune, India. We visit shops in person wherever we can."]]',
};

export const aboutCta = {
  headline: 'Want to try it in your shop?',
  text: 'We are looking for shops to run an early pilot. If you are curious, get in touch.',
  primaryCta: { label: 'Start a pilot', href: '/contact' },
  secondaryCta: { label: 'WhatsApp us', href: '' }, // filled from site.ts
};

