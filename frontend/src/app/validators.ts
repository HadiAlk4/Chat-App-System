// Must match backend/lib/passwordPolicy.js so the client rejects the same passwords as the server
const PASSWORD_PATTERN = /^(?=.*[A-Z])[a-zA-Z0-9]{8,}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PASSWORD_RULE_MESSAGE =
  'Password must be at least 8 characters, letters and numbers only, with at least one uppercase letter.';

export function isValidPassword(password: string): boolean {
  return PASSWORD_PATTERN.test(password);
}

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

export type FormMessage = { type: 'success' | 'danger'; text: string } | null;
