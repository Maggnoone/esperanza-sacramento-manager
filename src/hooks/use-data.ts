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
  return useQuery<CostoRetiro | null>({
    queryKey: ["costo-retiro"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("costo_retiro")
        .select("*")
        .eq("activo", true)
        .maybeSingle();
      if (error) throw error;
      return data as CostoRetiro | null;
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
