import { nanoid } from 'nanoid';

/**
 * Generate a random invite code
 * @returns A 6-character alphanumeric invite code
 */
export function generateInviteCode(): string {
  return nanoid(6).toUpperCase();
}

/**
 * Validate an invite code
 * @param code The invite code to validate
 * @returns True if the code is valid, false otherwise
 */
export function validateInviteCode(code: string): boolean {
  // Check if code is a string and has the correct length
  if (typeof code !== 'string' || code.length !== 6) {
    return false;
  }
  
  // Check if code contains only alphanumeric characters
  return /^[A-Z0-9]{6}$/.test(code);
} 