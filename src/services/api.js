/**
 * API Service for Smart Periodic Table
 * Communicates with the Node.js / SQLite backend endpoints
 */

const API_BASE_URL = '';

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
  const response = await fetch(`${API_BASE_URL}/api/health`, {
    headers: {
      'Accept': 'application/json',
    },
  });
  return handleResponse(response);
}
