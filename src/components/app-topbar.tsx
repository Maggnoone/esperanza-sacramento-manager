import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";

import { NotificationsPopover } from "@/components/notifications-popover";
import { ThemeToggle } from "@/components/theme-toggle";
import { IconButton } from "@/components/ui/icon-button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import logoESP from "@/assets/logoESP.png";

interface AppTopbarProps {
  /** Punto de inserción para el buscador / command palette. Oculto en mobile. */
  searchSlot?: ReactNode;
  /** Abre el buscador en mobile, donde no hay espacio para el pill de escritorio. */
  onSearchClick?: () => void;
}

export function AppTopbar({ searchSlot, onSearchClick }: AppTopbarProps) {
  const { user } = useAuth();

  const metadata = (user?.user_metadata ?? {}) as { full_name?: unknown };
  const fullName = typeof metadata.full_name === "string" ? metadata.full_name.trim() : "";
  const emailPrefix = user?.email?.split("@")[0]?.trim() ?? "";
  const firstName = fullName ? fullName.split(/\s+/)[0] : emailPrefix || null;

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
      <SidebarTrigger aria-label="Abrir menú lateral" />
      <Link to="/app" className="flex shrink-0 items-center">
        <img
          src={logoESP}
          alt="Esperanza de San Pablo"
          className="h-7 w-7 rounded-md object-contain opacity-80"
        />
      </Link>
      {firstName ? (
        <span className="hidden text-sm text-muted-foreground md:block">Hola, {firstName}</span>
      ) : null}
      {searchSlot ? (
        <div className="hidden min-w-0 flex-1 items-center md:flex">{searchSlot}</div>
      ) : null}
      <div className="ml-auto flex items-center gap-2">
        {onSearchClick ? (
          <IconButton
            className="md:hidden"
            onClick={onSearchClick}
            aria-label="Buscar"
            title="Buscar"
          >
            <Search />
          </IconButton>
        ) : null}
        <ThemeToggle />
        <NotificationsPopover />
      </div>
    </header>
  );
}
