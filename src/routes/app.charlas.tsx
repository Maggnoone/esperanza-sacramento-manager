import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/export";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/app/charlas")({ component: CharlasPage });

const schema = z.object({
  titulo: z.string().min(2).max(120),
  descripcion: z.string().max(2000).optional().or(z.literal("")),
  fecha: z.string().min(1, "Requerido"),
  duracion_min: z.coerce.number().int().min(15).max(600),
  ponente: z.string().max(120).optional().or(z.literal("")),
  ubicacion: z.string().max(120).optional().or(z.literal("")),
  tipo: z.enum(["charla", "convivencia", "retiro", "celebracion"]),
});
type FormValues = z.infer<typeof schema>;

function CharlasPage() {
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const { data: rows = [] } = useQuery({
    queryKey: ["charlas"],
    queryFn: async () => (await supabase.from("charlas").select("*").order("fecha", { ascending: false })).data ?? [],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { titulo: "", duracion_min: 60, tipo: "charla", fecha: "" },
  });

  const openNew = () => { setEditing(null); form.reset({ titulo: "", descripcion: "", duracion_min: 60, tipo: "charla", ponente: "", ubicacion: "", fecha: new Date().toISOString().slice(0, 16) }); setOpen(true); };
  const openEdit = (r: any) => { setEditing(r); form.reset({ ...r, fecha: new Date(r.fecha).toISOString().slice(0, 16), descripcion: r.descripcion ?? "", ponente: r.ponente ?? "", ubicacion: r.ubicacion ?? "" }); setOpen(true); };

  const save = useMutation({
    mutationFn: async (v: FormValues) => {
      const payload: any = { ...v, fecha: new Date(v.fecha).toISOString(), descripcion: v.descripcion || null, ponente: v.ponente || null, ubicacion: v.ubicacion || null };
      const { error } = editing ? await supabase.from("charlas").update(payload).eq("id", editing.id) : await supabase.from("charlas").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Guardado"); qc.invalidateQueries({ queryKey: ["charlas"] }); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("charlas").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Eliminada"); qc.invalidateQueries({ queryKey: ["charlas"] }); },
  });

  const tipoColor: Record<string, "default" | "secondary" | "outline"> = { retiro: "default", convivencia: "secondary", charla: "outline", celebracion: "default" };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Charlas y Encuentros</h1>
          <p className="text-sm text-muted-foreground">Itinerario formativo: catequesis, convivencias y retiro.</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nueva</Button>
      </div>

      <Card className="shadow-soft">
        <CardHeader><CardTitle className="text-base">{rows.length} sesiones</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Título</TableHead><TableHead>Tipo</TableHead><TableHead>Ponente</TableHead><TableHead>Ubicación</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Sin sesiones programadas</TableCell></TableRow>
              ) : rows.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell>{formatDateTime(r.fecha)}</TableCell>
                  <TableCell className="font-medium">{r.titulo}</TableCell>
                  <TableCell><Badge variant={tipoColor[r.tipo] ?? "outline"}>{r.tipo}</Badge></TableCell>
                  <TableCell>{r.ponente ?? "—"}</TableCell>
                  <TableCell>{r.ubicacion ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                    {isAdmin && <Button size="icon" variant="ghost" onClick={() => confirm("¿Eliminar?") && remove.mutate(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar sesión" : "Nueva sesión"}</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Título *</Label><Input {...form.register("titulo")} /></div>
            <div><Label>Fecha y hora *</Label><Input type="datetime-local" {...form.register("fecha")} /></div>
            <div><Label>Duración (min)</Label><Input type="number" {...form.register("duracion_min")} /></div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.watch("tipo")} onValueChange={(v: any) => form.setValue("tipo", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="charla">Charla</SelectItem>
                  <SelectItem value="convivencia">Convivencia</SelectItem>
                  <SelectItem value="retiro">Retiro</SelectItem>
                  <SelectItem value="celebracion">Celebración</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Ponente</Label><Input {...form.register("ponente")} /></div>
            <div className="sm:col-span-2"><Label>Ubicación</Label><Input {...form.register("ubicacion")} /></div>
            <div className="sm:col-span-2"><Label>Descripción</Label><Textarea rows={3} {...form.register("descripcion")} /></div>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={save.isPending}>Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
