/**
 * Tests for Register page.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterPage from "@/app/(auth)/register/page";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockRegister = jest.fn();
jest.mock("@/context/auth-context", () => ({
  useAuth: () => ({ register: mockRegister }),
}));

beforeEach(() => {
  mockPush.mockReset();
  mockRegister.mockReset();
});

describe("RegisterPage", () => {
  test("renders registration form fields", () => {
    render(<RegisterPage />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /register/i })).toBeInTheDocument();
  });

  test("shows password requirements when typing", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText("Password"), "abc");

    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  test("shows mismatch error when passwords differ", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "different");

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });

  test("submits form on valid input", async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue(undefined);

    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/name/i), "Test User");
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith("test@example.com", "password123", "Test User");
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  test("does not submit with short password", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/name/i), "Test");
    await user.type(screen.getByLabelText(/email/i), "t@t.com");
    await user.type(screen.getByLabelText("Password"), "short");
    await user.type(screen.getByLabelText(/confirm password/i), "short");
    await user.click(screen.getByRole("button", { name: /register/i }));

    expect(mockRegister).not.toHaveBeenCalled();
    expect(screen.getByText(/does not meet requirements/i)).toBeInTheDocument();
  });

  test("has login link", () => {
    render(<RegisterPage />);
    const link = screen.getByRole("link", { name: /sign in/i });
    expect(link).toHaveAttribute("href", "/login");
  });
});
