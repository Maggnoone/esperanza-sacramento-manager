import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Wallet, Download } from "lucide-react";
import { TableSkeleton } from "@/components/TableSkeleton";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency, formatDate, exportToXLSX, exportToPDF } from "@/lib/export";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useConfirmandosSimple, usePagos, useCostoPorConcepto } from "@/hooks/use-data";
import type { Confirmando, PaymentMethod } from "@/integrations/supabase/types";
import { buildBalance, buildTotals } from "@/lib/balances";

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

  const { data: confirmandos = [], isLoading: loadingConfirmandos } = useConfirmandosSimple();
  const { data: pagos = [], isLoading: loadingPagos } = usePagos();
  const { data: costoRetiro } = useCostoPorConcepto("retiro");

  const retiroMonto = Number(costoRetiro?.monto ?? 0);

  const balances = useMemo<BalanceRow[]>(
    () => buildBalance(pagos, confirmandos, retiroMonto),
    [pagos, confirmandos, retiroMonto]
  );

  const { totalRecaudado, metaTotal, pendienteTotal } = useMemo(
    () => buildTotals(balances, retiroMonto, confirmandos.length),
    [balances, retiroMonto, confirmandos.length]
  );

  const saveCosto = useMutation({
    mutationFn: async () => {
      const monto = Number(costoMonto);
      if (!monto || monto < 0) throw new Error("Monto inválido");
      if (costoRetiro) {
        const { error } = await supabase.from("costo_retiro").update({ monto }).eq("id", costoRetiro.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("costo_retiro").insert({ monto, activo: true, concepto: "retiro" });
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
    const data = balances.map((b) => ({ Confirmando: b.full_name, Total: costoMonto, Abonado: b.abonado, Pendiente: b.pendiente, Cumplimiento: `${Math.round(b.pct)}%` }));
    if (kind === "xlsx") exportToXLSX(data, "pagos-retiro", "Pagos");
    else exportToPDF("Estado de Pagos del Retiro", Object.keys(data[0] ?? { x: 1 }), data.map((d) => Object.values(d) as (string | number)[]), "pagos-retiro", `Recaudado: ${formatCurrency(totalRecaudado)} · Pendiente: ${formatCurrency(pendienteTotal)}`);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Pagos del Retiro</h1>
          <p className="text-sm text-muted-foreground">Control financiero del retiro de confirmación.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline"><Download className="mr-2 h-4 w-4" />Exportar</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("xlsx")}>Excel</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")}>PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={() => { setCostoMonto(String(costoRetiro?.monto ?? "")); setOpenCosto(true); }}>
            <Wallet className="mr-2 h-4 w-4" />Costo: {formatCurrency(costoRetiro?.monto ?? 0)}
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
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Confirmando</TableHead><TableHead>Abonado</TableHead><TableHead>Pendiente</TableHead><TableHead className="min-w-[12rem]">Cumplimiento</TableHead></TableRow></TableHeader>
              <TableBody>
                {loadingConfirmandos ? (
                  <TableRow><TableCell colSpan={4} className="py-0"><TableSkeleton cols={4} rows={5} /></TableCell></TableRow>
                ) : balances.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No hay confirmandos registrados.</TableCell></TableRow>
                ) : (
                  balances.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.full_name}</TableCell>
                      <TableCell>{formatCurrency(b.abonado)}</TableCell>
                      <TableCell className={b.pendiente === 0 ? "text-success font-medium" : "text-warning"}>{formatCurrency(b.pendiente)}</TableCell>
                      <TableCell><div className="flex items-center gap-2"><Progress value={b.pct} className="flex-1" /><span className="text-xs text-muted-foreground w-10 text-right">{Math.round(b.pct)}%</span></div></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {loadingConfirmandos ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="shadow-soft"><CardContent className="p-4 space-y-2"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /></CardContent></Card>
              ))
            ) : balances.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">No hay confirmandos registrados.</p>
            ) : (
              balances.map((b) => (
                <Card key={b.id} className="shadow-soft">
                  <CardContent className="p-4 space-y-2">
                    <span className="font-semibold">{b.full_name}</span>
                    <div className="flex items-start justify-between gap-2 text-sm"><span className="text-muted-foreground">Abonado</span><span>{formatCurrency(b.abonado)}</span></div>
                    <div className="flex items-start justify-between gap-2 text-sm"><span className="text-muted-foreground">Pendiente</span><span className={b.pendiente === 0 ? "text-success font-medium" : "text-warning"}>{formatCurrency(b.pendiente)}</span></div>
                    <div className="flex items-center gap-2 text-sm"><Progress value={b.pct} className="flex-1" /><span className="text-xs text-muted-foreground w-10 text-right">{Math.round(b.pct)}%</span></div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader><CardTitle className="text-base">Últimas transacciones</CardTitle></CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Confirmando</TableHead><TableHead>Monto</TableHead><TableHead>Método</TableHead><TableHead>Referencia</TableHead></TableRow></TableHeader>
              <TableBody>
                {loadingPagos ? (
                  <TableRow><TableCell colSpan={5} className="py-0"><TableSkeleton cols={5} rows={5} /></TableCell></TableRow>
                ) : pagos.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Sin pagos registrados</TableCell></TableRow>
                ) : (
                  pagos.slice(0, 50).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{formatDate(p.fecha)}</TableCell>
                      <TableCell>{p.confirmandos?.full_name}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(p.monto)}</TableCell>
                      <TableCell className="capitalize">{p.metodo}</TableCell>
                      <TableCell className="text-muted-foreground">{p.referencia ?? "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {loadingPagos ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="shadow-soft"><CardContent className="p-4 space-y-2"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /></CardContent></Card>
              ))
            ) : pagos.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">Sin pagos registrados</p>
            ) : (
              pagos.slice(0, 20).map((p) => (
                <Card key={p.id} className="shadow-soft">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{formatCurrency(p.monto)}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(p.fecha)}</span>
                    </div>
                    <div className="flex items-start justify-between gap-2 text-sm"><span className="text-muted-foreground">Confirmando</span><span>{p.confirmandos?.full_name}</span></div>
                    <div className="flex items-start justify-between gap-2 text-sm"><span className="text-muted-foreground">Método</span><span className="capitalize">{p.metodo}</span></div>
                    <div className="flex items-start justify-between gap-2 text-sm"><span className="text-muted-foreground">Referencia</span><span className="text-muted-foreground">{p.referencia ?? "—"}</span></div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <ResponsiveDialog open={openCosto} onOpenChange={setOpenCosto} title="Configurar costo del retiro">
        <div className="space-y-2"><Label>Monto por confirmando</Label><Input type="number" value={costoMonto} onChange={(e) => setCostoMonto(e.target.value)} /></div>
        <div className="flex flex-wrap gap-2 justify-end mt-4">
          <Button variant="outline" onClick={() => setOpenCosto(false)}>Cancelar</Button>
          <Button onClick={() => saveCosto.mutate()}>Guardar</Button>
        </div>
      </ResponsiveDialog>

      <ResponsiveDialog open={openPago} onOpenChange={setOpenPago} title="Registrar pago">
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
        <div className="flex flex-wrap gap-2 justify-end mt-4">
          <Button variant="outline" onClick={() => setOpenPago(false)}>Cancelar</Button>
          <Button onClick={() => savePago.mutate()}>Registrar</Button>
        </div>
      </ResponsiveDialog>
    </div>
  );
}
