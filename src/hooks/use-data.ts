import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  ConfirmandoWithRelations,
  Confirmando,
  Padrino,
  Charla,
  Grupo,
  Asistencia,
  PagoWithRelations,
  CostoRetiro,
  Profile,
  UserRole,
} from "@/integrations/supabase/types";

/* ── Confirmandos ── */

export function useConfirmandos() {
  return useQuery<ConfirmandoWithRelations[]>({
    queryKey: ["confirmandos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("confirmandos")
        .select("*, grupos(nombre), padrinos(full_name)")
        .order("full_name");
      if (error) throw error;
      return (data ?? []) as ConfirmandoWithRelations[];
    },
  });
}

export function useConfirmandosSimple() {
  return useQuery<Pick<Confirmando, "id" | "full_name">[]>({
    queryKey: ["confirmandos-simple"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("confirmandos")
        .select("id, full_name")
        .order("full_name");
      if (error) throw error;
      return (data ?? []) as Pick<Confirmando, "id" | "full_name">[];
    },
  });
}

export function useConfirmandosActivos() {
  return useQuery<Pick<Confirmando, "id" | "full_name">[]>({
    queryKey: ["confirmandos-activos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("confirmandos")
        .select("id, full_name")
        .neq("status", "baja")
        .order("full_name");
      if (error) throw error;
      return (data ?? []) as Pick<Confirmando, "id" | "full_name">[];
    },
  });
}

/* ── Padrinos ── */

export function usePadrinos() {
  return useQuery<Padrino[]>({
    queryKey: ["padrinos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("padrinos")
        .select("*")
        .order("full_name");
      if (error) throw error;
      return (data ?? []) as Padrino[];
    },
  });
}

export function usePadrinosSimple() {
  return useQuery<Pick<Padrino, "id" | "full_name">[]>({
    queryKey: ["padrinos-simple"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("padrinos")
        .select("id, full_name")
        .order("full_name");
      if (error) throw error;
      return (data ?? []) as Pick<Padrino, "id" | "full_name">[];
    },
  });
}

/* ── Charlas ── */

export function useCharlas() {
  return useQuery<Charla[]>({
    queryKey: ["charlas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("charlas")
        .select("*")
        .order("fecha", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Charla[];
    },
  });
}

export function useCharlasList() {
  return useQuery<Pick<Charla, "id" | "titulo" | "fecha" | "tipo">[]>({
    queryKey: ["charlas-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("charlas")
        .select("id, titulo, fecha, tipo")
        .order("fecha", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Pick<Charla, "id" | "titulo" | "fecha" | "tipo">[];
    },
  });
}

export function useCharlasCalendario() {
  return useQuery<Charla[]>({
    queryKey: ["calendario-charlas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("charlas")
        .select("*")
        .order("fecha");
      if (error) throw error;
      return (data ?? []) as Charla[];
    },
  });
}

/* ── Grupos ── */

export function useGrupos() {
  return useQuery<Grupo[]>({
    queryKey: ["grupos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("grupos").select("*").order("anio", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Grupo[];
    },
  });
}

export function useGruposSimple() {
  return useQuery<Pick<Grupo, "id" | "nombre">[]>({
    queryKey: ["grupos-simple"],
    queryFn: async () => {
      const { data, error } = await supabase.from("grupos").select("id, nombre").order("nombre");
      if (error) throw error;
      return (data ?? []) as Pick<Grupo, "id" | "nombre">[];
    },
  });
}

/* ── Asistencia ── */

export function useAsistencia(charlaId: string) {
  return useQuery<Asistencia[]>({
    queryKey: ["asistencia", charlaId],
    queryFn: async () => {
      if (!charlaId) return [];
      const { data, error } = await supabase
        .from("asistencia")
        .select("*")
        .eq("charla_id", charlaId);
      if (error) throw error;
      return (data ?? []) as Asistencia[];
    },
    enabled: !!charlaId,
  });
}

/* ── Pagos ── */

export function usePagos() {
  return useQuery<PagoWithRelations[]>({
    queryKey: ["pagos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pagos")
        .select("*, confirmandos(full_name)")
        .order("fecha", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PagoWithRelations[];
    },
  });
}

/* ── Costo retiro ── */

export function useCostoRetiro() {
  return useQuery<CostoRetiro[]>({
    queryKey: ["costo-retiro"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("costo_retiro")
        .select("*")
        .eq("activo", true);
      if (error) throw error;
      return (data ?? []) as CostoRetiro[];
    },
  });
}

export function useCostoPorConcepto(concepto: string) {
  return useQuery<CostoRetiro | null>({
    queryKey: ["costo-retiro", concepto],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("costo_retiro")
        .select("*")
        .eq("activo", true)
        .eq("concepto", concepto)
        .maybeSingle();
      if (error) throw error;
      return data as CostoRetiro | null;
    },
  });
}

/* ── Pagos por concepto ── */

export function usePagosPorConcepto(concepto: string) {
  return useQuery<PagoWithRelations[]>({
    queryKey: ["pagos", concepto],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pagos")
        .select("*, confirmandos(full_name)")
        .eq("concepto", concepto)
        .order("fecha", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PagoWithRelations[];
    },
  });
}

/* ── Asistencia resumida ── */

export interface AsistenciaResumen {
  charla_id: string;
  titulo: string;
  fecha: string;
  tipo: string;
  grupo: string | null;
  total_confirmandos: number;
  presentes: number;
  ausentes: number;
  pct: number;
}

export function useAsistenciaResumen() {
  return useQuery<AsistenciaResumen[]>({
    queryKey: ["asistencia-resumen"],
    queryFn: async () => {
      const { data: charlas, error: charlaErr } = await supabase
        .from("charlas")
        .select("*, grupos(nombre)")
        .order("fecha", { ascending: false });
      if (charlaErr) throw charlaErr;

      const { data: asistencia, error: asistErr } = await supabase
        .from("asistencia")
        .select("*");
      if (asistErr) throw asistErr;

      return (charlas ?? []).map((c) => {
        const charla = c as Charla & { grupos: { nombre: string | null } | null };
        const asistencias = (asistencia ?? []).filter((a) => a.charla_id === charla.id);
        const presentes = asistencias.filter((a) => a.presente).length;
        return {
          charla_id: charla.id,
          titulo: charla.titulo,
          fecha: charla.fecha,
          tipo: charla.tipo,
          grupo: charla.grupos?.nombre ?? null,
          total_confirmandos: asistencias.length,
          presentes,
          ausentes: asistencias.length - presentes,
          pct: asistencias.length ? Math.round((presentes / asistencias.length) * 100) : 0,
        };
      });
    },
  });
}

export interface AsistenciaPorConfirmando {
  confirmando_id: string;
  full_name: string;
  grupo: string | null;
  total_sesiones: number;
  asistidas: number;
  ausencias: number;
  pct: number;
}

export function useAsistenciaPorConfirmando() {
  return useQuery<AsistenciaPorConfirmando[]>({
    queryKey: ["asistencia-por-confirmando"],
    queryFn: async () => {
      const { data: confirmandos, error: cErr } = await supabase
        .from("confirmandos")
        .select("id, full_name, group_id, grupos(nombre)")
        .neq("status", "baja")
        .order("full_name");
      if (cErr) throw cErr;

      const { data: charlas, error: chErr } = await supabase
        .from("charlas")
        .select("id, group_id");
      if (chErr) throw chErr;

      const { data: asistencia, error: aErr } = await supabase
        .from("asistencia")
        .select("*");
      if (aErr) throw aErr;

      const charlaMap = new Map((charlas ?? []).map((c) => [c.id, c.group_id]));

      return (confirmandos ?? []).map((c) => {
        const asistencias = (asistencia ?? []).filter(
          (a) => a.confirmando_id === c.id,
        );
        const asistidas = asistencias.filter((a) => a.presente).length;
        // Only count charlas from the same group as the confirmando
        const relevant = asistencias.filter((a) => {
          const charlaGroupId = charlaMap.get(a.charla_id);
          return charlaGroupId === c.group_id || charlaGroupId === null;
        });
        const total = relevant.length;
        const fullName = c.full_name;
        const grupo = (c as unknown as { grupos: { nombre: string | null } | null }).grupos?.nombre ?? null;
        return {
          confirmando_id: c.id,
          full_name: fullName,
          grupo,
          total_sesiones: total,
          asistidas,
          ausencias: total - asistidas,
          pct: total ? Math.round((asistidas / total) * 100) : 0,
        };
      });
    },
  });
}

/* ── Configuración ── */

export function useProfiles() {
  return useQuery<Profile[]>({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("full_name");
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });
}

export function useUserRoles() {
  return useQuery<UserRole[]>({
    queryKey: ["user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return (data ?? []) as UserRole[];
    },
  });
}

/* ── Mutations genéricas (reutilizables) ── */

export function useInvalidateQueries() {
  const qc = useQueryClient();
  return (keys: string[]) => qc.invalidateQueries({ queryKey: keys });
}
