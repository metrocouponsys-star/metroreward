import nodemailer from 'nodemailer';

interface ContactData {
  id: string;
  name: string;
  phone: string;
  email?: string;
  shopName?: string;
  city?: string;
  topic: string;
  preferredChannel: string;
  message?: string;
}

/**
 * Send a notification email when someone submits the contact form.
 * Uses SMTP env vars: SMTP_HOST, SMTP_USER, SMTP_PASS, CONTACT_TO
 */
export async function sendContactNotification(data: ContactData): Promise<void> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const to = process.env.CONTACT_TO;

  if (!host || !user || !pass || !to) {
    console.warn('SMTP not configured — skipping contact notification email');
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port: 587,
    secure: false,
    auth: { user, pass },
  });

  const subject = `[Stamp] New ${data.topic} from ${data.name}`;
  const text = [
    `Name: ${data.name}`,
    `Phone: ${data.phone}`,
    data.email ? `Email: ${data.email}` : '',
    data.shopName ? `Shop: ${data.shopName}` : '',
    data.city ? `City: ${data.city}` : '',
    `Topic: ${data.topic}`,
    `Preferred channel: ${data.preferredChannel}`,
    '',
    'Message:',
    data.message || '(no message)',
    '',
    `ID: ${data.id}`,
  ]
    .filter(Boolean)
    .join('\n');

  await transporter.sendMail({
    from: user,
    to,
    subject,
    text,
  });
}

