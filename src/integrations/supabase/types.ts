export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      asistencia: {
        Row: {
          charla_id: string
          confirmando_id: string
          created_at: string
          id: string
          notas: string | null
          presente: boolean
          registered_by: string | null
          updated_at: string
        }
        Insert: {
          charla_id: string
          confirmando_id: string
          created_at?: string
          id?: string
          notas?: string | null
          presente?: boolean
          registered_by?: string | null
          updated_at?: string
        }
        Update: {
          charla_id?: string
          confirmando_id?: string
          created_at?: string
          id?: string
          notas?: string | null
          presente?: boolean
          registered_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asistencia_charla_id_fkey"
            columns: ["charla_id"]
            isOneToOne: false
            referencedRelation: "charlas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asistencia_confirmando_id_fkey"
            columns: ["confirmando_id"]
            isOneToOne: false
            referencedRelation: "confirmandos"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      charlas: {
        Row: {
          created_at: string
          descripcion: string | null
          duracion_min: number | null
          fecha: string
          group_id: string | null
          id: string
          ponente: string | null
          tipo: Database["public"]["Enums"]["session_type"]
          titulo: string
          ubicacion: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          duracion_min?: number | null
          fecha: string
          group_id?: string | null
          id?: string
          ponente?: string | null
          tipo?: Database["public"]["Enums"]["session_type"]
          titulo: string
          ubicacion?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          duracion_min?: number | null
          fecha?: string
          group_id?: string | null
          id?: string
          ponente?: string | null
          tipo?: Database["public"]["Enums"]["session_type"]
          titulo?: string
          ubicacion?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "charlas_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
        ]
      }
      confirmandos: {
        Row: {
          contacto_padres: string | null
          created_at: string
          direccion: string | null
          dni: string | null
          email: string | null
          fecha_bautismo: string | null
          fecha_comunion: string | null
          fecha_confirmacion: string | null
          fecha_nacimiento: string | null
          full_name: string
          group_id: string | null
          has_baptism: boolean
          has_communion: boolean
          id: string
          nombre_madre: string | null
          nombre_padre: string | null
          notas: string | null
          padrino_id: string | null
          parroquia_bautismo: string | null
          status: Database["public"]["Enums"]["confirmando_status"]
          telefono: string | null
          updated_at: string
        }
        Insert: {
          contacto_padres?: string | null
          created_at?: string
          direccion?: string | null
          dni?: string | null
          email?: string | null
          fecha_bautismo?: string | null
          fecha_comunion?: string | null
          fecha_confirmacion?: string | null
          fecha_nacimiento?: string | null
          full_name: string
          group_id?: string | null
          has_baptism?: boolean
          has_communion?: boolean
          id?: string
          nombre_madre?: string | null
          nombre_padre?: string | null
          notas?: string | null
          padrino_id?: string | null
          parroquia_bautismo?: string | null
          status?: Database["public"]["Enums"]["confirmando_status"]
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          contacto_padres?: string | null
          created_at?: string
          direccion?: string | null
          dni?: string | null
          email?: string | null
          fecha_bautismo?: string | null
          fecha_comunion?: string | null
          fecha_confirmacion?: string | null
          fecha_nacimiento?: string | null
          full_name?: string
          group_id?: string | null
          has_baptism?: boolean
          has_communion?: boolean
          id?: string
          nombre_madre?: string | null
          nombre_padre?: string | null
          notas?: string | null
          padrino_id?: string | null
          parroquia_bautismo?: string | null
          status?: Database["public"]["Enums"]["confirmando_status"]
          telefono?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "confirmandos_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confirmandos_padrino_id_fkey"
            columns: ["padrino_id"]
            isOneToOne: false
            referencedRelation: "padrinos"
            referencedColumns: ["id"]
          },
        ]
      }
      costo_retiro: {
        Row: {
          activo: boolean
          created_at: string
          descripcion: string
          id: string
          monto: number
        }
        Insert: {
          activo?: boolean
          created_at?: string
          descripcion?: string
          id?: string
          monto?: number
        }
        Update: {
          activo?: boolean
          created_at?: string
          descripcion?: string
          id?: string
          monto?: number
        }
        Relationships: []
      }
      grupos: {
        Row: {
          anio: number
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
        }
        Insert: {
          anio: number
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
        }
        Update: {
          anio?: number
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      materiales: {
        Row: {
          charla_id: string | null
          created_at: string
          descripcion: string | null
          id: string
          tipo: string
          titulo: string
          url: string
        }
        Insert: {
          charla_id?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          tipo?: string
          titulo: string
          url: string
        }
        Update: {
          charla_id?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          tipo?: string
          titulo?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "materiales_charla_id_fkey"
            columns: ["charla_id"]
            isOneToOne: false
            referencedRelation: "charlas"
            referencedColumns: ["id"]
          },
        ]
      }
      padrinos: {
        Row: {
          created_at: string
          dni: string | null
          email: string | null
          full_name: string
          has_confirmation: boolean
          id: string
          is_married_church: boolean | null
          notas: string | null
          parentesco: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dni?: string | null
          email?: string | null
          full_name: string
          has_confirmation?: boolean
          id?: string
          is_married_church?: boolean | null
          notas?: string | null
          parentesco?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dni?: string | null
          email?: string | null
          full_name?: string
          has_confirmation?: boolean
          id?: string
          is_married_church?: boolean | null
          notas?: string | null
          parentesco?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pagos: {
        Row: {
          confirmando_id: string
          created_at: string
          fecha: string
          id: string
          metodo: Database["public"]["Enums"]["payment_method"]
          monto: number
          notas: string | null
          referencia: string | null
          registered_by: string | null
        }
        Insert: {
          confirmando_id: string
          created_at?: string
          fecha?: string
          id?: string
          metodo?: Database["public"]["Enums"]["payment_method"]
          monto: number
          notas?: string | null
          referencia?: string | null
          registered_by?: string | null
        }
        Update: {
          confirmando_id?: string
          created_at?: string
          fecha?: string
          id?: string
          metodo?: Database["public"]["Enums"]["payment_method"]
          monto?: number
          notas?: string | null
          referencia?: string | null
          registered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pagos_confirmando_id_fkey"
            columns: ["confirmando_id"]
            isOneToOne: false
            referencedRelation: "confirmandos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_any_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "catequista" | "tesorero"
      confirmando_status: "activo" | "apto" | "confirmado" | "baja"
      payment_method: "efectivo" | "transferencia" | "tarjeta"
      session_type: "charla" | "convivencia" | "retiro" | "celebracion"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "catequista", "tesorero"],
      confirmando_status: ["activo", "apto", "confirmado", "baja"],
      payment_method: ["efectivo", "transferencia", "tarjeta"],
      session_type: ["charla", "convivencia", "retiro", "celebracion"],
    },
  },
} as const
