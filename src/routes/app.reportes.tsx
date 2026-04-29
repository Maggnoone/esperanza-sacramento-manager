import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText, FileType, Users, ClipboardCheck, Wallet, AlertCircle } from "lucide-react";
import { exportToCSV, exportToPDF, exportToXLSX } from "@/lib/export";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/app/reportes")({ component: ReportesPage });

function ReportesPage() {
  const { canSeePagos } = useAuth();

  const { data: confirmandos = [] } = useQuery({
    queryKey: ["rep-confirmandos"],
    queryFn: async () => (await supabase.from("confirmandos").select("*, grupos(nombre), padrinos(full_name)")).data ?? [],
  });
  const { data: pagos = [] } = useQuery({
    queryKey: ["rep-pagos"],
    queryFn: async () => canSeePagos ? (await supabase.from("pagos").select("*, confirmandos(full_name)")).data ?? [] : [],
    enabled: canSeePagos,
  });

  const pendientes = confirmandos.filter((c: any) => c.status === "activo");
  const aptos = confirmandos.filter((c: any) => c.status === "apto" || c.status === "confirmado");
  const sinBautismo = confirmandos.filter((c: any) => !c.has_baptism);

  const reportes = [
    {
      title: "Listado completo de confirmandos",
      desc: `${confirmandos.length} registros con grupo, padrino y sacramentos.`,
      icon: Users,
      data: () => confirmandos.map((c: any) => ({ Nombre: c.full_name, DNI: c.dni, Grupo: c.grupos?.nombre, Padrino: c.padrinos?.full_name, Bautismo: c.has_baptism ? "Sí" : "No", Comunión: c.has_communion ? "Sí" : "No", Estado: c.status })),
      filename: "confirmandos-completo",
    },
    {
      title: "Confirmandos pendientes de aptitud",
      desc: `${pendientes.length} jóvenes aún en formación activa.`,
      icon: AlertCircle,
      data: () => pendientes.map((c: any) => ({ Nombre: c.full_name, DNI: c.dni, Bautismo: c.has_baptism ? "Sí" : "Falta", Comunión: c.has_communion ? "Sí" : "Falta", Padrino: c.padrinos?.full_name ?? "Sin asignar" })),
      filename: "pendientes-aptitud",
    },
    {
      title: "Confirmandos aptos / confirmados",
      desc: `${aptos.length} listos o ya confirmados.`,
      icon: ClipboardCheck,
      data: () => aptos.map((c: any) => ({ Nombre: c.full_name, DNI: c.dni, Estado: c.status, Fecha_confirmación: c.fecha_confirmacion ?? "—" })),
      filename: "aptos-confirmados",
    },
    {
      title: "Confirmandos sin bautismo registrado",
      desc: `${sinBautismo.length} requieren completar requisito.`,
      icon: AlertCircle,
      data: () => sinBautismo.map((c: any) => ({ Nombre: c.full_name, DNI: c.dni, Contacto: c.contacto_padres ?? c.telefono })),
      filename: "sin-bautismo",
    },
    ...(canSeePagos ? [{
      title: "Historial completo de pagos",
      desc: `${pagos.length} transacciones registradas.`,
      icon: Wallet,
      data: () => pagos.map((p: any) => ({ Fecha: p.fecha, Confirmando: p.confirmandos?.full_name, Monto: p.monto, Método: p.metodo, Referencia: p.referencia ?? "" })),
      filename: "pagos-historial",
    }] : []),
  ];

  const run = (kind: "xlsx" | "pdf" | "csv", r: typeof reportes[number]) => {
    const data = r.data();
    if (!data.length) return toast.warning("Sin datos para exportar");
    if (kind === "csv") exportToCSV(data, r.filename);
    else if (kind === "xlsx") exportToXLSX(data, r.filename, "Reporte");
    else exportToPDF(r.title, Object.keys(data[0]), data.map((d) => Object.values(d) as any), r.filename, r.desc);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Reportes y Exportaciones</h1>
        <p className="text-sm text-muted-foreground">Genera reportes en Excel, PDF o CSV.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {reportes.map((r) => (
          <Card key={r.title} className="shadow-soft">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary"><r.icon className="h-5 w-5" /></div>
                <div className="flex-1">
                  <CardTitle className="text-base">{r.title}</CardTitle>
                  <CardDescription className="text-xs">{r.desc}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => run("xlsx", r)}><FileSpreadsheet className="mr-2 h-4 w-4" />Excel</Button>
              <Button size="sm" variant="outline" onClick={() => run("pdf", r)}><FileText className="mr-2 h-4 w-4" />PDF</Button>
              <Button size="sm" variant="outline" onClick={() => run("csv", r)}><FileType className="mr-2 h-4 w-4" />CSV</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
