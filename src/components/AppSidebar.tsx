import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  HeartHandshake,
  CalendarDays,
  ClipboardCheck,
  BookOpen,
  Wallet,
  FileBarChart,
  Settings,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const { user, roles, signOut, canSeePagos, isAdmin } = useAuth();
  const navigate = useNavigate();

  const isActive = (path: string) =>
    path === "/app" ? currentPath === "/app" : currentPath.startsWith(path);

  const mainItems = [
    { title: "Inicio", url: "/app", icon: LayoutDashboard },
    { title: "Confirmandos", url: "/app/confirmandos", icon: Users },
    { title: "Padrinos", url: "/app/padrinos", icon: HeartHandshake },
    { title: "Asistencia", url: "/app/asistencia", icon: ClipboardCheck },
  ];

  const formacionItems = [
    { title: "Charlas", url: "/app/charlas", icon: BookOpen },
    { title: "Calendario", url: "/app/calendario", icon: CalendarDays },
  ];

  const adminItems = [
    ...(canSeePagos ? [{ title: "Pagos del Retiro", url: "/app/pagos", icon: Wallet }] : []),
    { title: "Reportes", url: "/app/reportes", icon: FileBarChart },
    ...(isAdmin ? [{ title: "Configuración", url: "/app/configuracion", icon: Settings }] : []),
  ];

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/auth" });
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/app" className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-soft">
            <Sparkles className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-display text-base font-semibold">Esperanza Viva</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                San Pablo · Confirmación
              </span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Gestión</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Formación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {formacionItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Administración</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {!collapsed && user && (
          <div className="px-2 py-2 text-xs">
            <p className="truncate font-medium text-sidebar-foreground">{user.email}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {roles.join(" · ") || "Sin rol"}
            </p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start gap-2"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Cerrar sesión</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
