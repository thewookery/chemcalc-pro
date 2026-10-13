/**
 * Generates and cleans room codes in the format:
 * "qc" followed by 3 numbers with no dashes and no spaces (e.g. "qc123", "qc482")
 */

export function generateRandomCode(): string {
  const num = Math.floor(100 + Math.random() * 900); // 100 to 999
  return `qc${num}`;
}

export function cleanRoomCode(input: string): string {
  if (!input) return '';
  // Remove all spaces, dashes, hyphens, and underscores, convert to lowercase
  let cleaned = input.toLowerCase().replace(/[\s\-_]/g, '');
  // If user only entered the 3 numbers over the phone (e.g. "482"), auto-prefix "qc"
  if (/^\d{3}$/.test(cleaned)) {
    cleaned = `qc${cleaned}`;
  }
  return cleaned;
}
