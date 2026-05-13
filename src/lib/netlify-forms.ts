/**
 * Submit a form to Netlify Forms.
 *
 * Netlify expects:
 *   - POST to the same path the form is rendered on (we use "/")
 *   - Content-Type: application/x-www-form-urlencoded
 *   - A `form-name` field matching one of the forms registered at build time
 *     in src/pages/__forms.astro
 *
 * Throws on any non-2xx response so callers can `try/catch` and show an error.
 */
export async function submitNetlifyForm(
  formName: string,
  data: Record<string, string | number | undefined | null>,
): Promise<void> {
  const params = new URLSearchParams();
  params.append('form-name', formName);

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    params.append(key, String(value));
  }

  const res = await fetch('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) {
    throw new Error(`Netlify form submission failed: ${res.status} ${res.statusText}`);
  }
}
