/**
 * API Service for Smart Periodic Table
 * Communicates with the Node.js / SQLite backend endpoints
 */

const API_BASE_URL = '';

/**
 * GitHub Pages provides static hosting, not the Express / SQLite API.
 * For its public demo, ship the canonical, audited 118-element snapshot
 * in an on-demand bundle; keep the regular full-stack API unchanged.
 */
const IS_STATIC_DEMO = import.meta.env.VITE_STATIC_DEMO === 'true';
let bundledElementsPromise;

function getBundledElements() {
  if (!bundledElementsPromise) {
    bundledElementsPromise = import('../../data/elements.json').then(({ default: elements }) => {
      if (!Array.isArray(elements) || elements.length !== 118) {
        throw new Error('Invalid periodic-table snapshot: expected 118 elements.');
      }
      return elements.map((el) => {
        const isPredicted = Boolean(
          el.isPredicted ||
          el.predicted ||
          (el.number >= 100 && (el.meltingPoint == null || el.density == null)) ||
          (typeof el.electronConfig === 'string' && el.electronConfig.toLowerCase().includes('predicted')) ||
          (typeof el.standardState === 'string' && el.standardState.toLowerCase().includes('expected'))
        );
        return { ...el, isPredicted, predicted: isPredicted };
      });
    });
  }
  return bundledElementsPromise;
}


/**
 * Handles HTTP response validation and JSON parsing
 * @param {Response} response
 * @returns {Promise<any>}
 */
async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData?.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // Ignore JSON parse errors for non-JSON error bodies
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

/**
 * Fetches all 118 periodic table elements from SQLite database
 * @returns {Promise<Array<object>>}
 */
export async function fetchElements() {
  if (IS_STATIC_DEMO) return getBundledElements();
  const response = await fetch(`${API_BASE_URL}/api/elements`, {
    headers: {
      'Accept': 'application/json',
    },
  });
  return handleResponse(response);
}

/**
 * Fetches a single element by its atomic number
 * @param {number|string} number
 * @returns {Promise<object>}
 */
export async function fetchElementByNumber(number) {
  if (IS_STATIC_DEMO) {
    const elements = await getBundledElements();
    const lookup = String(number).trim().toLowerCase();
    const element = elements.find((el) =>
      String(el.number) === lookup ||
      el.symbol.toLowerCase() === lookup ||
      el.nameEn.toLowerCase() === lookup ||
      el.nameFa === lookup
    );
    if (!element) throw new Error('Element not found');
    return element;
  }
  const response = await fetch(`${API_BASE_URL}/api/elements/${encodeURIComponent(number)}`, {
    headers: {
      'Accept': 'application/json',
    },
  });
  return handleResponse(response);
}

/**
 * Searches elements by name (Fa/En), symbol, or atomic number
 * @param {string} query
 * @returns {Promise<Array<object>>}
 */
export async function searchElements(query) {
  const trimmed = (query || '').trim();
  if (!trimmed) {
    return [];
  }
  if (IS_STATIC_DEMO) {
    const elements = await getBundledElements();
    const q = trimmed.toLowerCase();
    return elements.filter((el) =>
      el.nameFa.includes(trimmed) ||
      el.nameEn.toLowerCase().includes(q) ||
      el.symbol.toLowerCase().includes(q) ||
      String(el.number) === q
    );
  }
  const response = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(trimmed)}`, {
    headers: {
      'Accept': 'application/json',
    },
  });
  return handleResponse(response);
}

/**
 * Checks backend health and element count
 * @returns {Promise<{ ok: boolean, database: string, elements: number }>}
 */
export async function checkHealth() {
  if (IS_STATIC_DEMO) {
    const elements = await getBundledElements();
    return {
      ok: true,
      status: 'static-preview',
      database: 'bundled-json',
      elements: elements.length,
      timestamp: new Date().toISOString(),
    };
  }
  const response = await fetch(`${API_BASE_URL}/api/health`, {
    headers: {
      'Accept': 'application/json',
    },
  });
  return handleResponse(response);
}
