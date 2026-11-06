/**
 * home.ts — All copy for the home page.
 * Edit text here, never in components. No lorem ipsum.
 */

export const hero = {
  headline: 'Paper stamp cards, without the paper.',
  /** The word that gets the scribble underline */
  underlineWord: 'paper',
  sub: 'Customers scan a QR at your counter, collect stamps on their phone and scratch for surprise rewards. You see every visit.',
  primaryCta: { label: 'Start a free pilot', href: '/contact' },
  secondaryCta: { label: 'See how it works', href: '#how-it-works' },
  facts: [
    'No app to download',
    'Works on any phone',
    'Nothing to buy for your counter',
  ],
};

export const problem = {
  sentence:
    'Paper cards get lost, get stamped by anyone, and tell you nothing about the people who walk in.',
};

export const howItWorks = {
  label: 'how it works',
  steps: [
    {
      number: 1,
      title: 'You show the QR at your counter',
      description: 'Print it, prop up a phone, or use a tablet. The QR is always ready.',
      screen: 'app-scan',
    },
    {
      number: 2,
      title: 'A customer scans it with their phone camera and signs in with their number',
      description: 'No app download. They open the camera, scan, enter their mobile number, and get a one-time code.',
      screen: 'app-stamp',
    },
    {
      number: 3,
      title: 'A stamp lands on their card',
      description: 'One visit, one stamp. The card fills up right on their phone.',
      screen: 'app-stamp',
    },
    {
      number: 4,
      title: 'Some visits give a scratch card with a prize you set',
      description: 'You decide the prizes, the odds, and how many. The result is decided on our server, not the phone.',
      screen: 'app-scratch',
    },
    {
      number: 5,
      title: 'When the card is full they claim a reward and you confirm it at the counter',
      description: 'They get a one-time code, show it to you, and you tap Confirm. Done.',
      screen: 'app-reward',
    },
  ],
};

export const benefits = {
  label: 'benefits',
  items: [
    {
      title: 'Customers who come back',
      description:
        'Automatic reminders nudge people when a reward is ready or when they have not visited for a while. You do nothing.',
      isLead: true,
      image: 'benefit-lead',
    },
    {
      title: 'Know every regular by name',
      description:
        'See who visited, when, and how many stamps they have.',
    },
    {
      title: 'No paper to print, lose or fake',
      description:
        'The card lives on the customer\u2019s phone. Nobody can stamp it at home.',
    },
    {
      title: 'Stamps that cannot be faked',
      description:
        'The QR at your counter changes every few seconds, so a photo of it is useless, and a cooldown stops repeat scans.',
    },
    {
      title: 'Scratch cards on your terms',
      description:
        'You choose the prizes, the odds and how many of each you give away. The server decides the result, not the phone.',
    },
    {
      title: 'Nothing to buy',
      description:
        'Show the QR on any phone or tablet. No terminal, no stamp pad, no printer.',
    },
    {
      title: 'You stay in charge',
      description:
        'Change the stamps needed, the reward, the prizes and the cooldown whenever you like. Approve visits yourself if you prefer. Void a stamp with a reason.',
    },
    {
      title: 'A clear record',
      description:
        'Every stamp, prize and redemption is logged, so you can see exactly what happened if someone disputes a stamp.',
    },
  ],
};

export const scratchDemo = {
  label: 'try it',
  headline: 'Surprise rewards make a stamp card feel like a game.',
  caption: 'Demo only — scratch to reveal',
};

export const customerBenefits = {
  label: 'for your customers',
  items: [
    'Nothing to download',
    'One scan per visit',
    'See your progress',
    'Scratch for a surprise',
    'A nudge when your reward is ready',
    'Your history, always',
  ],
  image: 'customers-scan',
};

export const security = {
  label: 'fair and secure',
  features: [
    'Rotating QR — changes every few seconds',
    'Cooldown between stamps',
    'Optional approval of each visit',
    'Void with a logged reason',
    'Each shop sees only its own customers',
  ],
  qrCaption: 'Demo, sped up. The real QR changes every 30 seconds.',
};

export const dashboard = {
  label: 'your dashboard',
  headline: 'Your shop ledger, live.',
  sampleRows: [
    { time: '2:41 pm', event: 'stamp collected', customer: 'Priya M.', status: '✓' },
    { time: '2:38 pm', event: 'scratch card', customer: 'Rahul K.', status: 'won ₹50 off' },
    { time: '2:35 pm', event: 'stamp collected', customer: 'Sneha D.', status: '✓' },
    { time: '2:30 pm', event: 'reward claimed', customer: 'Anita S.', status: 'confirmed' },
    { time: '2:22 pm', event: 'stamp collected', customer: 'Vikram P.', status: '✓' },
    { time: '2:18 pm', event: 'new customer', customer: 'Farhan J.', status: 'signed up' },
  ],
  disclaimer: 'Sample data',
};

export const audience = {
  label: 'who it is for',
  shopTypes: [
    'Chai stalls',
    'Cafés',
    'Bakeries',
    'Salons',
    'Gyms',
    'Restaurants',
    'Small retail',
  ],
  images: ['shops-chai', 'shops-cafe', 'shops-salon'],
};

export const pilot = {
  headline: 'Start with a free pilot',
  steps: [
    'Talk to us',
    'We set up your QR and program',
    'Go live and watch the ledger fill',
  ],
  fallbackText:
    'Tell us about your shop and we will share pricing.',
  /** [[FILL: pilot length and pricing]] */
};

export const onTheWay = {
  label: 'on the way',
  items: [
    'Wallet cards',
    'Referrals',
    'Spend-based rewards',
    'More than one branch',
  ],
};

export const faq = {
  label: 'questions',
  items: [
    {
      q: 'Do my customers need an app?',
      a: 'No. They scan with the phone camera, sign in with their mobile number and the card opens in the browser. They can add it to the home screen.',
    },
    {
      q: 'What do customers share?',
      a: 'Their name and mobile number. We text a one-time code to confirm the number.',
    },
    {
      q: 'Can customers cheat by scanning from home?',
      a: 'The QR changes every few seconds, each customer can collect once per cooldown you set, and you can approve visits yourself.',
    },
    {
      q: 'Do I need any equipment?',
      a: 'A phone or tablet that shows the QR.',
    },
    {
      q: 'How do scratch cards work?',
      a: 'You set the prizes, the odds and the stock. The result is decided on our server. Winners show a one-time code and you confirm it.',
    },
    {
      q: 'How does a customer claim a reward?',
      a: 'They tap Claim, get a one-time code valid for 10 minutes and show it at the counter.',
    },
    {
      q: 'Will customers get reminders?',
      a: 'Yes, as browser notifications. On iPhone they work after the site is added to the home screen.',
    },
    {
      q: 'What does it cost?',
      a: '[[FILL: pricing details]]',
    },
    {
      q: 'Who sees my customers\' data?',
      a: 'Only you, for your shop. [[FILL: owner to confirm "we do not sell data"]]',
    },
    {
      q: 'What if my internet drops?',
      a: 'The QR stops changing and customers cannot collect until you are back online.',
    },
    {
      q: 'Can I run more than one shop?',
      a: 'Not yet. Each shop has its own program for now.',
    },
  ],
};

export const finalCta = {
  headline: 'Give your regulars a reason to come back.',
  whatsappLabel: 'WhatsApp us',
  pilotLabel: 'Start a free pilot',
};

