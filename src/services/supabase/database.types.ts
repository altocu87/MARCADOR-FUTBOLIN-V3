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
      elo_rules_v1: {
        Row: {
          category_thresholds: number[] | null
          eligible_from: string | null
          enabled: boolean
          established_k: number | null
          hysteresis: number | null
          initial_elo: number
          margin_multipliers: number[] | null
          provisional_k: number | null
          provisional_matches: number | null
          rounding: string | null
          singleton: boolean
          version: number
        }
        Insert: {
          category_thresholds?: number[] | null
          eligible_from?: string | null
          enabled?: boolean
          established_k?: number | null
          hysteresis?: number | null
          initial_elo?: number
          margin_multipliers?: number[] | null
          provisional_k?: number | null
          provisional_matches?: number | null
          rounding?: string | null
          singleton?: boolean
          version: number
        }
        Update: {
          category_thresholds?: number[] | null
          eligible_from?: string | null
          enabled?: boolean
          established_k?: number | null
          hysteresis?: number | null
          initial_elo?: number
          margin_multipliers?: number[] | null
          provisional_k?: number | null
          provisional_matches?: number | null
          rounding?: string | null
          singleton?: boolean
          version?: number
        }
        Relationships: []
      }
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
            referencedRelation: "player_achievement_tiers_v1"
            referencedColumns: ["player_id", "owner_id"]
          },
          {
            foreignKeyName: "match_participants_player_id_owner_id_fkey"
            columns: ["player_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "player_honour_results_v1"
            referencedColumns: ["player_id", "owner_id"]
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
      xp_rules_v1: {
        Row: {
          complete: number
          draw: number
          eligible_from: string | null
          enabled: boolean
          extra_time_win: number
          loss: number
          penalties_win: number
          ranked_win: number
          singleton: boolean
          thresholds: number[]
          version: number
          win: number
        }
        Insert: {
          complete: number
          draw: number
          eligible_from?: string | null
          enabled?: boolean
          extra_time_win: number
          loss: number
          penalties_win: number
          ranked_win: number
          singleton?: boolean
          thresholds: number[]
          version: number
          win: number
        }
        Update: {
          complete?: number
          draw?: number
          eligible_from?: string | null
          enabled?: boolean
          extra_time_win?: number
          loss?: number
          penalties_win?: number
          ranked_win?: number
          singleton?: boolean
          thresholds?: number[]
          version?: number
          win?: number
        }
        Relationships: []
      }
    }
    Views: {
      player_achievement_tiers_v1: {
        Row: {
          family: string | null
          finished_at: string | null
          granted_xp: number | null
          match_id: string | null
          owner_id: string | null
          player_id: string | null
          threshold: number | null
          tier: number | null
          tier_xp: number | null
          value: number | null
        }
        Relationships: []
      }
      player_honour_results_v1: {
        Row: {
          best_streak: number | null
          clean_win: number | null
          extra_win: number | null
          finished_at: string | null
          ga: number | null
          gap: number | null
          gf: number | null
          match_id: string | null
          match_type: string | null
          owner_id: string | null
          penalty_win: number | null
          played: number | null
          player_id: string | null
          ranked_played: number | null
          ranked_wins: number | null
          streak: number | null
          team_goals: number | null
          went_to_extra_time: boolean | null
          went_to_penalties: boolean | null
          wins: number | null
          won: boolean | null
        }
        Relationships: []
      }
      player_progression_v1: {
        Row: {
          achievement_xp: number | null
          active: boolean | null
          base_xp: number | null
          confirmed_matches: number | null
          current_threshold: number | null
          enabled: boolean | null
          id: string | null
          level: number | null
          max_level: number | null
          name: string | null
          next_threshold: number | null
          nickname: string | null
          photo_url: string | null
          rules_version: number | null
          xp: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_competition_snapshot_v1: { Args: never; Returns: Json }
      get_honours_snapshot_v1: { Args: never; Returns: Json }
      get_ranking_v1: {
        Args: never
        Returns: {
          active: boolean
          category: string
          classified_matches: number
          elo: number
          enabled: boolean
          max_elo: number
          name: string
          nickname: string
          player_id: string
          ranking_position: number
          rules_version: number
        }[]
      }
      save_match_v1: { Args: { document: Json }; Returns: string }
      valid_elo_settings_v1: {
        Args: { multipliers: number[]; thresholds: number[] }
        Returns: boolean
      }
      valid_xp_thresholds_v1: {
        Args: { values_array: number[] }
        Returns: boolean
      }
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
