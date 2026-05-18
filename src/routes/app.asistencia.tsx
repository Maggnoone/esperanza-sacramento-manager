import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDateTime, exportToCSV, exportToXLSX, exportToPDF } from "@/lib/export";
import { ClipboardCheck, Download, FileSpreadsheet, FileText } from "lucide-react";
import { useCharlasList, useConfirmandosActivos, useAsistencia } from "@/hooks/use-data";
import type { Asistencia } from "@/integrations/supabase/types";

export const Route = createFileRoute("/app/asistencia")({ component: AsistenciaPage });

function AsistenciaPage() {
  const qc = useQueryClient();
  const [charlaId, setCharlaId] = useState<string>("");

  const { data: charlas = [] } = useCharlasList();
  const { data: confirmandos = [] } = useConfirmandosActivos();
  const { data: asistencia = [] } = useAsistencia(charlaId);

  const asistMap = useMemo(() => {
    const m = new Map<string, Asistencia>();
    asistencia.forEach((a) => m.set(a.confirmando_id, a));
    return m;
  }, [asistencia]);

  const toggle = useMutation({
    mutationFn: async ({ confirmando_id, presente }: { confirmando_id: string; presente: boolean }) => {
      const existing = asistMap.get(confirmando_id);
      if (existing) {
        const { error } = await supabase.from("asistencia").update({ presente }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { data: u } = await supabase.auth.getUser();
        const { error } = await supabase
          .from("asistencia")
          .insert({ charla_id: charlaId, confirmando_id, presente, registered_by: u.user?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["asistencia", charlaId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const presentes = asistencia.filter((a) => a.presente).length;

  const charlaSeleccionada = charlas.find((c) => c.id === charlaId);

  const exportData = useMemo(() => {
    if (!charlaId || confirmandos.length === 0) return [];
    return confirmandos.map((c) => {
      const a = asistMap.get(c.id);
      return {
        Confirmando: c.full_name,
        Estado: a?.presente ? "Presente" : "Ausente",
        "Fecha Registro": a?.created_at ? formatDateTime(a.created_at) : "—",
      };
    });
  }, [charlaId, confirmandos, asistMap]);

  const handleExportCSV = () => {
    if (!exportData.length) { toast.error("No hay datos para exportar"); return; }
    const filename = `asistencia-${charlaSeleccionada?.titulo || "charla"}-${new Date().toISOString().split("T")[0]}`;
    exportToCSV(exportData, filename);
    toast.success("CSV exportado correctamente");
  };

  const handleExportXLSX = () => {
    if (!exportData.length) { toast.error("No hay datos para exportar"); return; }
    const filename = `asistencia-${charlaSeleccionada?.titulo || "charla"}-${new Date().toISOString().split("T")[0]}`;
    exportToXLSX(exportData, filename, "Asistencia");
    toast.success("Excel exportado correctamente");
  };

  const handleExportPDF = () => {
    if (!exportData.length) { toast.error("No hay datos para exportar"); return; }
    const filename = `asistencia-${charlaSeleccionada?.titulo || "charla"}-${new Date().toISOString().split("T")[0]}`;
    const columns = ["Confirmando", "Estado", "Fecha Registro"];
    const rows = exportData.map((item) => [item["Confirmando"], item["Estado"], item["Fecha Registro"]]);
    const subtitle = `Charla: ${charlaSeleccionada?.titulo || "—"} | ${formatDateTime(charlaSeleccionada?.fecha)} | ${presentes}/${confirmandos.length} presentes`;
    exportToPDF("Reporte de Asistencia", columns, rows, filename, subtitle);
    toast.success("PDF exportado correctamente");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Pase de Lista</h1>
        <p className="text-sm text-muted-foreground">Selecciona una sesión y marca la asistencia. Optimizado para móvil.</p>
      </div>

      <Card className="shadow-soft">
        <CardHeader><CardTitle className="text-base">Sesión</CardTitle></CardHeader>
        <CardContent>
          <Select value={charlaId} onValueChange={setCharlaId}>
            <SelectTrigger><SelectValue placeholder="Selecciona una charla" /></SelectTrigger>
            <SelectContent>
              {charlas.map((c) => (
                <SelectItem key={c.id} value={c.id}>{formatDateTime(c.fecha)} — {c.titulo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {charlaId && (
        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><ClipboardCheck className="h-4 w-4" /> Confirmandos</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{presentes} / {confirmandos.length} presentes</Badge>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!exportData.length} className="h-8 px-2 cursor-pointer"><Download className="h-3 w-3 mr-1" />CSV</Button>
                <Button variant="outline" size="sm" onClick={handleExportXLSX} disabled={!exportData.length} className="h-8 px-2 cursor-pointer"><FileSpreadsheet className="h-3 w-3 mr-1" />Excel</Button>
                <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={!exportData.length} className="h-8 px-2 cursor-pointer"><FileText className="h-3 w-3 mr-1" />PDF</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {confirmandos.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">No hay confirmandos registrados aún.</p>
            ) : (
              confirmandos.map((c) => {
                const a = asistMap.get(c.id);
                return (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border bg-card p-3 shadow-soft">
                    <span className="font-medium">{c.full_name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{a?.presente ? "Presente" : "Ausente"}</span>
                      <Switch checked={!!a?.presente} onCheckedChange={(v) => toggle.mutate({ confirmando_id: c.id, presente: v })} />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
