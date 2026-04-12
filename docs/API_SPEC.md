# NeuroDocAI — API Specification

Base URL: `http://localhost:8000/api`

---

## Authentication

### POST /auth/register

Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "created_at": "2026-03-24T00:00:00Z"
}
```

**Errors:** `400` email already exists, `422` validation error

---

### POST /auth/login

Authenticate and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "access_token": "jwt_token_string",
  "token_type": "bearer"
}
```

**Errors:** `401` invalid credentials

---

### GET /auth/me

Get current user profile. Requires auth.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "created_at": "2026-03-24T00:00:00Z"
}
```

---

## Documents

### POST /upload

Upload a document (PDF or DOCX). Requires auth.

**Headers:** `Authorization: Bearer <token>`

**Request:** `multipart/form-data`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | file | yes | PDF or DOCX file |
| title | string | no | Custom document title (defaults to filename) |

**Response (201):**
```json
{
  "id": "uuid",
  "title": "document.pdf",
  "file_type": "pdf",
  "status": "processing",
  "chunk_count": 0,
  "uploaded_at": "2026-03-24T00:00:00Z"
}
```

**Errors:** `400` unsupported file type, `413` file too large

---

### GET /upload/documents

List user's uploaded documents. Requires auth.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | int | 1 | Page number |
| limit | int | 10 | Items per page |
| status_filter | string | all | Filter: processing, ready, failed |

**Response (200):**
```json
{
  "documents": [
    {
      "id": "uuid",
      "title": "document.pdf",
      "file_type": "pdf",
      "status": "ready",
      "chunk_count": 42,
      "uploaded_at": "2026-03-24T00:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

---

### GET /upload/documents/{document_id}

Get document details. Requires auth.

**Response (200):**
```json
{
  "id": "uuid",
  "title": "document.pdf",
  "file_type": "pdf",
  "status": "ready",
  "chunk_count": 42,
  "uploaded_at": "2026-03-24T00:00:00Z"
}
```

**Errors:** `404` document not found

---

### DELETE /upload/documents/{document_id}

Delete a document and its chunks/embeddings. Requires auth.

**Response (204):** No content

**Errors:** `404` document not found

---

## Query (RAG)

### POST /query

Ask a question about uploaded documents. Requires auth.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "question": "What are the key findings?",
  "document_ids": ["uuid1", "uuid2"]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| question | string | yes | Natural language question |
| document_ids | list[str] | no | Scope to specific documents (default: all user docs) |

**Response (200):**
```json
{
  "id": "uuid",
  "question": "What are the key findings?",
  "answer": "The key findings include...",
  "source_chunks": ["chunk-id-1", "chunk-id-2"],
  "document_ids": ["uuid1"],
  "created_at": "2026-03-24T00:00:00Z"
}
```

**Errors:** `400` empty question, `404` document not found

---

### POST /query/stream

Streaming version of POST /query. Returns Server-Sent Events (SSE) with tokens as they are generated. Requires auth.

**Headers:** `Authorization: Bearer <token>`

**Request Body:** Same as POST /query

**Response (200):** `text/event-stream`

Each event is a JSON object:
```
data: {"type": "token", "content": "The"}
data: {"type": "token", "content": " key"}
data: {"type": "token", "content": " findings"}
...
data: {"type": "done", "id": "query-record-uuid"}
```

| Event Type | Description |
|------------|-------------|
| token | A chunk of the generated answer text |
| done | Stream complete, includes the saved query record ID |

---

### GET /query/history

Get user's query history. Requires auth.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | int | 1 | Page number |
| limit | int | 10 | Items per page |

**Response (200):**
```json
{
  "queries": [
    {
      "id": "uuid",
      "question": "What are the key findings?",
      "answer": "The key findings include...",
      "source_chunks": ["chunk-id-1"],
      "document_ids": ["uuid1"],
      "created_at": "2026-03-24T00:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

---

## Conversations

### GET /conversations

List conversations for the current user. Requires auth.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| doc_id | string | null | Filter by document ID |

**Response (200):**
```json
{
  "conversations": [
    {
      "id": "uuid",
      "document_id": "uuid",
      "title": "Chat — document.pdf",
      "created_at": "2026-04-09T00:00:00Z",
      "updated_at": "2026-04-09T00:00:00Z",
      "message_count": 5
    }
  ],
  "total": 1
}
```

---

### POST /conversations

Create a new conversation. Requires auth.

**Request Body:**
```json
{
  "document_id": "uuid",
  "title": "Optional custom title"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "document_id": "uuid",
  "title": "Chat — document.pdf",
  "created_at": "2026-04-09T00:00:00Z",
  "updated_at": "2026-04-09T00:00:00Z",
  "message_count": 0
}
```

**Errors:** `404` document not found

---

### GET /conversations/{conversation_id}/messages

Get all messages for a conversation. Requires auth.

**Response (200):**
```json
{
  "messages": [
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "role": "user",
      "content": "What is this about?",
      "created_at": "2026-04-09T00:00:00Z"
    },
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "role": "assistant",
      "content": "This document is about...",
      "created_at": "2026-04-09T00:00:00Z"
    }
  ],
  "total": 2
}
```

**Errors:** `404` conversation not found

---

### POST /conversations/{conversation_id}/messages

Add a message to a conversation. Requires auth.

**Request Body:**
```json
{
  "role": "user",
  "content": "What are the key findings?"
}
```

**Response (201):** Single message object

**Errors:** `400` invalid role, `404` conversation not found

---

### DELETE /conversations/{conversation_id}

Delete a conversation and its messages. Requires auth.

**Response (204):** No content

**Errors:** `404` conversation not found

---

## Insights (V2+)

### GET /insights/{document_id}

Get AI-generated insights for a document. Requires auth.

**Response (200):**
```json
{
  "document_id": "uuid",
  "summary": "This document covers...",
  "key_points": [
    "Point 1",
    "Point 2"
  ],
  "generated_at": "2026-03-24T00:00:00Z"
}
```

**Errors:** `404` document not found, `425` document still processing

---

## Common

### Error Response Format

All errors follow this structure:

```json
{
  "detail": "Error message describing what went wrong"
}
```

### Authentication

All endpoints except `/auth/register` and `/auth/login` require a JWT bearer token in the `Authorization` header.

### Rate Limits

To be defined based on deployment requirements.
