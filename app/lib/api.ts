type ApiErrorPayload = {
  message?: string;
};

export class ApiError extends Error {
  status: number;
  payload?: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

function getApiBaseUrl() {
  // Only NEXT_PUBLIC_ vars are exposed to the browser in Next.js.
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
}

export async function apiPostJson<TResponse>(
  path: string,
  body: unknown,
  init?: Omit<RequestInit, "method" | "body" | "headers">
): Promise<TResponse> {
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      credentials: "include",
      ...init,
    });
  } catch {
    throw new ApiError("Cannot connect to the server. Please make sure the API is running and try again.", 0);
  }

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  const payload = isJson
    ? await res.json().catch(() => undefined)
    : await res.text().catch(() => undefined);

  if (!res.ok) {
    const messageFromPayload = (payload as ApiErrorPayload | undefined)?.message;
    const message: string = typeof messageFromPayload === "string" ? messageFromPayload : "Request failed.";

    throw new ApiError(message, res.status, payload);
  }

  return payload as TResponse;
}

export async function apiGetJson<TResponse>(
  path: string,
  init?: Omit<RequestInit, "method" | "headers">,
): Promise<TResponse> {
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      credentials: "include",
      ...init,
    });
  } catch {
    throw new ApiError("Cannot connect to the server. Please make sure the API is running and try again.", 0);
  }

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  const payload = isJson
    ? await res.json().catch(() => undefined)
    : await res.text().catch(() => undefined);

  if (!res.ok) {
    const messageFromPayload = (payload as ApiErrorPayload | undefined)?.message;
    const message: string = typeof messageFromPayload === "string" ? messageFromPayload : "Request failed.";

    throw new ApiError(message, res.status, payload);
  }

  return payload as TResponse;
}

