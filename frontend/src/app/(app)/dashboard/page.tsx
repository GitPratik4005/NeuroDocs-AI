"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
import { GlassCard } from "@/components/ui/glass-card";
import { StaggerList, StaggerItem } from "@/components/motion/stagger-list";
import { MessageSquare, Trash2, RefreshCw, Sparkles } from "lucide-react";
import { easeOut } from "@/lib/motion";

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
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: easeOut }}
        className="space-y-6 pt-8 text-center"
      >
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 glass-panel px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-[color:var(--gold)]" />
            Your private knowledge base
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            <span className="gold-text">AI Document Intelligence</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            Upload documents and chat with them instantly. Get summaries, key
            points, and cited answers in seconds.
          </p>
        </div>
        <div className="mx-auto max-w-xl">
          <DragDropUpload onUploadComplete={handleUploadComplete} />
        </div>
      </motion.section>

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
              <div
                key={i}
                className="flex items-center gap-4 rounded-xl border border-white/10 glass-panel p-4"
              >
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
          <GlassCard className="p-12 text-center">
            <p className="text-muted-foreground">
              No documents yet. Upload one above to get started.
            </p>
          </GlassCard>
        ) : (
          <>
            <StaggerList className="hidden space-y-0 md:block">
              <GlassCard className="overflow-hidden p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
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
                      <TableRow key={doc.id} className="group border-white/5 hover:bg-white/5">
                        <TableCell className="font-medium">{doc.title}</TableCell>
                        <TableCell className="hidden text-xs uppercase tracking-wider text-muted-foreground sm:table-cell">
                          {doc.file_type}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[doc.status] ?? "secondary"}>
                            {doc.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground sm:table-cell">
                          {doc.chunk_count}
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">
                          {new Date(doc.uploaded_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {doc.status === "ready" && (
                              <Link href={`/chat?doc=${doc.id}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="cursor-pointer gap-1.5 text-[color:var(--purple-cta)] hover:bg-[color:var(--purple-cta)]/10 hover:text-[color:var(--purple-cta)]"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                  <span className="hidden sm:inline">Chat</span>
                                </Button>
                              </Link>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 cursor-pointer text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
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
              </GlassCard>
            </StaggerList>

            {/* Mobile card list */}
            <StaggerList className="grid gap-3 md:hidden">
              {documents.map((doc) => (
                <StaggerItem key={doc.id}>
                  <GlassCard className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{doc.title}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="uppercase tracking-wider">
                            {doc.file_type}
                          </span>
                          <span>·</span>
                          <span>{doc.chunk_count} chunks</span>
                        </div>
                      </div>
                      <Badge variant={statusVariant[doc.status] ?? "secondary"}>
                        {doc.status}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-end gap-1">
                      {doc.status === "ready" && (
                        <Link href={`/chat?doc=${doc.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="cursor-pointer gap-1.5 text-[color:var(--purple-cta)]"
                          >
                            <MessageSquare className="h-4 w-4" /> Chat
                          </Button>
                        </Link>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-destructive"
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
                  </GlassCard>
                </StaggerItem>
              ))}
            </StaggerList>

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
                <span className="flex items-center px-3 text-sm text-muted-foreground">
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
