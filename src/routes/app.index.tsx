import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, HeartHandshake, BookOpen, Wallet, ClipboardCheck, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/export";
import type { Confirmando, Asistencia, Pago, CostoRetiro } from "@/integrations/supabase/types";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

interface DashboardStats {
  totalConf: number;
  conBautismo: number;
  aptos: number;
  padrinos: number;
  charlas: number;
  asistPct: number;
  recaudado: number;
  pendiente: number;
}

function Dashboard() {
  const { user, roles, canSeePagos } = useAuth();

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats", canSeePagos],
    queryFn: async () => {
      const [confirmandos, padrinos, charlas, asistencia, pagos, costo] = await Promise.all([
        supabase.from("confirmandos").select("id, status, has_baptism", { count: "exact" }),
        supabase.from("padrinos").select("id", { count: "exact", head: true }),
        supabase.from("charlas").select("id", { count: "exact", head: true }),
        supabase.from("asistencia").select("id, presente"),
        canSeePagos ? supabase.from("pagos").select("monto") : Promise.resolve({ data: [] as Pago[] }),
        canSeePagos ? supabase.from("costo_retiro").select("monto").eq("activo", true).maybeSingle() : Promise.resolve({ data: null as CostoRetiro | null }),
      ]);
      const totalConf = confirmandos.count ?? 0;
      const conBautismo = ((confirmandos.data ?? []) as Confirmando[]).filter((c) => c.has_baptism).length;
      const aptos = ((confirmandos.data ?? []) as Confirmando[]).filter((c) => c.status === "apto" || c.status === "confirmado").length;
      const totalAsist = (asistencia.data as Asistencia[] | null)?.length ?? 0;
      const presentes = ((asistencia.data ?? []) as Asistencia[]).filter((a) => a.presente).length;
      const recaudado = ((pagos.data ?? []) as Pago[]).reduce((s, p) => s + Number(p.monto ?? 0), 0);
      const costoTotal = Number((costo.data as CostoRetiro | null)?.monto ?? 0) * totalConf;
      return {
        totalConf,
        conBautismo,
        aptos,
        padrinos: padrinos.count ?? 0,
        charlas: charlas.count ?? 0,
        asistPct: totalAsist ? Math.round((presentes / totalAsist) * 100) : 0,
        recaudado,
        pendiente: Math.max(costoTotal - recaudado, 0),
      };
    },
  });

  const cards = [
    { label: "Confirmandos", value: stats?.totalConf ?? 0, icon: Users, hint: `${stats?.conBautismo ?? 0} con bautismo` },
    { label: "Aptos / Confirmados", value: stats?.aptos ?? 0, icon: Sparkles, hint: "Listos para el sacramento" },
    { label: "Padrinos registrados", value: stats?.padrinos ?? 0, icon: HeartHandshake, hint: "Disponibles para asignar" },
    { label: "Charlas programadas", value: stats?.charlas ?? 0, icon: BookOpen, hint: "Itinerario formativo" },
    { label: "Asistencia promedio", value: `${stats?.asistPct ?? 0}%`, icon: ClipboardCheck, hint: "De todos los encuentros" },
    ...(canSeePagos
      ? [{ label: "Recaudado retiro", value: formatCurrency(stats?.recaudado ?? 0), icon: Wallet, hint: `Pendiente: ${formatCurrency(stats?.pendiente ?? 0)}` }]
      : []),
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Bienvenido, <span className="text-primary">{user?.email?.split("@")[0]}</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Rol{roles.length > 1 ? "es" : ""}: <span className="font-medium text-foreground">{roles.join(", ") || "sin asignar"}</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label} className="shadow-soft transition hover:shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">
                <c.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-display text-3xl font-semibold">{c.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{c.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gradient-hero shadow-soft">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold">Tip del día</h3>
            <p className="text-sm text-muted-foreground">
              Recuerda que un confirmando solo puede marcarse como <strong>Apto</strong> si tiene su bautismo registrado.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
