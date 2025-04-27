export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      funny_biography_books: {
        Row: {
          answers: Json | null
          author: string
          binding_type: string | null
          book_content: Json | null
          book_size: string | null
          chapters: Json | null
          client_id: string | null
          cover_pdf: string | null
          cover_source_url: string | null
          customer_email: string | null
          id: number
          ideas: Json | null
          images: Json | null
          interior_pdf: string | null
          interior_source_url: string | null
          is_color: boolean | null
          last_print_attempt: string | null
          lulu_print_job_id: string | null
          lulu_print_status: string | null
          lulu_tracking_number: string | null
          lulu_tracking_url: string | null
          order_id: string
          page_count: number | null
          paper_type: string | null
          pod_package_id: string | null
          print_attempts: number | null
          print_date: string | null
          print_quantity: number | null
          ready_for_printing: boolean | null
          recipient_phone: string | null
          selected_idea: Json | null
          shipping_address: Json | null
          shipping_level: string | null
          shipping_option: Json | null
          status: string | null
          style: Json | null
          timestamp: string | null
          title: string
        }
        Insert: {
          answers?: Json | null
          author: string
          binding_type?: string | null
          book_content?: Json | null
          book_size?: string | null
          chapters?: Json | null
          client_id?: string | null
          cover_pdf?: string | null
          cover_source_url?: string | null
          customer_email?: string | null
          id?: number
          ideas?: Json | null
          images?: Json | null
          interior_pdf?: string | null
          interior_source_url?: string | null
          is_color?: boolean | null
          last_print_attempt?: string | null
          lulu_print_job_id?: string | null
          lulu_print_status?: string | null
          lulu_tracking_number?: string | null
          lulu_tracking_url?: string | null
          order_id: string
          page_count?: number | null
          paper_type?: string | null
          pod_package_id?: string | null
          print_attempts?: number | null
          print_date?: string | null
          print_quantity?: number | null
          ready_for_printing?: boolean | null
          recipient_phone?: string | null
          selected_idea?: Json | null
          shipping_address?: Json | null
          shipping_level?: string | null
          shipping_option?: Json | null
          status?: string | null
          style?: Json | null
          timestamp?: string | null
          title: string
        }
        Update: {
          answers?: Json | null
          author?: string
          binding_type?: string | null
          book_content?: Json | null
          book_size?: string | null
          chapters?: Json | null
          client_id?: string | null
          cover_pdf?: string | null
          cover_source_url?: string | null
          customer_email?: string | null
          id?: number
          ideas?: Json | null
          images?: Json | null
          interior_pdf?: string | null
          interior_source_url?: string | null
          is_color?: boolean | null
          last_print_attempt?: string | null
          lulu_print_job_id?: string | null
          lulu_print_status?: string | null
          lulu_tracking_number?: string | null
          lulu_tracking_url?: string | null
          order_id?: string
          page_count?: number | null
          paper_type?: string | null
          pod_package_id?: string | null
          print_attempts?: number | null
          print_date?: string | null
          print_quantity?: number | null
          ready_for_printing?: boolean | null
          recipient_phone?: string | null
          selected_idea?: Json | null
          shipping_address?: Json | null
          shipping_level?: string | null
          shipping_option?: Json | null
          status?: string | null
          style?: Json | null
          timestamp?: string | null
          title?: string
        }
        Relationships: []
      }
      love_story_books: {
        Row: {
          binding_type: string | null
          book_size: string | null
          client_id: string | null
          cover_pdf: string | null
          cover_source_url: string | null
          customer_email: string | null
          id: number
          interior_pdf: string | null
          interior_source_url: string | null
          is_color: boolean | null
          last_print_attempt: string | null
          lulu_print_job_id: string | null
          lulu_print_status: string | null
          lulu_tracking_number: string | null
          lulu_tracking_url: string | null
          order_id: string
          page_count: number | null
          paper_type: string | null
          person_name: string | null
          pod_package_id: string | null
          print_attempts: number | null
          print_date: string | null
          print_quantity: number | null
          ready_for_printing: boolean | null
          recipient_phone: string | null
          shipping_address: Json | null
          shipping_level: string | null
          shipping_option: Json | null
          status: string | null
          style: string | null
          timestamp: string | null
          title: string | null
        }
        Insert: {
          binding_type?: string | null
          book_size?: string | null
          client_id?: string | null
          cover_pdf?: string | null
          cover_source_url?: string | null
          customer_email?: string | null
          id?: number
          interior_pdf?: string | null
          interior_source_url?: string | null
          is_color?: boolean | null
          last_print_attempt?: string | null
          lulu_print_job_id?: string | null
          lulu_print_status?: string | null
          lulu_tracking_number?: string | null
          lulu_tracking_url?: string | null
          order_id: string
          page_count?: number | null
          paper_type?: string | null
          person_name?: string | null
          pod_package_id?: string | null
          print_attempts?: number | null
          print_date?: string | null
          print_quantity?: number | null
          ready_for_printing?: boolean | null
          recipient_phone?: string | null
          shipping_address?: Json | null
          shipping_level?: string | null
          shipping_option?: Json | null
          status?: string | null
          style?: string | null
          timestamp?: string | null
          title?: string | null
        }
        Update: {
          binding_type?: string | null
          book_size?: string | null
          client_id?: string | null
          cover_pdf?: string | null
          cover_source_url?: string | null
          customer_email?: string | null
          id?: number
          interior_pdf?: string | null
          interior_source_url?: string | null
          is_color?: boolean | null
          last_print_attempt?: string | null
          lulu_print_job_id?: string | null
          lulu_print_status?: string | null
          lulu_tracking_number?: string | null
          lulu_tracking_url?: string | null
          order_id?: string
          page_count?: number | null
          paper_type?: string | null
          person_name?: string | null
          pod_package_id?: string | null
          print_attempts?: number | null
          print_date?: string | null
          print_quantity?: number | null
          ready_for_printing?: boolean | null
          recipient_phone?: string | null
          shipping_address?: Json | null
          shipping_level?: string | null
          shipping_option?: Json | null
          status?: string | null
          style?: string | null
          timestamp?: string | null
          title?: string | null
        }
        Relationships: []
      }
      order_notifications: {
        Row: {
          created_at: string | null
          email: string
          id: number
          order_id: string
          sent_at: string
          status: string
          type: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: number
          order_id: string
          sent_at: string
          status: string
          type: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: number
          order_id?: string
          sent_at?: string
          status?: string
          type?: string
        }
        Relationships: []
      }
      order_verifications: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          is_used: boolean
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          is_used?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          is_used?: boolean
        }
        Relationships: []
      }
      promotion_codes: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          discount_type: string
          discount_value: number
          end_date: string
          id: number
          is_active: boolean | null
          max_discount_amount: number | null
          min_purchase_amount: number | null
          product_type: string | null
          start_date: string
          stripe_coupon_id: string | null
          stripe_promotion_code_id: string | null
          updated_at: string | null
          usage_count: number | null
          usage_limit: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          end_date: string
          id?: number
          is_active?: boolean | null
          max_discount_amount?: number | null
          min_purchase_amount?: number | null
          product_type?: string | null
          start_date: string
          stripe_coupon_id?: string | null
          stripe_promotion_code_id?: string | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          end_date?: string
          id?: number
          is_active?: boolean | null
          max_discount_amount?: number | null
          min_purchase_amount?: number | null
          product_type?: string | null
          start_date?: string
          stripe_coupon_id?: string | null
          stripe_promotion_code_id?: string | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
