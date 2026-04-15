/**
 * Tests for NavBar component.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NavBar } from "@/components/nav-bar";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

// Mock next-themes
jest.mock("next-themes", () => ({
  useTheme: () => ({ theme: "dark", setTheme: jest.fn() }),
}));

// Mock auth context
const mockLogout = jest.fn();
jest.mock("@/context/auth-context", () => ({
  useAuth: () => ({
    user: { id: "1", email: "test@example.com", name: "Test User", created_at: "2024-01-01" },
    logout: mockLogout,
  }),
}));

describe("NavBar", () => {
  beforeEach(() => {
    mockLogout.mockReset();
  });

  test("renders app name as link", () => {
    render(<NavBar />);
    const link = screen.getByText("NeuroDocAI");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "/dashboard");
  });

  test("shows user name", () => {
    render(<NavBar />);
    expect(screen.getByText("Test User")).toBeInTheDocument();
  });

  test("has logout button", () => {
    render(<NavBar />);
    const logoutBtn = screen.getByRole("button", { name: /logout/i });
    expect(logoutBtn).toBeInTheDocument();
  });

  test("calls logout on click", async () => {
    const user = userEvent.setup();
    render(<NavBar />);
    await user.click(screen.getByRole("button", { name: /logout/i }));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  test("has theme toggle button", () => {
    render(<NavBar />);
    const themeBtn = screen.getByRole("button", { name: /switch to/i });
    expect(themeBtn).toBeInTheDocument();
  });
});
