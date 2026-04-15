"use client";

import { useState, useRef, useCallback } from "react";
import { uploadDocument } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, X } from "lucide-react";
import { toast } from "sonner";
import type { DocumentResponse } from "@/types";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".csv", ".xlsx"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface DragDropUploadProps {
  onUploadComplete: (doc: DocumentResponse) => void;
}

export function DragDropUpload({ onUploadComplete }: DragDropUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function validateFile(f: File): string | null {
    const ext = f.name.substring(f.name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext) && !ACCEPTED_TYPES.includes(f.type)) {
      return "Only PDF, DOCX, CSV, and XLSX files are supported.";
    }
    if (f.size > MAX_FILE_SIZE) {
      return `File too large (${(f.size / 1024 / 1024).toFixed(1)}MB). Max 10MB.`;
    }
    return null;
  }

  function handleFile(f: File) {
    setError("");
    const err = validateFile(f);
    if (err) {
      setError(err);
      return;
    }
    setFile(f);
  }

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const doc = await uploadDocument(file, title || undefined);
      toast.success(`"${doc.title}" uploaded! Processing started.`);
      setFile(null);
      setTitle("");
      if (inputRef.current) inputRef.current.value = "";
      onUploadComplete(doc);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }

  function clearFile() {
    setFile(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !file && inputRef.current?.click()}
        className={`
          group/drop relative flex flex-col items-center justify-center gap-3
          rounded-2xl border-2 border-dashed p-10 cursor-pointer glass-card
          transition-[border-color,box-shadow,background-color] duration-300 ease-out
          ${dragOver
            ? "border-[color:var(--gold)] shadow-[0_0_40px_-8px_oklch(0.78_0.16_80/0.6)]"
            : file
              ? "border-[color:var(--gold)]/60"
              : "border-[color:var(--gold)]/30 hover:border-[color:var(--gold)]/70 hover:shadow-[0_0_24px_-10px_oklch(0.78_0.16_80/0.45)]"
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.csv,.xlsx"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        {file ? (
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-[color:var(--gold)]" />
            <div>
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              onClick={(e) => { e.stopPropagation(); clearFile(); }}
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <div className="rounded-full bg-[color:var(--gold)]/10 p-4 ring-1 ring-[color:var(--gold)]/25 transition-shadow group-hover/drop:shadow-[0_0_24px_oklch(0.78_0.16_80/0.4)]">
              <Upload className="h-8 w-8 text-[color:var(--gold)]" />
            </div>
            <div className="text-center">
              <p className="font-medium">
                Drag & drop your document here
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse — PDF, DOCX, CSV, XLSX up to 10MB
              </p>
            </div>
          </>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      {file && (
        <div className="flex gap-3">
          <div className="flex-1">
            <Label htmlFor="doc-title" className="sr-only">Title (optional)</Label>
            <Input
              id="doc-title"
              placeholder="Document title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <Button
            onClick={handleUpload}
            disabled={uploading}
            variant="purple"
            className="cursor-pointer px-6"
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Uploading...
              </span>
            ) : (
              "Upload"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
