import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { DeleteDialog } from "@/components/DeleteDialog";
import { TableSkeleton } from "@/components/TableSkeleton";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useGrupos, useProfiles, useUserRoles } from "@/hooks/use-data";
import type { UserRole, AppRole, GrupoInsert } from "@/integrations/supabase/types";

export const Route = createFileRoute("/app/configuracion")({ component: ConfigPage });

function ConfigPage() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [openGrupo, setOpenGrupo] = useState(false);
  const [grupoForm, setGrupoForm] = useState({ nombre: "", anio: new Date().getFullYear(), descripcion: "" });
  const [openRol, setOpenRol] = useState(false);
  const [rolForm, setRolForm] = useState({ user_id: "", role: "catequista" as AppRole });

  if (!isAdmin) return <Navigate to="/app" />;

  const { data: grupos = [], isLoading: loadingGrupos } = useGrupos();
  const { data: profiles = [], isLoading: loadingProfiles } = useProfiles();
  const { data: roles = [] } = useUserRoles();

  const rolesByUser = roles.reduce<Record<string, string[]>>((acc, r) => { (acc[r.user_id] ||= []).push(r.role); return acc; }, {});

  const saveGrupo = useMutation({
    mutationFn: async () => {
      const payload: GrupoInsert = { nombre: grupoForm.nombre, anio: Number(grupoForm.anio), descripcion: grupoForm.descripcion || null };
      const { error } = await supabase.from("grupos").insert(payload); if (error) throw error;
    },
    onSuccess: () => { toast.success("Grupo creado"); qc.invalidateQueries({ queryKey: ["grupos"] }); setOpenGrupo(false); setGrupoForm({ nombre: "", anio: new Date().getFullYear(), descripcion: "" }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveRol = useMutation({
    mutationFn: async () => {
      const payload: UserRole = { user_id: rolForm.user_id, role: rolForm.role, id: "", created_at: "" };
      const { error } = await supabase.from("user_roles").insert(payload); if (error) throw error;
    },
    onSuccess: () => { toast.success("Rol asignado"); qc.invalidateQueries({ queryKey: ["user-roles"] }); setOpenRol(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeRol = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("user_roles").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Eliminado"); qc.invalidateQueries({ queryKey: ["user-roles"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Configuración</h1>
        <p className="text-sm text-muted-foreground">Solo administradores. Gestiona grupos y permisos.</p>
      </div>

      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between">
          <div><CardTitle className="text-base">Grupos / Promociones</CardTitle><CardDescription>Organiza los confirmandos por grupo de catequesis.</CardDescription></div>
          <Button size="sm" onClick={() => setOpenGrupo(true)}><Plus className="mr-2 h-4 w-4" />Nuevo grupo</Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Año</TableHead><TableHead>Descripción</TableHead></TableRow></TableHeader>
              <TableBody>
                {loadingGrupos ? (
                  <TableRow><TableCell colSpan={3} className="py-0"><TableSkeleton cols={3} rows={3} /></TableCell></TableRow>
                ) : grupos.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">No hay grupos creados.</TableCell></TableRow>
                ) : (
                  grupos.map((g) => <TableRow key={g.id}><TableCell className="font-medium">{g.nombre}</TableCell><TableCell>{g.anio}</TableCell><TableCell className="text-muted-foreground">{g.descripcion ?? "—"}</TableCell></TableRow>)
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between">
          <div><CardTitle className="text-base">Usuarios y roles</CardTitle><CardDescription>Asigna roles: admin, catequista o tesorero.</CardDescription></div>
          <Button size="sm" onClick={() => setOpenRol(true)}><Plus className="mr-2 h-4 w-4" />Asignar rol</Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Usuario</TableHead><TableHead>Email</TableHead><TableHead>Roles</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>
                {loadingProfiles ? (
                  <TableRow><TableCell colSpan={4} className="py-0"><TableSkeleton cols={4} rows={3} /></TableCell></TableRow>
                ) : profiles.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No hay usuarios registrados.</TableCell></TableRow>
                ) : (
                  profiles.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.full_name || "—"}</TableCell>
                      <TableCell>{p.email}</TableCell>
                      <TableCell><div className="flex gap-1 flex-wrap">{(rolesByUser[p.id] ?? []).map((r) => <Badge key={r} variant="secondary">{r}</Badge>)}</div></TableCell>
                      <TableCell className="text-right">
                        {roles.filter((r) => r.user_id === p.id).map((r) => (
                          <DeleteDialog
                            key={r.id}
                            title={`¿Quitar rol "${r.role}"?`}
                            description={`Se eliminará el rol de ${p.full_name || p.email}.`}
                            trigger={
                              <Button size="icon" variant="ghost" title={`Quitar ${r.role}`} aria-label={`Quitar rol ${r.role} a ${p.full_name || p.email}`} disabled={removeRol.isPending}>
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            }
                            onConfirm={() => removeRol.mutate(r.id)}
                            isPending={removeRol.isPending}
                          />
                        ))}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={openGrupo} onOpenChange={setOpenGrupo}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo grupo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nombre *</Label><Input value={grupoForm.nombre} onChange={(e) => setGrupoForm({ ...grupoForm, nombre: e.target.value })} /></div>
            <div><Label>Año</Label><Input type="number" value={grupoForm.anio} onChange={(e) => setGrupoForm({ ...grupoForm, anio: Number(e.target.value) })} /></div>
            <div><Label>Descripción</Label><Input value={grupoForm.descripcion} onChange={(e) => setGrupoForm({ ...grupoForm, descripcion: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpenGrupo(false)}>Cancelar</Button><Button onClick={() => saveGrupo.mutate()}>Crear</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openRol} onOpenChange={setOpenRol}>
        <DialogContent>
          <DialogHeader><DialogTitle>Asignar rol</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Usuario</Label>
              <Select value={rolForm.user_id} onValueChange={(v) => setRolForm({ ...rolForm, user_id: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.email}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Rol</Label>
              <Select value={rolForm.role} onValueChange={(v) => setRolForm({ ...rolForm, role: v as AppRole })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="catequista">Catequista</SelectItem>
                  <SelectItem value="tesorero">Tesorero</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpenRol(false)}>Cancelar</Button><Button onClick={() => saveRol.mutate()}>Asignar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
