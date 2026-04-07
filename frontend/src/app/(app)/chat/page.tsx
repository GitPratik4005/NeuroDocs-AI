"use client";

import { useState } from "react";
import { queryDocuments } from "@/services/api";
import type { QueryResponse } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Message {
  question: string;
  answer: string;
  sourceChunks: string[];
}

export default function ChatPage() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || loading) return;

    const q = question.trim();
    setQuestion("");
    setLoading(true);

    try {
      const res: QueryResponse = await queryDocuments(q);
      setMessages((prev) => [
        ...prev,
        { question: q, answer: res.answer, sourceChunks: res.source_chunks },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { question: q, answer: "Failed to get a response. Please try again.", sourceChunks: [] },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <h1 className="mb-4 text-2xl font-bold">Chat with Documents</h1>

      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.length === 0 && !loading && (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">
              Ask a question about your uploaded documents.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-lg bg-primary px-4 py-2 text-primary-foreground">
                {msg.question}
              </div>
            </div>
            <Card>
              <CardContent className="pt-4">
                <p className="whitespace-pre-wrap">{msg.answer}</p>
                {msg.sourceChunks.length > 0 && (
                  <>
                    <Separator className="my-3" />
                    <p className="text-xs text-muted-foreground">
                      Sources: {msg.sourceChunks.length} chunk(s) referenced
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        ))}

        {loading && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Thinking...
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t pt-4">
        <Input
          placeholder="Ask a question..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={loading}
        />
        <Button type="submit" disabled={!question.trim() || loading}>
          Send
        </Button>
      </form>
    </div>
  );
}
