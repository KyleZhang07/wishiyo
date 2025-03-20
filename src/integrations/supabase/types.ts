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
          timestamp?: string | null
          title?: string | null
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
