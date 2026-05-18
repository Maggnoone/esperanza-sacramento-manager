import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Wallet, Download } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency, formatDate, exportToXLSX, exportToPDF } from "@/lib/export";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useConfirmandosSimple, usePagos, useCostoRetiro } from "@/hooks/use-data";
import type { Confirmando, PaymentMethod } from "@/integrations/supabase/types";

export const Route = createFileRoute("/app/pagos")({ component: PagosPage });

interface BalanceRow extends Pick<Confirmando, "id" | "full_name"> {
  abonado: number;
  pendiente: number;
  pct: number;
}

function PagosPage() {
  const { canSeePagos } = useAuth();
  const qc = useQueryClient();
  const [openCosto, setOpenCosto] = useState(false);
  const [openPago, setOpenPago] = useState(false);
  const [costoMonto, setCostoMonto] = useState("");
  const [pagoForm, setPagoForm] = useState({ confirmando_id: "", monto: "", metodo: "efectivo", referencia: "", fecha: new Date().toISOString().slice(0, 10) });

  if (!canSeePagos) return <Navigate to="/app" />;

  const { data: confirmandos = [] } = useConfirmandosSimple();
  const { data: pagos = [] } = usePagos();
  const { data: costo } = useCostoRetiro();

  const balances = useMemo<BalanceRow[]>(() => {
    const map = new Map<string, number>();
    pagos.forEach((p) => map.set(p.confirmando_id, (map.get(p.confirmando_id) ?? 0) + Number(p.monto)));
    return confirmandos.map((c) => {
      const abonado = map.get(c.id) ?? 0;
      const total = Number(costo?.monto ?? 0);
      return { id: c.id, full_name: c.full_name, abonado, pendiente: Math.max(total - abonado, 0), pct: total ? Math.min(100, (abonado / total) * 100) : 0 };
    });
  }, [pagos, confirmandos, costo]);

  const totalRecaudado = pagos.reduce((s, p) => s + Number(p.monto), 0);
  const metaTotal = Number(costo?.monto ?? 0) * confirmandos.length;
  const pendienteTotal = Math.max(metaTotal - totalRecaudado, 0);

  const saveCosto = useMutation({
    mutationFn: async () => {
      const monto = Number(costoMonto);
      if (!monto || monto < 0) throw new Error("Monto inválido");
      if (costo) {
        const { error } = await supabase.from("costo_retiro").update({ monto }).eq("id", costo.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("costo_retiro").insert({ monto, activo: true });
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Costo actualizado"); qc.invalidateQueries({ queryKey: ["costo-retiro"] }); setOpenCosto(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const savePago = useMutation({
    mutationFn: async () => {
      const monto = Number(pagoForm.monto);
      if (!pagoForm.confirmando_id || !monto || monto <= 0) throw new Error("Datos incompletos");
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("pagos").insert({
        confirmando_id: pagoForm.confirmando_id,
        monto,
        metodo: pagoForm.metodo as PaymentMethod,
        referencia: pagoForm.referencia || null,
        fecha: pagoForm.fecha,
        registered_by: u.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Pago registrado"); qc.invalidateQueries({ queryKey: ["pagos"] }); setOpenPago(false); setPagoForm({ confirmando_id: "", monto: "", metodo: "efectivo", referencia: "", fecha: new Date().toISOString().slice(0, 10) }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleExport = (kind: "xlsx" | "pdf") => {
    const data = balances.map((b) => ({ Confirmando: b.full_name, Total: Number(costo?.monto ?? 0), Abonado: b.abonado, Pendiente: b.pendiente, Cumplimiento: `${Math.round(b.pct)}%` }));
    if (kind === "xlsx") exportToXLSX(data, "pagos-retiro", "Pagos");
    else exportToPDF("Estado de Pagos del Retiro", Object.keys(data[0] ?? { x: 1 }), data.map((d) => Object.values(d) as (string | number)[]), "pagos-retiro", `Recaudado: ${formatCurrency(totalRecaudado)} · Pendiente: ${formatCurrency(pendienteTotal)}`);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Pagos del Retiro</h1>
          <p className="text-sm text-muted-foreground">Control financiero del retiro de confirmación.</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline"><Download className="mr-2 h-4 w-4" />Exportar</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("xlsx")}>Excel</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")}>PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={() => { setCostoMonto(String(costo?.monto ?? "")); setOpenCosto(true); }}>
            <Wallet className="mr-2 h-4 w-4" />Costo: {formatCurrency(costo?.monto ?? 0)}
          </Button>
          <Button onClick={() => setOpenPago(true)}><Plus className="mr-2 h-4 w-4" />Registrar pago</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-soft"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Recaudado</CardTitle></CardHeader><CardContent><div className="font-display text-2xl font-semibold text-success">{formatCurrency(totalRecaudado)}</div></CardContent></Card>
        <Card className="shadow-soft"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pendiente</CardTitle></CardHeader><CardContent><div className="font-display text-2xl font-semibold text-warning">{formatCurrency(pendienteTotal)}</div></CardContent></Card>
        <Card className="shadow-soft"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Meta total</CardTitle></CardHeader><CardContent><div className="font-display text-2xl font-semibold">{formatCurrency(metaTotal)}</div><Progress className="mt-2" value={metaTotal ? (totalRecaudado / metaTotal) * 100 : 0} /></CardContent></Card>
      </div>

      <Card className="shadow-soft">
        <CardHeader><CardTitle className="text-base">Estado por confirmando</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Confirmando</TableHead><TableHead>Abonado</TableHead><TableHead>Pendiente</TableHead><TableHead className="w-48">Cumplimiento</TableHead></TableRow></TableHeader>
            <TableBody>
              {balances.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.full_name}</TableCell>
                  <TableCell>{formatCurrency(b.abonado)}</TableCell>
                  <TableCell className={b.pendiente === 0 ? "text-success font-medium" : "text-warning"}>{formatCurrency(b.pendiente)}</TableCell>
                  <TableCell><div className="flex items-center gap-2"><Progress value={b.pct} className="flex-1" /><span className="text-xs text-muted-foreground w-10 text-right">{Math.round(b.pct)}%</span></div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader><CardTitle className="text-base">Últimas transacciones</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Confirmando</TableHead><TableHead>Monto</TableHead><TableHead>Método</TableHead><TableHead>Referencia</TableHead></TableRow></TableHeader>
            <TableBody>
              {pagos.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Sin pagos registrados</TableCell></TableRow> :
                pagos.slice(0, 50).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatDate(p.fecha)}</TableCell>
                    <TableCell>{p.confirmandos?.full_name}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(p.monto)}</TableCell>
                    <TableCell className="capitalize">{p.metodo}</TableCell>
                    <TableCell className="text-muted-foreground">{p.referencia ?? "—"}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={openCosto} onOpenChange={setOpenCosto}>
        <DialogContent>
          <DialogHeader><DialogTitle>Configurar costo del retiro</DialogTitle></DialogHeader>
          <div className="space-y-2"><Label>Monto por confirmando</Label><Input type="number" value={costoMonto} onChange={(e) => setCostoMonto(e.target.value)} /></div>
          <DialogFooter><Button variant="outline" onClick={() => setOpenCosto(false)}>Cancelar</Button><Button onClick={() => saveCosto.mutate()}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openPago} onOpenChange={setOpenPago}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar pago</DialogTitle></DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Confirmando *</Label>
              <Select value={pagoForm.confirmando_id} onValueChange={(v) => setPagoForm({ ...pagoForm, confirmando_id: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{confirmandos.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Monto *</Label><Input type="number" value={pagoForm.monto} onChange={(e) => setPagoForm({ ...pagoForm, monto: e.target.value })} /></div>
            <div><Label>Fecha</Label><Input type="date" value={pagoForm.fecha} onChange={(e) => setPagoForm({ ...pagoForm, fecha: e.target.value })} /></div>
            <div><Label>Método</Label>
              <Select value={pagoForm.metodo} onValueChange={(v) => setPagoForm({ ...pagoForm, metodo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Referencia</Label><Input value={pagoForm.referencia} onChange={(e) => setPagoForm({ ...pagoForm, referencia: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpenPago(false)}>Cancelar</Button><Button onClick={() => savePago.mutate()}>Registrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
