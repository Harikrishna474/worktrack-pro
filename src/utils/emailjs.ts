import emailjs from '@emailjs/browser';

const env = (import.meta as any).env || {};

const SERVICE_ID = env.VITE_EMAILJS_SERVICE_ID || '';
const TEMPLATE_ID = env.VITE_EMAILJS_TEMPLATE_ID || '';
const PUBLIC_KEY = env.VITE_EMAILJS_PUBLIC_KEY || '';

export const isEmailJSConfigured = !!(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function hashOTP(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function sendOTPEmail(toEmail: string, otp: string): Promise<void> {
  if (!isEmailJSConfigured) {
    throw new Error('EmailJS is not configured. Please set VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, and VITE_EMAILJS_PUBLIC_KEY in your environment.');
  }

  await emailjs.send(
    SERVICE_ID,
    TEMPLATE_ID,
    {
      to_email: toEmail,
      otp_code: otp,
      app_name: 'WorkTrack Pro',
    },
    PUBLIC_KEY
  );
}
