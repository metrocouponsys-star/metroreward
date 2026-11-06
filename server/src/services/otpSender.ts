import { env } from '../lib/env.ts';

export interface OtpSender {
  send(phone: string, code: string): Promise<void>;
}

/** Console sender — only used outside production */
class ConsoleSender implements OtpSender {
  async send(phone: string, code: string): Promise<void> {
    console.log(`[OTP] ${phone} → ${code}`);
  }
}

/** HTTP sender using the configured provider */
class HttpSender implements OtpSender {
  async send(phone: string, code: string): Promise<void> {
    const url = new URL(env.OTP_PROVIDER_URL ?? '');
    const body = {
      authkey: env.OTP_PROVIDER_KEY,
      mobile: phone.replace('+', ''),
      message: `Your Stamp verification code is ${code}. Valid for 5 minutes.`,
      sender: env.OTP_SENDER_ID,
      otp: code,
    };
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`OTP provider responded with ${res.status}`);
    }
  }
}

export const otpSender: OtpSender =
  env.NODE_ENV === 'production' ? new HttpSender() : new ConsoleSender();

