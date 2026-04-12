"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  queryDocumentsStream,
  getDocument,
  listConversations,
  createConversation,
  getConversationMessages,
  addConversationMessage,
  deleteConversation,
} from "@/services/api";
import type { DocumentResponse, ConversationResponse } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Send,
  FileText,
  Calendar,
  Layers,
  Sparkles,
  ListChecks,
  ChevronDown,
  Plus,
  MessageSquare,
  Trash2,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const TONE_OPTIONS = [
  { label: "Professional", prompt: "Rewrite the key content in a professional tone" },
  { label: "Casual", prompt: "Rewrite the key content in a casual, conversational tone" },
  { label: "Academic", prompt: "Rewrite the key content in an academic tone" },
  { label: "Simple", prompt: "Rewrite the key content in simple, easy-to-understand language" },
];

export default function ChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const docId = searchParams.get("doc");

  const [doc, setDoc] = useState<DocumentResponse | null>(null);
  const [docLoading, setDocLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [toneOpen, setToneOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toneRef = useRef<HTMLDivElement>(null);

  // Conversation state
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [convsLoading, setConvsLoading] = useState(true);

  // Load document info
  useEffect(() => {
    if (!docId) {
      router.push("/dashboard");
      return;
    }
    setDocLoading(true);
    getDocument(docId)
      .then(setDoc)
      .catch(() => {
        router.push("/dashboard");
      })
      .finally(() => setDocLoading(false));
  }, [docId, router]);

  // Load conversations for this document
  useEffect(() => {
    if (!docId) return;
    setConvsLoading(true);
    listConversations(docId)
      .then((data) => {
        setConversations(data.conversations);
        // Auto-select the most recent conversation
        if (data.conversations.length > 0 && !activeConvId) {
          loadConversation(data.conversations[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setConvsLoading(false));
  }, [docId]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Close tone dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (toneRef.current && !toneRef.current.contains(e.target as Node)) {
        setToneOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function loadConversation(convId: string) {
    setActiveConvId(convId);
    try {
      const data = await getConversationMessages(convId);
      setMessages(
        data.messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))
      );
    } catch {
      setMessages([]);
    }
  }

  async function startNewConversation() {
    if (!docId) return;
    try {
      const conv = await createConversation(docId);
      setConversations((prev) => [conv, ...prev]);
      setActiveConvId(conv.id);
      setMessages([]);
    } catch {}
  }

  async function handleDeleteConversation(convId: string) {
    if (!confirm("Delete this conversation?")) return;
    try {
      await deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConvId === convId) {
        setActiveConvId(null);
        setMessages([]);
      }
    } catch {}
  }

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading || !docId) return;

    // Ensure we have a conversation
    let convId = activeConvId;
    if (!convId) {
      try {
        const conv = await createConversation(docId);
        setConversations((prev) => [conv, ...prev]);
        convId = conv.id;
        setActiveConvId(conv.id);
      } catch {
        return;
      }
    }

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setQuestion("");
    setLoading(true);

    // Save user message to backend
    addConversationMessage(convId, "user", text).catch(() => {});

    // Add empty assistant message for streaming
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    let fullAnswer = "";
    try {
      await queryDocumentsStream(
        text,
        [docId],
        (token) => {
          fullAnswer += token;
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.role === "assistant") {
              updated[updated.length - 1] = { ...last, content: last.content + token };
            }
            return updated;
          });
        },
        () => {},
      );
      // Save assistant response to backend
      if (convId && fullAnswer) {
        addConversationMessage(convId, "assistant", fullAnswer).catch(() => {});
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === "assistant" && last.content === "") {
          updated[updated.length - 1] = { ...last, content: "Failed to get a response. Please try again." };
        }
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }, [loading, docId, activeConvId]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(question);
  }

  if (!docId) return null;

  return (
    <div className="flex h-[calc(100vh-5rem)] gap-0 overflow-hidden rounded-xl border">
      {/* Left Panel — Document Preview + Conversations */}
      <aside className="hidden md:flex w-[280px] shrink-0 flex-col border-r bg-muted/30">
        <div className="flex items-center gap-2 border-b p-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 cursor-pointer"
            onClick={() => router.push("/dashboard")}
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-muted-foreground">Document</span>
        </div>

        {docLoading ? (
          <div className="p-4 space-y-4">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
        ) : doc ? (
          <div className="p-4 space-y-5 text-sm">
            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <FileText className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <p className="font-medium leading-tight break-all">{doc.title}</p>
              </div>
            </div>
            <div className="space-y-3 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="uppercase text-xs">
                  {doc.file_type}
                </Badge>
                <Badge variant={doc.status === "ready" ? "default" : "secondary"}>
                  {doc.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                <span>{doc.chunk_count} chunks</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Conversation List */}
        <div className="border-t flex-1 overflow-y-auto">
          <div className="flex items-center justify-between p-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Chats</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 cursor-pointer"
              onClick={startNewConversation}
              aria-label="New conversation"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {convsLoading ? (
            <div className="px-3 space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="px-3 text-xs text-muted-foreground">No conversations yet. Start chatting!</p>
          ) : (
            <div className="px-2 space-y-1">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors ${
                    activeConvId === conv.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-accent"
                  }`}
                  onClick={() => loadConversation(conv.id)}
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate flex-1">{conv.title}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{conv.message_count}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 cursor-pointer shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(conv.id);
                    }}
                    aria-label="Delete conversation"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Right Panel — Chat */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile back button */}
        <div className="flex items-center gap-2 border-b p-3 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 cursor-pointer"
            onClick={() => router.push("/dashboard")}
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium truncate">{doc?.title ?? "Chat"}</span>
        </div>

        {/* Predefined Actions */}
        <div className="flex items-center gap-2 border-b p-3 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer gap-1.5 transition-all hover:shadow-md hover:shadow-primary/10"
            onClick={() => sendMessage("Summarize this document in 3 bullet points")}
            disabled={loading}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Summarize
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer gap-1.5 transition-all hover:shadow-md hover:shadow-primary/10"
            onClick={() => sendMessage("List the key points from this document in 3 bullets")}
            disabled={loading}
          >
            <ListChecks className="h-3.5 w-3.5" />
            Key Points
          </Button>

          {/* Change Tone dropdown */}
          <div className="relative" ref={toneRef}>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer gap-1.5 transition-all hover:shadow-md hover:shadow-primary/10"
              onClick={() => setToneOpen(!toneOpen)}
              disabled={loading}
            >
              Change Tone
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${toneOpen ? "rotate-180" : ""}`} />
            </Button>
            {toneOpen && (
              <div className="absolute top-full left-0 z-10 mt-1 min-w-[180px] rounded-lg border bg-popover p-1 shadow-lg animate-in fade-in-0 zoom-in-95">
                {TONE_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent transition-colors cursor-pointer"
                    onClick={() => {
                      setToneOpen(false);
                      sendMessage(opt.prompt);
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" role="log" aria-live="polite">
          {messages.length === 0 && !loading && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">
                  Ask a question about your document, or try a quick action above.
                </p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in-0 slide-in-from-bottom-2`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start animate-in fade-in-0">
              <div className="bg-muted rounded-xl px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2 border-t p-3">
          <Input
            placeholder="Ask a question..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!question.trim() || loading}
            className="cursor-pointer shrink-0 transition-all hover:shadow-lg hover:shadow-primary/25"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
