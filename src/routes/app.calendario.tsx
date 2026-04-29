import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Plus } from "lucide-react";
import { formatDateTime } from "@/lib/export";

export const Route = createFileRoute("/app/calendario")({ component: CalendarioPage });

function CalendarioPage() {
  const { data: charlas = [] } = useQuery({
    queryKey: ["calendario-charlas"],
    queryFn: async () => (await supabase.from("charlas").select("*").order("fecha")).data ?? [],
  });

  // Group by month
  const byMonth = charlas.reduce((acc: Record<string, any[]>, c: any) => {
    const key = new Date(c.fecha).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
    (acc[key] ||= []).push(c);
    return acc;
  }, {});

  const tipoColor: Record<string, string> = {
    retiro: "bg-gradient-primary text-primary-foreground",
    convivencia: "bg-gold/20 text-gold-foreground border-gold/40",
    charla: "bg-secondary",
    celebracion: "bg-accent",
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Calendario de Formación</h1>
          <p className="text-sm text-muted-foreground">Charlas, convivencias, retiro y celebraciones del año.</p>
        </div>
        <Button asChild><Link to="/app/charlas"><Plus className="mr-2 h-4 w-4" />Nueva sesión</Link></Button>
      </div>

      {Object.keys(byMonth).length === 0 ? (
        <Card className="shadow-soft">
          <CardContent className="py-12 text-center">
            <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">Aún no hay sesiones cargadas.</p>
            <Button asChild className="mt-4"><Link to="/app/charlas">Crear la primera</Link></Button>
          </CardContent>
        </Card>
      ) : Object.entries(byMonth).map(([month, items]) => (
        <Card key={month} className="shadow-soft">
          <CardHeader><CardTitle className="font-display text-xl capitalize">{month}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {items.map((c: any) => (
              <div key={c.id} className="flex items-start gap-4 rounded-lg border p-4 transition hover:shadow-soft">
                <div className="flex flex-col items-center justify-center rounded-lg bg-secondary px-4 py-2 text-center">
                  <span className="font-display text-2xl font-semibold leading-none">{new Date(c.fecha).getDate()}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{new Date(c.fecha).toLocaleDateString("es-AR", { weekday: "short" })}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{c.titulo}</h3>
                    <Badge className={tipoColor[c.tipo]}>{c.tipo}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatDateTime(c.fecha)} · {c.duracion_min} min</p>
                  {c.ponente && <p className="mt-1 text-sm">Ponente: <span className="font-medium">{c.ponente}</span></p>}
                  {c.ubicacion && <p className="text-sm text-muted-foreground">📍 {c.ubicacion}</p>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
