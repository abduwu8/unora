/**
 * User-facing message when AI/API calls fail (network, 5xx, timeouts, etc.).
 * Use this in catch blocks so we show "We're under works" instead of "Failed to fetch".
 */
export const API_ERROR_MESSAGE =
  "We're under works. Please try again in a bit.";

export function getApiErrorMessage(err) {
  return API_ERROR_MESSAGE;
}
