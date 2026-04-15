export const useRouter = jest.fn(() => ({
  push: jest.fn(),
  back: jest.fn(),
  refresh: jest.fn(),
}));

export const usePathname = jest.fn(() => "/dashboard");

export const useSearchParams = jest.fn(() => ({
  get: jest.fn(() => null),
}));
