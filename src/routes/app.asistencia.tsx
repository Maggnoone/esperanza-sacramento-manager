import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/export";
import { ClipboardCheck } from "lucide-react";

export const Route = createFileRoute("/app/asistencia")({ component: AsistenciaPage });

function AsistenciaPage() {
  const qc = useQueryClient();
  const [charlaId, setCharlaId] = useState<string>("");

  const { data: charlas = [] } = useQuery({
    queryKey: ["charlas-list"],
    queryFn: async () => (await supabase.from("charlas").select("id, titulo, fecha, tipo").order("fecha", { ascending: false })).data ?? [],
  });

  const { data: confirmandos = [] } = useQuery({
    queryKey: ["confirmandos-asist"],
    queryFn: async () => (await supabase.from("confirmandos").select("id, full_name").neq("status", "baja").order("full_name")).data ?? [],
  });

  const { data: asistencia = [] } = useQuery({
    queryKey: ["asistencia", charlaId],
    queryFn: async () => {
      if (!charlaId) return [];
      return (await supabase.from("asistencia").select("*").eq("charla_id", charlaId)).data ?? [];
    },
    enabled: !!charlaId,
  });

  const asistMap = useMemo(() => {
    const m = new Map<string, any>();
    asistencia.forEach((a: any) => m.set(a.confirmando_id, a));
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
        const { error } = await supabase.from("asistencia").insert({ charla_id: charlaId, confirmando_id, presente, registered_by: u.user?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["asistencia", charlaId] }),
    onError: (e: any) => toast.error(e.message),
  });

  const presentes = asistencia.filter((a: any) => a.presente).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Pase de Lista</h1>
        <p className="text-sm text-muted-foreground">Selecciona una sesión y marca la asistencia. Optimizado para móvil.</p>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Sesión</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={charlaId} onValueChange={setCharlaId}>
            <SelectTrigger><SelectValue placeholder="Selecciona una charla" /></SelectTrigger>
            <SelectContent>
              {charlas.map((c: any) => (
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
            <Badge variant="secondary">{presentes} / {confirmandos.length} presentes</Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {confirmandos.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">No hay confirmandos registrados aún.</p>
            ) : confirmandos.map((c: any) => {
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
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
