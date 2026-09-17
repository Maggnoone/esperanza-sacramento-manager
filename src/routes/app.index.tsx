import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import {
  Users,
  HeartHandshake,
  BookOpen,
  Wallet,
  ClipboardCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/export";
import { staggerContainer, staggerItem } from "@/lib/motion";
import type { Confirmando, Asistencia, Pago, CostoRetiro } from "@/integrations/supabase/types";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import logoESP from "@/assets/logoESP.png";

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
  statusCounts: { name: string; value: number; color: string }[];
}

interface KpiCard {
  label: string;
  value: number;
  format?: (value: number) => string;
  icon: LucideIcon;
  hint?: string;
}

function Dashboard() {
  const { user, roles, canSeePagos } = useAuth();
  const reduceMotion = useReducedMotion();

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats", canSeePagos],
    queryFn: async () => {
      const [confirmandos, padrinos, charlas, asistencia, pagos, costo] = await Promise.all([
        supabase.from("confirmandos").select("id, status, has_baptism", { count: "exact" }),
        supabase.from("padrinos").select("id", { count: "exact", head: true }),
        supabase.from("charlas").select("id", { count: "exact", head: true }),
        supabase.from("asistencia").select("id, presente"),
        canSeePagos
          ? supabase.from("pagos").select("monto")
          : Promise.resolve({ data: [] as Pago[] }),
        canSeePagos
          ? supabase.from("costo_retiro").select("monto").eq("activo", true).maybeSingle()
          : Promise.resolve({ data: null as CostoRetiro | null }),
      ]);
      const totalConf = confirmandos.count ?? 0;
      const conBautismo = ((confirmandos.data ?? []) as Confirmando[]).filter(
        (c) => c.has_baptism,
      ).length;
      const aptos = ((confirmandos.data ?? []) as Confirmando[]).filter(
        (c) => c.status === "apto" || c.status === "confirmado",
      ).length;
      const totalAsist = (asistencia.data as Asistencia[] | null)?.length ?? 0;
      const presentes = ((asistencia.data ?? []) as Asistencia[]).filter((a) => a.presente).length;
      const recaudado = ((pagos.data ?? []) as Pago[]).reduce(
        (s, p) => s + Number(p.monto ?? 0),
        0,
      );
      const costoTotal = Number((costo.data as CostoRetiro | null)?.monto ?? 0) * totalConf;
      const dataConf = (confirmandos.data ?? []) as Confirmando[];
      const statusCounts = [
        {
          name: "Activo",
          value: dataConf.filter((c) => c.status === "activo").length,
          color: "#0d9488",
        },
        {
          name: "Apto",
          value: dataConf.filter((c) => c.status === "apto").length,
          color: "#fbbf24",
        },
        {
          name: "Confirmado",
          value: dataConf.filter((c) => c.status === "confirmado").length,
          color: "#059669",
        },
        {
          name: "Baja",
          value: dataConf.filter((c) => c.status === "baja").length,
          color: "#8ba39d",
        },
      ].filter((s) => s.value > 0);
      return {
        totalConf,
        conBautismo,
        aptos,
        padrinos: padrinos.count ?? 0,
        charlas: charlas.count ?? 0,
        asistPct: totalAsist ? Math.round((presentes / totalAsist) * 100) : 0,
        recaudado,
        pendiente: Math.max(costoTotal - recaudado, 0),
        statusCounts,
      };
    },
  });

  const cards: KpiCard[] = [
    {
      label: "Confirmandos",
      value: stats?.totalConf ?? 0,
      icon: Users,
      hint: `${stats?.conBautismo ?? 0} con bautismo`,
    },
    {
      label: "Aptos / Confirmados",
      value: stats?.aptos ?? 0,
      icon: Sparkles,
      hint: "Listos para el sacramento",
    },
    {
      label: "Padrinos registrados",
      value: stats?.padrinos ?? 0,
      icon: HeartHandshake,
      hint: "Disponibles para asignar",
    },
    {
      label: "Charlas programadas",
      value: stats?.charlas ?? 0,
      icon: BookOpen,
      hint: "Itinerario formativo",
    },
    {
      label: "Asistencia promedio",
      value: stats?.asistPct ?? 0,
      format: (n) => `${Math.round(n)}%`,
      icon: ClipboardCheck,
      hint: "De todos los encuentros",
    },
    ...(canSeePagos
      ? [
          {
            label: "Recaudado retiro",
            value: stats?.recaudado ?? 0,
            format: formatCurrency,
            icon: Wallet,
            hint: `Pendiente: ${formatCurrency(stats?.pendiente ?? 0)}`,
          },
        ]
      : []),
  ];

  const renderKpiCard = (card: KpiCard) => (
    <StatCard
      label={card.label}
      value={card.value}
      format={card.format}
      icon={card.icon}
      hint={card.hint}
    />
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("es-AR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Bienvenido, <span className="text-primary">{user?.email?.split("@")[0]}</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Rol{roles.length > 1 ? "es" : ""}:{" "}
          <span className="font-medium text-foreground">{roles.join(", ") || "sin asignar"}</span>
        </p>
      </div>

      {reduceMotion ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <div key={c.label}>{renderKpiCard(c)}</div>
          ))}
        </div>
      ) : (
        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {cards.map((c) => (
            <motion.div key={c.label} variants={staggerItem}>
              {renderKpiCard(c)}
            </motion.div>
          ))}
        </motion.div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Estado de confirmandos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.statusCounts && stats.statusCounts.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={stats.statusCounts}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                  >
                    {stats.statusCounts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-hero shadow-soft">
          <CardContent className="flex items-center gap-4 p-6">
            <img
              src={logoESP}
              alt="Esperanza de San Pablo"
              className="h-12 w-12 rounded-xl object-contain shadow-glow"
            />
            <div>
              <h3 className="font-display text-lg font-semibold">Tip del día</h3>
              <p className="text-sm text-muted-foreground">
                Recuerda que un confirmando solo puede marcarse como <strong>Apto</strong> si tiene
                su bautismo registrado.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
