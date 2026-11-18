/**
 * Form submission for the public site.
 *
 * Every submission goes to two places in parallel:
 *   1. The CRM API (PUBLIC_API_URL) — creates the lead, assigns a rep, and
 *      sends the instant welcome text naming that rep.
 *   2. Netlify Forms — a backup copy, so a lead is not lost if the API is down.
 *
 * The submission succeeds if either destination accepts it. Throws only when
 * both fail, so callers can `try/catch` and show an error.
 */
type FormData = Record<string, string | number | undefined | null>;

const API_URL = ((import.meta.env.PUBLIC_API_URL as string | undefined) || '').replace(/\/+$/, '');

const CRM_ROUTES: Record<string, string> = {
  contact: '/api/public/contact',
  schedule: '/api/public/schedule',
  enroll: '/api/public/enroll',
  'calculator-lead': '/api/public/calculator-lead',
  newsletter: '/api/public/subscribe',
};

const LEAD_FIELDS = ['firstName', 'lastName', 'email', 'phone'];

/** Shape a form's fields into the body its CRM endpoint expects. */
export function toCrmPayload(formName: string, data: FormData): Record<string, unknown> {
  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  );

  if (formName === 'calculator-lead') {
    const lead: Record<string, unknown> = {};
    const calculatorResults: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(clean)) {
      if (LEAD_FIELDS.includes(k) || k === 'annualSalary' || k === 'yearsOfService') lead[k] = v;
      if (!LEAD_FIELDS.includes(k)) calculatorResults[k] = v;
    }
    return { ...lead, calculatorResults };
  }

  if (formName === 'enroll') {
    const { wantsRetirementPlanning, notes, ...rest } = clean;
    const lines = [
      notes,
      wantsRetirementPlanning ? `Wants retirement planning: ${wantsRetirementPlanning}` : null,
    ].filter(Boolean);
    return { ...rest, ...(lines.length ? { notes: lines.join('\n') } : {}) };
  }

  if (formName === 'contact') {
    const { subject, message, ...rest } = clean;
    const text = [subject ? `Subject: ${subject}` : null, message].filter(Boolean).join('\n');
    return { ...rest, ...(text ? { message: text } : {}) };
  }

  return clean;
}

async function submitToCrm(formName: string, data: FormData): Promise<void> {
  const route = CRM_ROUTES[formName];
  if (!API_URL || !route) throw new Error('CRM endpoint not configured');
  const res = await fetch(`${API_URL}${route}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toCrmPayload(formName, data)),
  });
  if (!res.ok) throw new Error(`CRM submission failed: ${res.status}`);
}

async function submitToNetlify(formName: string, data: FormData): Promise<void> {
  // Netlify expects a urlencoded POST to "/" with a `form-name` field matching
  // a form registered at build time in src/pages/netlify-forms-detection.astro.
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

export async function submitNetlifyForm(formName: string, data: FormData): Promise<void> {
  const [crm, netlify] = await Promise.allSettled([
    submitToCrm(formName, data),
    submitToNetlify(formName, data),
  ]);
  if (crm.status === 'rejected') console.warn('[forms] CRM:', crm.reason);
  if (netlify.status === 'rejected') console.warn('[forms] Netlify:', netlify.reason);
  if (crm.status === 'rejected' && netlify.status === 'rejected') {
    throw new Error('Form submission failed');
  }
}
