export interface UserResponse {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface DocumentResponse {
  id: string;
  title: string;
  file_type: string;
  status: "processing" | "ready" | "failed";
  chunk_count: number;
  uploaded_at: string;
}

export interface DocumentListResponse {
  documents: DocumentResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface QueryResponse {
  id: string;
  question: string;
  answer: string;
  source_chunks: string[];
  document_ids: string[];
  created_at: string;
}

export interface QueryHistoryResponse {
  queries: QueryResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface ConversationResponse {
  id: string;
  document_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ConversationListResponse {
  conversations: ConversationResponse[];
  total: number;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface MessageListResponse {
  messages: ConversationMessage[];
  total: number;
}
