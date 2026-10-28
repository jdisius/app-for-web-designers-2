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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      briefs: {
        Row: {
          budget: number
          created_at: string
          customer_id: string
          deadline: string
          description: string
          id: string
          image_url: string
          status: Database["public"]["Enums"]["brief_status"]
        }
        Insert: {
          budget: number
          created_at?: string
          customer_id: string
          deadline: string
          description: string
          id?: string
          image_url: string
          status?: Database["public"]["Enums"]["brief_status"]
        }
        Update: {
          budget?: number
          created_at?: string
          customer_id?: string
          deadline?: string
          description?: string
          id?: string
          image_url?: string
          status?: Database["public"]["Enums"]["brief_status"]
        }
        Relationships: [
          {
            foreignKeyName: "briefs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          selection_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          selection_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          selection_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_selection_id_fkey"
            columns: ["selection_id"]
            isOneToOne: false
            referencedRelation: "selections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_items: {
        Row: {
          created_at: string
          designer_id: string
          id: string
          image_url: string
          title: string | null
        }
        Insert: {
          created_at?: string
          designer_id: string
          id?: string
          image_url: string
          title?: string | null
        }
        Update: {
          created_at?: string
          designer_id?: string
          id?: string
          image_url?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_designer_id_fkey"
            columns: ["designer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string
          created_at: string
          id: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          bio?: string
          created_at?: string
          id: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          bio?: string
          created_at?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      selections: {
        Row: {
          brief_id: string
          created_at: string
          designer_id: string
          id: string
        }
        Insert: {
          brief_id: string
          created_at?: string
          designer_id: string
          id?: string
        }
        Update: {
          brief_id?: string
          created_at?: string
          designer_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "selections_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: true
            referencedRelation: "briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "selections_designer_id_fkey"
            columns: ["designer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      swipes: {
        Row: {
          brief_id: string
          created_at: string
          designer_id: string
          liked: boolean
        }
        Insert: {
          brief_id: string
          created_at?: string
          designer_id: string
          liked: boolean
        }
        Update: {
          brief_id?: string
          created_at?: string
          designer_id?: string
          liked?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "swipes_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swipes_designer_id_fkey"
            columns: ["designer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      brief_status: "open" | "taken"
      user_role: "designer" | "customer"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      brief_status: ["open", "taken"],
      user_role: ["designer", "customer"],
    },
  },
} as const
