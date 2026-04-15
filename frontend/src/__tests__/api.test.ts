/**
 * Tests for the API service layer.
 */

import { register, login, getMe, uploadDocument, listDocuments, deleteDocument, queryDocuments } from "@/services/api";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const storage: Record<string, string> = {};
Object.defineProperty(window, "localStorage", {
  value: {
    getItem: (key: string) => storage[key] ?? null,
    setItem: (key: string, val: string) => { storage[key] = val; },
    removeItem: (key: string) => { delete storage[key]; },
  },
});

beforeEach(() => {
  mockFetch.mockReset();
  Object.keys(storage).forEach((k) => delete storage[k]);
});

function jsonResponse(data: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  });
}

describe("API service", () => {
  test("register sends correct payload", async () => {
    mockFetch.mockReturnValue(jsonResponse({ id: "1", email: "a@b.com", name: "Test", created_at: "2024-01-01" }, 201));

    const result = await register("a@b.com", "pass1234", "Test");
    expect(result.email).toBe("a@b.com");

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("/auth/register");
    expect(JSON.parse(opts.body)).toEqual({ email: "a@b.com", password: "pass1234", name: "Test" });
  });

  test("login sends correct payload", async () => {
    mockFetch.mockReturnValue(jsonResponse({ access_token: "tok123", token_type: "bearer" }));

    const result = await login("a@b.com", "pass1234");
    expect(result.access_token).toBe("tok123");

    const [, opts] = mockFetch.mock.calls[0];
    expect(JSON.parse(opts.body)).toEqual({ email: "a@b.com", password: "pass1234" });
  });

  test("getMe includes auth header", async () => {
    storage["token"] = "mytoken";
    mockFetch.mockReturnValue(jsonResponse({ id: "1", email: "a@b.com", name: "Test", created_at: "2024-01-01" }));

    await getMe();

    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.headers.Authorization).toBe("Bearer mytoken");
  });

  test("listDocuments sends pagination params", async () => {
    mockFetch.mockReturnValue(jsonResponse({ documents: [], total: 0, page: 2, limit: 5 }));

    await listDocuments(2, 5);

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("page=2");
    expect(url).toContain("limit=5");
  });

  test("deleteDocument returns void on 204", async () => {
    mockFetch.mockReturnValue(Promise.resolve({ ok: true, status: 204, json: () => Promise.resolve(undefined) }));

    const result = await deleteDocument("doc1");
    expect(result).toBeUndefined();
  });

  test("queryDocuments sends question and document_ids", async () => {
    mockFetch.mockReturnValue(jsonResponse({
      id: "q1",
      question: "What?",
      answer: "Answer",
      source_chunks: [],
      document_ids: ["d1"],
      created_at: "2024-01-01",
    }));

    const result = await queryDocuments("What?", ["d1"]);
    expect(result.answer).toBe("Answer");

    const [, opts] = mockFetch.mock.calls[0];
    const body = JSON.parse(opts.body);
    expect(body.question).toBe("What?");
    expect(body.document_ids).toEqual(["d1"]);
  });

  test("throws on non-ok response with detail", async () => {
    mockFetch.mockReturnValue(Promise.resolve({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ detail: "Bad request" }),
    }));

    await expect(register("a@b.com", "short", "Test")).rejects.toThrow("Bad request");
  });

  test("401 clears token", async () => {
    storage["token"] = "expired";

    mockFetch.mockReturnValue(Promise.resolve({
      ok: false,
      status: 401,
      json: () => Promise.resolve({}),
    }));

    await expect(getMe()).rejects.toThrow("Unauthorized");
    expect(storage["token"]).toBeUndefined();
  });
});
