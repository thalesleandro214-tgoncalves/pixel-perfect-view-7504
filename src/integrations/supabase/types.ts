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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      colaboradores: {
        Row: {
          cpf: string | null
          created_at: string
          demo: boolean
          equipe: string
          funcao: string
          id: string
          matricula: string | null
          nome: string
          nome_base: string | null
          status: string
          unidade: string | null
          user_id: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          demo?: boolean
          equipe?: string
          funcao?: string
          id?: string
          matricula?: string | null
          nome: string
          nome_base?: string | null
          status?: string
          unidade?: string | null
          user_id?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string
          demo?: boolean
          equipe?: string
          funcao?: string
          id?: string
          matricula?: string | null
          nome?: string
          nome_base?: string | null
          status?: string
          unidade?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          bonus_percentual_acima_meta: number
          id: number
          meta_caixas_hora: number
          tolerancia_meta: number
          updated_at: string
          valor_por_caixa: number
        }
        Insert: {
          bonus_percentual_acima_meta?: number
          id?: number
          meta_caixas_hora?: number
          tolerancia_meta?: number
          updated_at?: string
          valor_por_caixa?: number
        }
        Update: {
          bonus_percentual_acima_meta?: number
          id?: number
          meta_caixas_hora?: number
          tolerancia_meta?: number
          updated_at?: string
          valor_por_caixa?: number
        }
        Relationships: []
      }
      importacoes: {
        Row: {
          arquivo: string
          atualizados: number
          created_at: string
          erros: Json
          id: string
          inalterados: number
          inseridos: number
          invalidos: number
          total_linhas: number
          usuario_id: string | null
        }
        Insert: {
          arquivo: string
          atualizados?: number
          created_at?: string
          erros?: Json
          id?: string
          inalterados?: number
          inseridos?: number
          invalidos?: number
          total_linhas?: number
          usuario_id?: string | null
        }
        Update: {
          arquivo?: string
          atualizados?: number
          created_at?: string
          erros?: Json
          id?: string
          inalterados?: number
          inseridos?: number
          invalidos?: number
          total_linhas?: number
          usuario_id?: string | null
        }
        Relationships: []
      }
      produtividade: {
        Row: {
          acumulado_periodo: number
          caixas_por_hora: number
          caixas_produzidas: number
          colaborador_id: string
          created_at: string
          cx_m: number
          cxh_media_periodo: number
          data: string
          duracao_operacao: string | null
          horas_trabalhadas: number
          id: string
          importacao_id: string | null
          inicio_montagem: string | null
          lp_duplo: number
          minutos: number
          mistos: number
          pagamento_diario: number
          paletes_total: number
          termino_montagem: string | null
          total_container: number
          total_container_rs: number
          total_gav: number
          total_gaveta_rs: number
          total_mistos_lp: number
          total_mistos_rs: number
          unidade: string | null
          valor_container: number
          valor_gaveta: number
          valor_gerado: number
          valor_mistos: number
        }
        Insert: {
          acumulado_periodo?: number
          caixas_por_hora?: number
          caixas_produzidas: number
          colaborador_id: string
          created_at?: string
          cx_m?: number
          cxh_media_periodo?: number
          data: string
          duracao_operacao?: string | null
          horas_trabalhadas: number
          id?: string
          importacao_id?: string | null
          inicio_montagem?: string | null
          lp_duplo?: number
          minutos?: number
          mistos?: number
          pagamento_diario?: number
          paletes_total?: number
          termino_montagem?: string | null
          total_container?: number
          total_container_rs?: number
          total_gav?: number
          total_gaveta_rs?: number
          total_mistos_lp?: number
          total_mistos_rs?: number
          unidade?: string | null
          valor_container?: number
          valor_gaveta?: number
          valor_gerado?: number
          valor_mistos?: number
        }
        Update: {
          acumulado_periodo?: number
          caixas_por_hora?: number
          caixas_produzidas?: number
          colaborador_id?: string
          created_at?: string
          cx_m?: number
          cxh_media_periodo?: number
          data?: string
          duracao_operacao?: string | null
          horas_trabalhadas?: number
          id?: string
          importacao_id?: string | null
          inicio_montagem?: string | null
          lp_duplo?: number
          minutos?: number
          mistos?: number
          pagamento_diario?: number
          paletes_total?: number
          termino_montagem?: string | null
          total_container?: number
          total_container_rs?: number
          total_gav?: number
          total_gaveta_rs?: number
          total_mistos_lp?: number
          total_mistos_rs?: number
          unidade?: string | null
          valor_container?: number
          valor_gaveta?: number
          valor_gerado?: number
          valor_mistos?: number
        }
        Relationships: [
          {
            foreignKeyName: "produtividade_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      minha_posicao_ranking: {
        Args: { _fim: string; _inicio: string }
        Returns: {
          posicao: number
          total: number
        }[]
      }
      recalcular_produtividade: { Args: never; Returns: number }
    }
    Enums: {
      app_role: "admin" | "auxiliar"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "auxiliar"],
    },
  },
} as const
