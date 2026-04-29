/**
 * Parse a fetch Response as JSON; avoids `JSON.parse` on empty bodies (common on 500 from proxies / crashes).
 */
export async function readJsonResponse<T = unknown>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text.trim()) {
    throw new Error(
      res.ok
        ? "Empty response from server."
        : `Server error (${res.status}) with no response body. Check server logs and database permissions.`,
    );
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Server returned non-JSON (${res.status}).`);
  }
}
