import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useConfirmandos } from "@/hooks/use-data";
import type { ReactNode } from "react";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation((cb: (v: unknown) => unknown) =>
        Promise.resolve(cb({ data: [{ id: "1", full_name: "Juan Pérez" }], error: null })),
      ),
    }),
  },
}));

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("useConfirmandos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch confirmandos with correct query key", async () => {
    const { result } = renderHook(() => useConfirmandos(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: "1", full_name: "Juan Pérez" }]);

    const { supabase } = await import("@/integrations/supabase/client");
    expect(supabase.from).toHaveBeenCalledWith("confirmandos");
  });
});
