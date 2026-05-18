import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import type { ReactNode } from "react";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      getClaims: vi.fn().mockResolvedValue({ data: { claims: { sub: "user-1" } }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation((cb: (v: unknown) => unknown) =>
        Promise.resolve(cb({ data: [{ role: "admin" }], error: null })),
      ),
    }),
  },
}));

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("should start in loading state with no user", async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({ data: { session: null }, error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it("should set user and roles when session exists", async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    const mockSession = {
      user: { id: "user-1", email: "test@test.com", app_metadata: {}, user_metadata: {}, aud: "authenticated", created_at: new Date().toISOString() },
      access_token: "token",
      refresh_token: "refresh",
      expires_in: 3600,
      expires_at: Date.now() + 3600,
      token_type: "bearer" as const,
    };
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({ data: { session: mockSession }, error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toEqual(mockSession.user);
    expect(result.current.roles).toEqual(["admin"]);
    expect(result.current.isAdmin).toBe(true);
  });

  it("should sign out and clear state", async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    const mockSession = {
      user: { id: "user-1", email: "test@test.com", app_metadata: {}, user_metadata: {}, aud: "authenticated", created_at: new Date().toISOString() },
      access_token: "token",
      refresh_token: "refresh",
      expires_in: 3600,
      expires_at: Date.now() + 3600,
      token_type: "bearer" as const,
    };
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({ data: { session: mockSession }, error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await result.current.signOut();

    expect(supabase.auth.signOut).toHaveBeenCalled();
  });
});
