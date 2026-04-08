"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { listDocuments, deleteDocument } from "@/services/api";
import type { DocumentResponse } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { DragDropUpload } from "@/components/drag-drop-upload";
import { MessageSquare, Trash2, RefreshCw } from "lucide-react";

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  ready: "default",
  processing: "secondary",
  failed: "destructive",
};

export default function DashboardPage() {
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const limit = 10;

  const fetchDocs = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await listDocuments(p, limit);
      setDocuments(res.documents);
      setTotal(res.total);
      setPage(p);
    } catch {
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs(1);
  }, [fetchDocs]);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await deleteDocument(id);
      toast.success(`"${title}" deleted`);
      fetchDocs(page);
    } catch {
      toast.error("Failed to delete document");
    } finally {
      setDeleting(null);
    }
  }

  function handleUploadComplete() {
    fetchDocs(1);
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-12">
      {/* Hero + Upload Section */}
      <section className="text-center space-y-6 pt-8">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">
            AI Document Intelligence
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Upload your documents and chat with them instantly.
            Get summaries, key points, and answers in seconds.
          </p>
        </div>
        <div className="max-w-xl mx-auto">
          <DragDropUpload onUploadComplete={handleUploadComplete} />
        </div>
      </section>

      {/* Documents Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Documents</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fetchDocs(page)}
            disabled={loading}
            aria-label="Refresh documents"
            className="cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 rounded-lg border p-4">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
                <div className="ml-auto flex gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <p className="text-muted-foreground">
              No documents yet. Upload one above to get started.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden sm:table-cell">Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Chunks</TableHead>
                    <TableHead className="hidden md:table-cell">Uploaded</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id} className="group">
                      <TableCell className="font-medium">{doc.title}</TableCell>
                      <TableCell className="hidden sm:table-cell uppercase text-xs tracking-wider text-muted-foreground">
                        {doc.file_type}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[doc.status] ?? "secondary"}>
                          {doc.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {doc.chunk_count}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {doc.status === "ready" && (
                            <Link href={`/chat?doc=${doc.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="cursor-pointer gap-1.5 text-primary hover:text-primary hover:bg-primary/10"
                              >
                                <MessageSquare className="h-4 w-4" />
                                <span className="hidden sm:inline">Chat</span>
                              </Button>
                            </Link>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(doc.id, doc.title)}
                            disabled={deleting === doc.id}
                            aria-label={`Delete ${doc.title}`}
                          >
                            {deleting === doc.id ? (
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => fetchDocs(page - 1)}
                  className="cursor-pointer"
                >
                  Previous
                </Button>
                <span className="flex items-center text-sm text-muted-foreground px-3">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => fetchDocs(page + 1)}
                  className="cursor-pointer"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
