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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, Download, Pencil, Trash2, FileSpreadsheet, FileText, FileType } from "lucide-react";
import { toast } from "sonner";
import { exportToCSV, exportToPDF, exportToXLSX } from "@/lib/export";
import { useAuth } from "@/hooks/use-auth";
import { useConfirmandos, useGruposSimple, usePadrinosSimple } from "@/hooks/use-data";
import type { ConfirmandoWithRelations, ConfirmandoInsert, ConfirmandoStatus } from "@/integrations/supabase/types";

export const Route = createFileRoute("/app/confirmandos")({
  component: ConfirmandosPage,
});

const schema = z.object({
  full_name: z.string().trim().min(2).max(120),
  dni: z.string().trim().max(20).optional().or(z.literal("")),
  fecha_nacimiento: z.string().optional().or(z.literal("")),
  telefono: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  direccion: z.string().trim().max(255).optional().or(z.literal("")),
  nombre_padre: z.string().trim().max(120).optional().or(z.literal("")),
  nombre_madre: z.string().trim().max(120).optional().or(z.literal("")),
  contacto_padres: z.string().trim().max(60).optional().or(z.literal("")),
  has_baptism: z.boolean(),
  has_communion: z.boolean(),
  status: z.enum(["activo", "apto", "confirmado", "baja"]),
  group_id: z.string().uuid().optional().or(z.literal("")),
  padrino_id: z.string().uuid().optional().or(z.literal("")),
  notas: z.string().max(1000).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

function ConfirmandosPage() {
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ConfirmandoWithRelations | null>(null);

  const { data: rows = [], isLoading } = useConfirmandos();
  const { data: grupos = [] } = useGruposSimple();
  const { data: padrinos = [] } = usePadrinosSimple();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", has_baptism: false, has_communion: false, status: "activo" },
  });

  const openNew = () => {
    setEditing(null);
    form.reset({ full_name: "", has_baptism: false, has_communion: false, status: "activo", dni: "", telefono: "", email: "", direccion: "", nombre_padre: "", nombre_madre: "", contacto_padres: "", group_id: "", padrino_id: "", notas: "", fecha_nacimiento: "" });
    setOpen(true);
  };

  const openEdit = (r: ConfirmandoWithRelations) => {
    setEditing(r);
    form.reset({
      full_name: r.full_name ?? "",
      dni: r.dni ?? "",
      fecha_nacimiento: r.fecha_nacimiento ?? "",
      telefono: r.telefono ?? "",
      email: r.email ?? "",
      direccion: r.direccion ?? "",
      nombre_padre: r.nombre_padre ?? "",
      nombre_madre: r.nombre_madre ?? "",
      contacto_padres: r.contacto_padres ?? "",
      has_baptism: !!r.has_baptism,
      has_communion: !!r.has_communion,
      status: r.status ?? "activo",
      group_id: r.group_id ?? "",
      padrino_id: r.padrino_id ?? "",
      notas: r.notas ?? "",
    });
    setOpen(true);
  };

  const buildPayload = (values: FormValues): ConfirmandoInsert => ({
    full_name: values.full_name,
    dni: values.dni || null,
    fecha_nacimiento: values.fecha_nacimiento || null,
    telefono: values.telefono || null,
    email: values.email || null,
    direccion: values.direccion || null,
    nombre_padre: values.nombre_padre || null,
    nombre_madre: values.nombre_madre || null,
    contacto_padres: values.contacto_padres || null,
    has_baptism: values.has_baptism,
    has_communion: values.has_communion,
    status: values.status as ConfirmandoStatus,
    group_id: values.group_id || null,
    padrino_id: values.padrino_id || null,
    notas: values.notas || null,
  });

  const save = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = buildPayload(values);
      if (editing) {
        const { error } = await supabase.from("confirmandos").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("confirmandos").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Confirmando actualizado" : "Confirmando creado");
      qc.invalidateQueries({ queryKey: ["confirmandos"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("confirmandos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Eliminado");
      qc.invalidateQueries({ queryKey: ["confirmandos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = rows.filter((r) => {
    const s = search.toLowerCase();
    const matchSearch = !s || r.full_name?.toLowerCase().includes(s) || (r.dni ?? "").toLowerCase().includes(s);
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const exportData = () =>
    filtered.map((r) => ({
      Nombre: r.full_name,
      DNI: r.dni ?? "",
      Grupo: r.grupos?.nombre ?? "",
      Padrino: r.padrinos?.full_name ?? "",
      Bautismo: r.has_baptism ? "Sí" : "No",
      Comunión: r.has_communion ? "Sí" : "No",
      Estado: r.status,
      Teléfono: r.telefono ?? "",
      Email: r.email ?? "",
    }));

  const handleExport = (kind: "csv" | "xlsx" | "pdf") => {
    const data = exportData();
    if (!data.length) return toast.warning("No hay datos para exportar");
    if (kind === "csv") exportToCSV(data, "confirmandos");
    else if (kind === "xlsx") exportToXLSX(data, "confirmandos", "Confirmandos");
    else
      exportToPDF(
        "Listado de Confirmandos",
        Object.keys(data[0]),
        data.map((d) => Object.values(d) as (string | number)[]),
        "confirmandos",
        `Total: ${data.length} registros`,
      );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Confirmandos</h1>
          <p className="text-sm text-muted-foreground">Gestión completa de los jóvenes en formación.</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline"><Download className="mr-2 h-4 w-4" />Exportar</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("xlsx")}><FileSpreadsheet className="mr-2 h-4 w-4" />Excel (.xlsx)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")}><FileText className="mr-2 h-4 w-4" />PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("csv")}><FileType className="mr-2 h-4 w-4" />CSV</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nuevo</Button>
        </div>
      </div>

      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base">Total: {filtered.length}</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o DNI" className="w-64 pl-8" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="apto">Apto</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Padrino</TableHead>
                  <TableHead>Sacramentos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Cargando…</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Sin registros</TableCell></TableRow>
                ) : filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.full_name}</TableCell>
                    <TableCell>{r.dni ?? "—"}</TableCell>
                    <TableCell>{r.grupos?.nombre ?? "—"}</TableCell>
                    <TableCell>{r.padrinos?.full_name ?? <span className="text-muted-foreground">Sin asignar</span>}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Badge variant={r.has_baptism ? "default" : "outline"}>B</Badge>
                        <Badge variant={r.has_communion ? "default" : "outline"}>C</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.status === "confirmado" ? "default" : r.status === "apto" ? "secondary" : "outline"}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                      {isAdmin && (
                        <Button size="icon" variant="ghost" onClick={() => confirm(`¿Eliminar a ${r.full_name}?`) && remove.mutate(r.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Editar confirmando" : "Nuevo confirmando"}</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Nombre completo *</Label><Input {...form.register("full_name")} /></div>
            <div><Label>DNI</Label><Input {...form.register("dni")} /></div>
            <div><Label>Fecha nacimiento</Label><Input type="date" {...form.register("fecha_nacimiento")} /></div>
            <div><Label>Teléfono</Label><Input {...form.register("telefono")} /></div>
            <div><Label>Email</Label><Input type="email" {...form.register("email")} /></div>
            <div className="sm:col-span-2"><Label>Dirección</Label><Input {...form.register("direccion")} /></div>
            <div><Label>Padre</Label><Input {...form.register("nombre_padre")} /></div>
            <div><Label>Madre</Label><Input {...form.register("nombre_madre")} /></div>
            <div className="sm:col-span-2"><Label>Contacto de padres</Label><Input {...form.register("contacto_padres")} /></div>
            <div>
              <Label>Grupo</Label>
              <Select value={form.watch("group_id") || ""} onValueChange={(v) => form.setValue("group_id", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{grupos.map((g) => <SelectItem key={g.id} value={g.id}>{g.nombre}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Padrino/Madrina</Label>
              <Select value={form.watch("padrino_id") || ""} onValueChange={(v) => form.setValue("padrino_id", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{padrinos.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Checkbox id="bap" checked={form.watch("has_baptism")} onCheckedChange={(c) => form.setValue("has_baptism", !!c)} />
              <Label htmlFor="bap">Bautizado</Label>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Checkbox id="com" checked={form.watch("has_communion")} onCheckedChange={(c) => form.setValue("has_communion", !!c)} />
              <Label htmlFor="com">Primera comunión</Label>
            </div>
            <div className="sm:col-span-2">
              <Label>Estado</Label>
              <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as ConfirmandoStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="apto">Apto (requiere bautismo)</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={save.isPending}>{save.isPending ? "Guardando…" : "Guardar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
