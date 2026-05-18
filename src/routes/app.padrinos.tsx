import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { exportToXLSX } from "@/lib/export";
import { useAuth } from "@/hooks/use-auth";
import { usePadrinos } from "@/hooks/use-data";
import type { Padrino, PadrinoInsert } from "@/integrations/supabase/types";

export const Route = createFileRoute("/app/padrinos")({ component: PadrinosPage });

const schema = z.object({
  full_name: z.string().trim().min(2).max(120),
  dni: z.string().max(20).optional().or(z.literal("")),
  telefono: z.string().max(30).optional().or(z.literal("")),
  email: z.string().email().max(255).optional().or(z.literal("")),
  parentesco: z.string().max(60).optional().or(z.literal("")),
  has_confirmation: z.boolean(),
  is_married_church: z.boolean().optional(),
  notas: z.string().max(500).optional().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

function PadrinosPage() {
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Padrino | null>(null);

  const { data: rows = [] } = usePadrinos();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", has_confirmation: true, is_married_church: false },
  });

  const openNew = () => { setEditing(null); form.reset({ full_name: "", has_confirmation: true, is_married_church: false, dni: "", telefono: "", email: "", parentesco: "", notas: "" }); setOpen(true); };
  const openEdit = (r: Padrino) => { setEditing(r); form.reset({ ...r, dni: r.dni ?? "", telefono: r.telefono ?? "", email: r.email ?? "", parentesco: r.parentesco ?? "", notas: r.notas ?? "", is_married_church: !!r.is_married_church }); setOpen(true); };

  const buildPayload = (v: FormValues): PadrinoInsert => ({
    full_name: v.full_name,
    dni: v.dni || null,
    telefono: v.telefono || null,
    email: v.email || null,
    parentesco: v.parentesco || null,
    has_confirmation: v.has_confirmation,
    is_married_church: v.is_married_church ?? false,
    notas: v.notas || null,
  });

  const save = useMutation({
    mutationFn: async (v: FormValues) => {
      const payload = buildPayload(v);
      const { error } = editing
        ? await supabase.from("padrinos").update(payload).eq("id", editing.id)
        : await supabase.from("padrinos").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Guardado"); qc.invalidateQueries({ queryKey: ["padrinos"] }); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("padrinos").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Eliminado"); qc.invalidateQueries({ queryKey: ["padrinos"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Padrinos y Madrinas</h1>
          <p className="text-sm text-muted-foreground">Registro completo de padrinos disponibles.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportToXLSX(rows.map((r) => ({ Nombre: r.full_name, DNI: r.dni, Teléfono: r.telefono, Email: r.email, Parentesco: r.parentesco, Confirmado: r.has_confirmation ? "Sí" : "No" })), "padrinos")}>
            <Download className="mr-2 h-4 w-4" />Exportar
          </Button>
          <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nuevo</Button>
        </div>
      </div>

      <Card className="shadow-soft">
        <CardHeader><CardTitle className="text-base">{rows.length} padrinos registrados</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>DNI</TableHead><TableHead>Teléfono</TableHead><TableHead>Parentesco</TableHead><TableHead>Confirmado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Sin registros</TableCell></TableRow>
              ) : rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.full_name}</TableCell>
                  <TableCell>{r.dni ?? "—"}</TableCell>
                  <TableCell>{r.telefono ?? "—"}</TableCell>
                  <TableCell>{r.parentesco ?? "—"}</TableCell>
                  <TableCell>{r.has_confirmation ? "Sí" : "No"}</TableCell>
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
          <DialogHeader><DialogTitle>{editing ? "Editar padrino" : "Nuevo padrino"}</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Nombre completo *</Label><Input {...form.register("full_name")} /></div>
            <div><Label>DNI</Label><Input {...form.register("dni")} /></div>
            <div><Label>Parentesco</Label><Input {...form.register("parentesco")} placeholder="Tío, abuela..." /></div>
            <div><Label>Teléfono</Label><Input {...form.register("telefono")} /></div>
            <div><Label>Email</Label><Input type="email" {...form.register("email")} /></div>
            <div className="flex items-center gap-2"><Checkbox id="conf" checked={form.watch("has_confirmation")} onCheckedChange={(c) => form.setValue("has_confirmation", !!c)} /><Label htmlFor="conf">Está confirmado</Label></div>
            <div className="flex items-center gap-2"><Checkbox id="mar" checked={!!form.watch("is_married_church")} onCheckedChange={(c) => form.setValue("is_married_church", !!c)} /><Label htmlFor="mar">Casado por iglesia</Label></div>
            <div className="sm:col-span-2"><Label>Notas</Label><Input {...form.register("notas")} /></div>
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
