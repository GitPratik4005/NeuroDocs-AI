/**
 * Tests for DragDropUpload component.
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DragDropUpload } from "@/components/drag-drop-upload";

// Mock API
jest.mock("@/services/api", () => ({
  uploadDocument: jest.fn(),
}));

// Mock sonner
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

import { uploadDocument } from "@/services/api";
import { toast } from "sonner";

const mockUpload = uploadDocument as jest.MockedFunction<typeof uploadDocument>;
const mockOnComplete = jest.fn();

beforeEach(() => {
  mockUpload.mockReset();
  mockOnComplete.mockReset();
  (toast.success as jest.Mock).mockReset();
  (toast.error as jest.Mock).mockReset();
});

function createFile(name: string, size: number, type: string): File {
  const buffer = new ArrayBuffer(size);
  return new File([buffer], name, { type });
}

describe("DragDropUpload", () => {
  test("renders upload zone with instructions", () => {
    render(<DragDropUpload onUploadComplete={mockOnComplete} />);
    expect(screen.getByText(/drag & drop/i)).toBeInTheDocument();
    expect(screen.getByText(/pdf, docx/i)).toBeInTheDocument();
  });

  test("shows file info after selection", async () => {
    const user = userEvent.setup();
    render(<DragDropUpload onUploadComplete={mockOnComplete} />);

    const file = createFile("test.pdf", 1024 * 100, "application/pdf");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    expect(screen.getByText("test.pdf")).toBeInTheDocument();
    expect(screen.getByText(/0\.10 MB/)).toBeInTheDocument();
  });

  test("rejects non-PDF/DOCX files via drag and drop", () => {
    render(<DragDropUpload onUploadComplete={mockOnComplete} />);

    const file = createFile("test.txt", 100, "text/plain");
    const dropZone = screen.getByText(/drag & drop/i).closest("div")!;

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });

    expect(screen.getByText(/only pdf and docx/i)).toBeInTheDocument();
  });

  test("rejects files over 10MB", async () => {
    const user = userEvent.setup();
    render(<DragDropUpload onUploadComplete={mockOnComplete} />);

    const file = createFile("big.pdf", 11 * 1024 * 1024, "application/pdf");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    expect(screen.getByText(/file too large/i)).toBeInTheDocument();
  });

  test("uploads file and calls onUploadComplete", async () => {
    const user = userEvent.setup();
    const mockDoc = {
      id: "d1",
      title: "test.pdf",
      file_type: "pdf",
      status: "processing" as const,
      chunk_count: 0,
      uploaded_at: "2024-01-01",
    };
    mockUpload.mockResolvedValue(mockDoc);

    render(<DragDropUpload onUploadComplete={mockOnComplete} />);

    const file = createFile("test.pdf", 1024, "application/pdf");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    // Click upload button
    const uploadBtn = screen.getByRole("button", { name: /upload/i });
    await user.click(uploadBtn);

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalledWith(file, undefined);
      expect(mockOnComplete).toHaveBeenCalledWith(mockDoc);
      expect(toast.success).toHaveBeenCalled();
    });
  });

  test("shows error on upload failure", async () => {
    const user = userEvent.setup();
    mockUpload.mockRejectedValue(new Error("Server error"));

    render(<DragDropUpload onUploadComplete={mockOnComplete} />);

    const file = createFile("test.pdf", 1024, "application/pdf");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    await user.click(screen.getByRole("button", { name: /upload/i }));

    await waitFor(() => {
      expect(screen.getByText("Server error")).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalled();
    });
  });

  test("clear button removes selected file", async () => {
    const user = userEvent.setup();
    render(<DragDropUpload onUploadComplete={mockOnComplete} />);

    const file = createFile("test.pdf", 1024, "application/pdf");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    expect(screen.getByText("test.pdf")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /remove file/i }));

    expect(screen.queryByText("test.pdf")).not.toBeInTheDocument();
    expect(screen.getByText(/drag & drop/i)).toBeInTheDocument();
  });
});
