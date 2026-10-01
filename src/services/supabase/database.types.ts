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
      match_events: {
        Row: {
          blue_score: number
          created_at: string
          event_type: string
          id: string
          match_id: string
          match_time_seconds: number
          metadata: Json
          occurred_at: string
          owner_id: string
          penalty_scored: boolean | null
          period: string
          period_time_seconds: number
          sequence: number
          team: string | null
          white_score: number
        }
        Insert: {
          blue_score: number
          created_at?: string
          event_type: string
          id?: string
          match_id: string
          match_time_seconds: number
          metadata?: Json
          occurred_at: string
          owner_id?: string
          penalty_scored?: boolean | null
          period: string
          period_time_seconds: number
          sequence: number
          team?: string | null
          white_score: number
        }
        Update: {
          blue_score?: number
          created_at?: string
          event_type?: string
          id?: string
          match_id?: string
          match_time_seconds?: number
          metadata?: Json
          occurred_at?: string
          owner_id?: string
          penalty_scored?: boolean | null
          period?: string
          period_time_seconds?: number
          sequence?: number
          team?: string | null
          white_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_events_match_id_owner_id_fkey"
            columns: ["match_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id", "owner_id"]
          },
        ]
      }
      match_participants: {
        Row: {
          created_at: string
          id: string
          match_id: string
          owner_id: string
          player_id: string
          player_name: string
          position: number
          team: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          owner_id?: string
          player_id: string
          player_name: string
          position: number
          team: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          owner_id?: string
          player_id?: string
          player_name?: string
          position?: number
          team?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_participants_match_id_owner_id_fkey"
            columns: ["match_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id", "owner_id"]
          },
          {
            foreignKeyName: "match_participants_player_id_owner_id_fkey"
            columns: ["player_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id", "owner_id"]
          },
        ]
      }
      matches: {
        Row: {
          blue_score: number
          created_at: string
          engine_version: number
          finished_at: string
          goal_limit: number
          id: string
          match_type: string
          owner_id: string
          payload_hash: string
          penalty_blue_attempts: number | null
          penalty_blue_score: number | null
          penalty_white_attempts: number | null
          penalty_white_score: number | null
          started_at: string
          status: string
          test_mode: boolean
          time_limit_seconds: number
          updated_at: string
          victory_condition: string
          went_to_extra_time: boolean
          went_to_penalties: boolean
          white_score: number
          winner_team: string | null
        }
        Insert: {
          blue_score: number
          created_at?: string
          engine_version?: number
          finished_at: string
          goal_limit: number
          id: string
          match_type: string
          owner_id?: string
          payload_hash: string
          penalty_blue_attempts?: number | null
          penalty_blue_score?: number | null
          penalty_white_attempts?: number | null
          penalty_white_score?: number | null
          started_at: string
          status: string
          test_mode?: boolean
          time_limit_seconds: number
          updated_at?: string
          victory_condition: string
          went_to_extra_time: boolean
          went_to_penalties: boolean
          white_score: number
          winner_team?: string | null
        }
        Update: {
          blue_score?: number
          created_at?: string
          engine_version?: number
          finished_at?: string
          goal_limit?: number
          id?: string
          match_type?: string
          owner_id?: string
          payload_hash?: string
          penalty_blue_attempts?: number | null
          penalty_blue_score?: number | null
          penalty_white_attempts?: number | null
          penalty_white_score?: number | null
          started_at?: string
          status?: string
          test_mode?: boolean
          time_limit_seconds?: number
          updated_at?: string
          victory_condition?: string
          went_to_extra_time?: boolean
          went_to_penalties?: boolean
          white_score?: number
          winner_team?: string | null
        }
        Relationships: []
      }
      players: {
        Row: {
          active: boolean
          classified_matches: number
          created_at: string
          elo: number
          id: string
          level: number
          max_elo: number
          name: string
          nickname: string | null
          owner_id: string
          photo_url: string | null
          updated_at: string
          xp: number
        }
        Insert: {
          active?: boolean
          classified_matches?: number
          created_at?: string
          elo?: number
          id?: string
          level?: number
          max_elo?: number
          name: string
          nickname?: string | null
          owner_id?: string
          photo_url?: string | null
          updated_at?: string
          xp?: number
        }
        Update: {
          active?: boolean
          classified_matches?: number
          created_at?: string
          elo?: number
          id?: string
          level?: number
          max_elo?: number
          name?: string
          nickname?: string | null
          owner_id?: string
          photo_url?: string | null
          updated_at?: string
          xp?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      save_match_v1: { Args: { document: Json }; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
