const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/$/, "");

const defaultHeaders = {
  Accept: "application/json",
};

function buildUrl(path = "", query) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${API_BASE}${normalizedPath}`);

  if (query && typeof query === "object") {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      url.searchParams.set(key, value);
    });
  }

  return url.toString();
}

export async function apiClient(path, options = {}) {
  const {
    method = "GET",
    data,
    query,
    token,
    headers = {},
    isFormData = false,
    signal,
  } = options;

  const url = buildUrl(path, query);
  const finalHeaders = { ...defaultHeaders, ...headers };

  let body;
  if (data !== undefined) {
    if (isFormData) {
      if (data instanceof FormData) {
        body = data;
      } else {
        body = new FormData();
        Object.entries(data || {}).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            body.append(key, value);
          }
        });
      }
      delete finalHeaders["Content-Type"];
    } else {
      body = JSON.stringify(data);
      finalHeaders["Content-Type"] = "application/json";
    }
  }

  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers: finalHeaders,
    body,
    signal,
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = (isJson && payload?.message) || response.statusText || "Request failed";
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export function withAuth(token) {
  return (path, options = {}) => apiClient(path, { ...options, token });
}
