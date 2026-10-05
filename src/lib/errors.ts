/** An error whose message is safe and helpful to show directly to the user. */
export class UserFacingError extends Error {
  override name = 'UserFacingError';
}

/** Turn anything thrown into a short message suitable for the UI. */
export function toUserMessage(err: unknown): string {
  if (err instanceof UserFacingError) return err.message;
  const message = err instanceof Error ? err.message : String(err);
  if (/encrypt/i.test(message)) {
    return 'This PDF is password-protected. Please remove the password and try again.';
  }
  if (/invalid pdf|failed to parse|no pdf header|PDF header/i.test(message)) {
    return 'This file does not look like a valid PDF.';
  }
  if (/out of memory|allocation failed|Array buffer allocation/i.test(message)) {
    return 'Your browser ran out of memory. Try a smaller file or fewer files at once.';
  }
  return message || 'Something went wrong while processing your file.';
}
