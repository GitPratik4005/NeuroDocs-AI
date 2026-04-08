import type {
  UserResponse,
  TokenResponse,
  DocumentResponse,
  DocumentListResponse,
  QueryResponse,
  QueryHistoryResponse,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      ...getAuthHeaders(),
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// Auth
export async function register(
  email: string,
  password: string,
  name: string
): Promise<UserResponse> {
  return request<UserResponse>("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
}

export async function login(
  email: string,
  password: string
): Promise<TokenResponse> {
  return request<TokenResponse>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe(): Promise<UserResponse> {
  return request<UserResponse>("/auth/me");
}

// Documents
export async function uploadDocument(
  file: File,
  title?: string
): Promise<DocumentResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (title) formData.append("title", title);

  return request<DocumentResponse>("/upload", {
    method: "POST",
    body: formData,
  });
}

export async function listDocuments(
  page = 1,
  limit = 10,
  statusFilter?: string
): Promise<DocumentListResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (statusFilter) params.set("status_filter", statusFilter);
  return request<DocumentListResponse>(`/upload/documents?${params}`);
}

export async function getDocument(id: string): Promise<DocumentResponse> {
  return request<DocumentResponse>(`/upload/documents/${id}`);
}

export async function deleteDocument(id: string): Promise<void> {
  return request<void>(`/upload/documents/${id}`, { method: "DELETE" });
}

// Query
export async function queryDocuments(
  question: string,
  documentIds?: string[]
): Promise<QueryResponse> {
  return request<QueryResponse>("/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, document_ids: documentIds }),
  });
}

export async function queryDocumentsStream(
  question: string,
  documentIds: string[],
  onToken: (token: string) => void,
  onDone: (id: string) => void,
): Promise<void> {
  const res = await fetch(`${API_BASE}/query/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ question, document_ids: documentIds }),
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response stream");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (!json) continue;
      try {
        const event = JSON.parse(json);
        if (event.type === "token") {
          onToken(event.content);
        } else if (event.type === "done") {
          onDone(event.id);
        }
      } catch {
        // skip malformed lines
      }
    }
  }
}

export async function getQueryHistory(
  page = 1,
  limit = 10
): Promise<QueryHistoryResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  return request<QueryHistoryResponse>(`/query/history?${params}`);
}
