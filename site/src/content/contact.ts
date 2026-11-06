/**
 * contact.ts — All copy for the Contact page.
 */

export const intro = {
  headline: 'Let\u2019s talk',
  sub: 'Whether you want to run a pilot, have a question, or need to make a data request — we are here.',
};

export const details = {
  hours: '[[FILL: office hours, e.g. "Monday to Saturday, 10 am – 7 pm IST"]]',
};

export const formConfig = {
  topics: [
    { value: 'pilot', label: 'Start a pilot' },
    { value: 'question', label: 'General question' },
    { value: 'data_request', label: 'Data request' },
    { value: 'grievance', label: 'Grievance' },
  ] as const,
  channels: [
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'call', label: 'Phone call' },
    { value: 'email', label: 'Email' },
  ] as const,
  consentText: 'I agree that you may use these details to reply to me.',
  successMessage: 'Thank you. We will get back to you within one working day.',
};

