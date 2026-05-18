import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" />;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <a href="#main-content" className="skip-link">
            Saltar al contenido
          </a>
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger aria-label="Abrir menú lateral" />
            <img src="/src/assets/logoESP.png" alt="Esperanza Viva" className="h-7 w-7 rounded-md object-contain opacity-80" />
            <div className="flex-1" />
          </header>
          <main id="main-content" className="flex-1 p-6 page-transition">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
