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
      admin_audit_log: {
        Row: {
          action: string
          admin_handle: string | null
          admin_user_id: string
          created_at: string | null
          id: string
          new_value: Json | null
          previous_value: Json | null
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          admin_handle?: string | null
          admin_user_id: string
          created_at?: string | null
          id?: string
          new_value?: Json | null
          previous_value?: Json | null
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          admin_handle?: string | null
          admin_user_id?: string
          created_at?: string | null
          id?: string
          new_value?: Json | null
          previous_value?: Json | null
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      campaign_subscriptions: {
        Row: {
          created_at: string
          customer_email: string
          expires_at: string | null
          id: string
          last_error: string | null
          last_scraped_at: string | null
          project_link: string
          project_name: string
          scrape_count: number | null
          screenshot_url: string | null
          status: string
          stripe_subscription_id: string
          tasks_imported_count: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email: string
          expires_at?: string | null
          id?: string
          last_error?: string | null
          last_scraped_at?: string | null
          project_link: string
          project_name: string
          scrape_count?: number | null
          screenshot_url?: string | null
          status?: string
          stripe_subscription_id: string
          tasks_imported_count?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string
          expires_at?: string | null
          id?: string
          last_error?: string | null
          last_scraped_at?: string | null
          project_link?: string
          project_name?: string
          scrape_count?: number | null
          screenshot_url?: string | null
          status?: string
          stripe_subscription_id?: string
          tasks_imported_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string | null
          id: string
          updated_at: string | null
          user_type: string | null
          wallet_address: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_type?: string | null
          wallet_address: string
        }
        Update: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_type?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      community_submissions: {
        Row: {
          compensation: string | null
          created_at: string | null
          description: string
          duplicate_of: string | null
          id: string
          link: string
          og_image: string | null
          points_awarded: number | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          role_tags: string[] | null
          status: string | null
          submission_type: string
          submitter_wallet: string
          submitter_x_user_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          compensation?: string | null
          created_at?: string | null
          description: string
          duplicate_of?: string | null
          id?: string
          link: string
          og_image?: string | null
          points_awarded?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role_tags?: string[] | null
          status?: string | null
          submission_type: string
          submitter_wallet: string
          submitter_x_user_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          compensation?: string | null
          created_at?: string | null
          description?: string
          duplicate_of?: string | null
          id?: string
          link?: string
          og_image?: string | null
          points_awarded?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role_tags?: string[] | null
          status?: string | null
          submission_type?: string
          submitter_wallet?: string
          submitter_x_user_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      jobs: {
        Row: {
          apply_url: string | null
          company_name: string | null
          compensation: string | null
          created_at: string | null
          deadline: string | null
          description: string
          employer_wallet: string
          expires_at: string | null
          external_id: string | null
          id: string
          link: string | null
          og_image: string | null
          opportunity_type: string | null
          payment_tx_signature: string
          requirements: string | null
          role_tags: string[] | null
          skill_category_ids: string[] | null
          solana_pay_reference: string | null
          source: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          apply_url?: string | null
          company_name?: string | null
          compensation?: string | null
          created_at?: string | null
          deadline?: string | null
          description: string
          employer_wallet: string
          expires_at?: string | null
          external_id?: string | null
          id?: string
          link?: string | null
          og_image?: string | null
          opportunity_type?: string | null
          payment_tx_signature: string
          requirements?: string | null
          role_tags?: string[] | null
          skill_category_ids?: string[] | null
          solana_pay_reference?: string | null
          source?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          apply_url?: string | null
          company_name?: string | null
          compensation?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string
          employer_wallet?: string
          expires_at?: string | null
          external_id?: string | null
          id?: string
          link?: string | null
          og_image?: string | null
          opportunity_type?: string | null
          payment_tx_signature?: string
          requirements?: string | null
          role_tags?: string[] | null
          skill_category_ids?: string[] | null
          solana_pay_reference?: string | null
          source?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_references: {
        Row: {
          amount: number
          created_at: string
          id: string
          memo: string | null
          payer: string
          payment_type: string
          reference: string
          status: string
          tx_signature: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          memo?: string | null
          payer: string
          payment_type?: string
          reference: string
          status?: string
          tx_signature?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          memo?: string | null
          payer?: string
          payment_type?: string
          reference?: string
          status?: string
          tx_signature?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      points_transactions: {
        Row: {
          created_at: string | null
          id: string
          payment_token_amount: number | null
          payment_token_mint: string | null
          points: number
          sol_amount: number | null
          solana_pay_reference: string | null
          submission_id: string | null
          transaction_type: string
          tx_signature: string | null
          wallet_address: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          payment_token_amount?: number | null
          payment_token_mint?: string | null
          points: number
          sol_amount?: number | null
          solana_pay_reference?: string | null
          submission_id?: string | null
          transaction_type: string
          tx_signature?: string | null
          wallet_address: string
        }
        Update: {
          created_at?: string | null
          id?: string
          payment_token_amount?: number | null
          payment_token_mint?: string | null
          points?: number
          sol_amount?: number | null
          solana_pay_reference?: string | null
          submission_id?: string | null
          transaction_type?: string
          tx_signature?: string | null
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_transactions_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "community_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_clicks: {
        Row: {
          click_date: string
          clicked_at: string
          id: string
          ip_hash: string
          points_awarded: boolean
          referral_code: string
          session_id: string
          source_url: string | null
          target_path: string | null
          user_agent_hash: string | null
        }
        Insert: {
          click_date?: string
          clicked_at?: string
          id?: string
          ip_hash: string
          points_awarded?: boolean
          referral_code: string
          session_id: string
          source_url?: string | null
          target_path?: string | null
          user_agent_hash?: string | null
        }
        Update: {
          click_date?: string
          clicked_at?: string
          id?: string
          ip_hash?: string
          points_awarded?: boolean
          referral_code?: string
          session_id?: string
          source_url?: string | null
          target_path?: string | null
          user_agent_hash?: string | null
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          referral_code: string
          wallet_address: string
          x_user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          referral_code: string
          wallet_address: string
          x_user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          referral_code?: string
          wallet_address?: string
          x_user_id?: string | null
        }
        Relationships: []
      }
      referral_conversions: {
        Row: {
          click_id: string | null
          conversion_type: string
          converted_wallet: string
          created_at: string
          id: string
          payment_amount: number | null
          points_awarded: number
          referral_code: string
        }
        Insert: {
          click_id?: string | null
          conversion_type: string
          converted_wallet: string
          created_at?: string
          id?: string
          payment_amount?: number | null
          points_awarded: number
          referral_code: string
        }
        Update: {
          click_id?: string | null
          conversion_type?: string
          converted_wallet?: string
          created_at?: string
          id?: string
          payment_amount?: number | null
          points_awarded?: number
          referral_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_conversions_click_id_fkey"
            columns: ["click_id"]
            isOneToOne: false
            referencedRelation: "referral_clicks"
            referencedColumns: ["id"]
          },
        ]
      }
      rei_registry: {
        Row: {
          analysis_summary: string | null
          consent: boolean
          created_at: string
          display_name: string | null
          file_path: string
          handle: string | null
          id: string
          nft_mint_address: string | null
          nft_minted: boolean | null
          portfolio_url: string | null
          profile_analysis: Json | null
          profile_image_url: string | null
          profile_score: number | null
          role_tags: Database["public"]["Enums"]["contributor_role"][] | null
          skill_category_ids: string[] | null
          updated_at: string
          verified: boolean | null
          wallet_address: string
          x_user_id: string | null
        }
        Insert: {
          analysis_summary?: string | null
          consent?: boolean
          created_at?: string
          display_name?: string | null
          file_path: string
          handle?: string | null
          id?: string
          nft_mint_address?: string | null
          nft_minted?: boolean | null
          portfolio_url?: string | null
          profile_analysis?: Json | null
          profile_image_url?: string | null
          profile_score?: number | null
          role_tags?: Database["public"]["Enums"]["contributor_role"][] | null
          skill_category_ids?: string[] | null
          updated_at?: string
          verified?: boolean | null
          wallet_address: string
          x_user_id?: string | null
        }
        Update: {
          analysis_summary?: string | null
          consent?: boolean
          created_at?: string
          display_name?: string | null
          file_path?: string
          handle?: string | null
          id?: string
          nft_mint_address?: string | null
          nft_minted?: boolean | null
          portfolio_url?: string | null
          profile_analysis?: Json | null
          profile_image_url?: string | null
          profile_score?: number | null
          role_tags?: Database["public"]["Enums"]["contributor_role"][] | null
          skill_category_ids?: string[] | null
          updated_at?: string
          verified?: boolean | null
          wallet_address?: string
          x_user_id?: string | null
        }
        Relationships: []
      }
      rei_treasury_wallet: {
        Row: {
          balance_sol: number | null
          id: string
          last_updated_at: string | null
          total_distributed: number | null
          wallet_address: string
        }
        Insert: {
          balance_sol?: number | null
          id?: string
          last_updated_at?: string | null
          total_distributed?: number | null
          wallet_address: string
        }
        Update: {
          balance_sol?: number | null
          id?: string
          last_updated_at?: string | null
          total_distributed?: number | null
          wallet_address?: string
        }
        Relationships: []
      }
      skill_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          job_count: number | null
          keywords: string[] | null
          name: string
          parent_category_id: string | null
          talent_count: number | null
          task_count: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          job_count?: number | null
          keywords?: string[] | null
          name: string
          parent_category_id?: string | null
          talent_count?: number | null
          task_count?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          job_count?: number | null
          keywords?: string[] | null
          name?: string
          parent_category_id?: string | null
          talent_count?: number | null
          task_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "skill_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          customer_email: string | null
          environment: string
          id: string
          metadata: Json | null
          price_id: string | null
          product_id: string | null
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          customer_email?: string | null
          environment?: string
          id?: string
          metadata?: Json | null
          price_id?: string | null
          product_id?: string | null
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          customer_email?: string | null
          environment?: string
          id?: string
          metadata?: Json | null
          price_id?: string | null
          product_id?: string | null
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      talent_views: {
        Row: {
          employer_wallet: string
          id: string
          payment_tx_signature: string
          talent_x_user_id: string
          viewed_at: string | null
        }
        Insert: {
          employer_wallet: string
          id?: string
          payment_tx_signature: string
          talent_x_user_id: string
          viewed_at?: string | null
        }
        Update: {
          employer_wallet?: string
          id?: string
          payment_tx_signature?: string
          talent_x_user_id?: string
          viewed_at?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          campaign_subscription_id: string | null
          company_name: string | null
          compensation: string | null
          created_at: string | null
          description: string
          employer_wallet: string
          end_date: string | null
          external_id: string | null
          id: string
          link: string
          og_image: string | null
          opportunity_type: string | null
          payment_tx_signature: string
          role_tags: string[] | null
          skill_category_ids: string[] | null
          solana_pay_reference: string | null
          source: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          campaign_subscription_id?: string | null
          company_name?: string | null
          compensation?: string | null
          created_at?: string | null
          description: string
          employer_wallet: string
          end_date?: string | null
          external_id?: string | null
          id?: string
          link: string
          og_image?: string | null
          opportunity_type?: string | null
          payment_tx_signature: string
          role_tags?: string[] | null
          skill_category_ids?: string[] | null
          solana_pay_reference?: string | null
          source?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          campaign_subscription_id?: string | null
          company_name?: string | null
          compensation?: string | null
          created_at?: string | null
          description?: string
          employer_wallet?: string
          end_date?: string | null
          external_id?: string | null
          id?: string
          link?: string
          og_image?: string | null
          opportunity_type?: string | null
          payment_tx_signature?: string
          role_tags?: string[] | null
          skill_category_ids?: string[] | null
          solana_pay_reference?: string | null
          source?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_campaign_subscription_id_fkey"
            columns: ["campaign_subscription_id"]
            isOneToOne: false
            referencedRelation: "campaign_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      twitter_whitelist: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          twitter_handle: string
          twitter_user_id: string | null
          updated_at: string | null
          verification_type: Database["public"]["Enums"]["verification_type"]
          verified_by: string | null
          welcome_dm_sent: boolean | null
          welcome_dm_sent_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          twitter_handle: string
          twitter_user_id?: string | null
          updated_at?: string | null
          verification_type: Database["public"]["Enums"]["verification_type"]
          verified_by?: string | null
          welcome_dm_sent?: boolean | null
          welcome_dm_sent_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          twitter_handle?: string
          twitter_user_id?: string | null
          updated_at?: string | null
          verification_type?: Database["public"]["Enums"]["verification_type"]
          verified_by?: string | null
          welcome_dm_sent?: boolean | null
          welcome_dm_sent_at?: string | null
        }
        Relationships: []
      }
      twitter_whitelist_submissions: {
        Row: {
          contact_email: string | null
          display_name: string | null
          dm_sent: boolean | null
          dm_sent_at: string | null
          id: string
          notes: string | null
          profile_image_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          twitter_handle: string
          x_user_id: string | null
        }
        Insert: {
          contact_email?: string | null
          display_name?: string | null
          dm_sent?: boolean | null
          dm_sent_at?: string | null
          id?: string
          notes?: string | null
          profile_image_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          twitter_handle: string
          x_user_id?: string | null
        }
        Update: {
          contact_email?: string | null
          display_name?: string | null
          dm_sent?: boolean | null
          dm_sent_at?: string | null
          id?: string
          notes?: string | null
          profile_image_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          twitter_handle?: string
          x_user_id?: string | null
        }
        Relationships: []
      }
      user_points: {
        Row: {
          created_at: string | null
          id: string
          lifetime_earnings_sol: number | null
          points_pending: number | null
          total_points: number | null
          updated_at: string | null
          wallet_address: string
          x_user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lifetime_earnings_sol?: number | null
          points_pending?: number | null
          total_points?: number | null
          updated_at?: string | null
          wallet_address: string
          x_user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lifetime_earnings_sol?: number | null
          points_pending?: number | null
          total_points?: number | null
          updated_at?: string | null
          wallet_address?: string
          x_user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      increment_user_points: {
        Args: {
          p_points: number
          p_wallet_address: string
          p_x_user_id?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      contributor_role:
        | "dev"
        | "product"
        | "research"
        | "community"
        | "design"
        | "ops"
      verification_type:
        | "followed_by_web3_project"
        | "kol"
        | "thought_leader"
        | "web3_founder"
        | "manual"
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
      app_role: ["admin", "moderator", "user"],
      contributor_role: [
        "dev",
        "product",
        "research",
        "community",
        "design",
        "ops",
      ],
      verification_type: [
        "followed_by_web3_project",
        "kol",
        "thought_leader",
        "web3_founder",
        "manual",
      ],
    },
  },
} as const
