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
      booking_messages: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          message: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          message: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_reviews: {
        Row: {
          booking_id: string
          categories: Json | null
          content: string
          created_at: string
          id: string
          is_public: boolean | null
          rating: number
          review_type: string
          reviewee_id: string
          reviewer_id: string
          title: string | null
        }
        Insert: {
          booking_id: string
          categories?: Json | null
          content: string
          created_at?: string
          id?: string
          is_public?: boolean | null
          rating: number
          review_type: string
          reviewee_id: string
          reviewer_id: string
          title?: string | null
        }
        Update: {
          booking_id?: string
          categories?: Json | null
          content?: string
          created_at?: string
          id?: string
          is_public?: boolean | null
          rating?: number
          review_type?: string
          reviewee_id?: string
          reviewer_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          accepted_at: string | null
          cancelled_at: string | null
          check_in_date: string
          check_out_date: string
          completed_at: string | null
          confirmed_at: string | null
          created_at: string
          estimated_arrival_time: string | null
          guest_id: string
          guest_phone: string | null
          guests_count: number
          host_id: string
          host_response_deadline: string
          host_response_message: string | null
          id: string
          points_cost: number
          property_id: string
          race_id: string
          rejected_at: string | null
          request_message: string | null
          special_requests: string | null
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          cancelled_at?: string | null
          check_in_date: string
          check_out_date: string
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          estimated_arrival_time?: string | null
          guest_id: string
          guest_phone?: string | null
          guests_count?: number
          host_id: string
          host_response_deadline: string
          host_response_message?: string | null
          id?: string
          points_cost: number
          property_id: string
          race_id: string
          rejected_at?: string | null
          request_message?: string | null
          special_requests?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          cancelled_at?: string | null
          check_in_date?: string
          check_out_date?: string
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          estimated_arrival_time?: string | null
          guest_id?: string
          guest_phone?: string | null
          guests_count?: number
          host_id?: string
          host_response_deadline?: string
          host_response_message?: string | null
          id?: string
          points_cost?: number
          property_id?: string
          race_id?: string
          rejected_at?: string | null
          request_message?: string | null
          special_requests?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      houses: {
        Row: {
          address: string
          amenities: string[] | null
          bathrooms: number
          bedrooms: number
          city: string
          country: string
          created_at: string | null
          description: string | null
          house_rules: string | null
          id: string
          images: string[] | null
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          max_guests: number
          owner_id: string
          running_routes: string | null
          running_tips: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          address: string
          amenities?: string[] | null
          bathrooms?: number
          bedrooms?: number
          city: string
          country: string
          created_at?: string | null
          description?: string | null
          house_rules?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          max_guests?: number
          owner_id: string
          running_routes?: string | null
          running_tips?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          address?: string
          amenities?: string[] | null
          bathrooms?: number
          bedrooms?: number
          city?: string
          country?: string
          created_at?: string | null
          description?: string | null
          house_rules?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          max_guests?: number
          owner_id?: string
          running_routes?: string | null
          running_tips?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "houses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      points_transactions: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          description: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          average_rating: number | null
          badges: string[] | null
          bio: string | null
          birth_date: string | null
          created_at: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string | null
          id: string
          is_guest: boolean | null
          is_host: boolean | null
          last_name: string | null
          personal_records: Json | null
          phone: string | null
          points_balance: number | null
          preferred_distances: string[] | null
          profile_image_url: string | null
          races_completed_this_year: number | null
          running_experience: string | null
          running_modalities: string[] | null
          total_guest_experiences: number | null
          total_host_experiences: number | null
          updated_at: string | null
          verification_documents: string[] | null
          verification_status: string | null
        }
        Insert: {
          average_rating?: number | null
          badges?: string[] | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string | null
          id: string
          is_guest?: boolean | null
          is_host?: boolean | null
          last_name?: string | null
          personal_records?: Json | null
          phone?: string | null
          points_balance?: number | null
          preferred_distances?: string[] | null
          profile_image_url?: string | null
          races_completed_this_year?: number | null
          running_experience?: string | null
          running_modalities?: string[] | null
          total_guest_experiences?: number | null
          total_host_experiences?: number | null
          updated_at?: string | null
          verification_documents?: string[] | null
          verification_status?: string | null
        }
        Update: {
          average_rating?: number | null
          badges?: string[] | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string | null
          id?: string
          is_guest?: boolean | null
          is_host?: boolean | null
          last_name?: string | null
          personal_records?: Json | null
          phone?: string | null
          points_balance?: number | null
          preferred_distances?: string[] | null
          profile_image_url?: string | null
          races_completed_this_year?: number | null
          running_experience?: string | null
          running_modalities?: string[] | null
          total_guest_experiences?: number | null
          total_host_experiences?: number | null
          updated_at?: string | null
          verification_documents?: string[] | null
          verification_status?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          amenities: string[]
          average_rating: number | null
          bathrooms: number
          bedrooms: number
          beds: number
          cancellation_policy: string | null
          check_in_instructions: string | null
          created_at: string
          description: string | null
          full_address: string
          house_rules: string | null
          id: string
          is_active: boolean
          latitude: number | null
          locality: string
          longitude: number | null
          max_guests: number
          owner_id: string
          points_earned: number
          provinces: string[]
          runner_instructions: string | null
          title: string
          total_bookings: number
          updated_at: string
        }
        Insert: {
          amenities?: string[]
          average_rating?: number | null
          bathrooms?: number
          bedrooms?: number
          beds?: number
          cancellation_policy?: string | null
          check_in_instructions?: string | null
          created_at?: string
          description?: string | null
          full_address: string
          house_rules?: string | null
          id?: string
          is_active?: boolean
          latitude?: number | null
          locality: string
          longitude?: number | null
          max_guests?: number
          owner_id: string
          points_earned?: number
          provinces?: string[]
          runner_instructions?: string | null
          title: string
          total_bookings?: number
          updated_at?: string
        }
        Update: {
          amenities?: string[]
          average_rating?: number | null
          bathrooms?: number
          bedrooms?: number
          beds?: number
          cancellation_policy?: string | null
          check_in_instructions?: string | null
          created_at?: string
          description?: string | null
          full_address?: string
          house_rules?: string | null
          id?: string
          is_active?: boolean
          latitude?: number | null
          locality?: string
          longitude?: number | null
          max_guests?: number
          owner_id?: string
          points_earned?: number
          provinces?: string[]
          runner_instructions?: string | null
          title?: string
          total_bookings?: number
          updated_at?: string
        }
        Relationships: []
      }
      property_availability: {
        Row: {
          created_at: string
          date: string
          id: string
          notes: string | null
          property_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          property_id: string
          status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          property_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_availability_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_images: {
        Row: {
          caption: string | null
          created_at: string
          display_order: number
          id: string
          image_url: string
          is_main: boolean
          property_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          is_main?: boolean
          property_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          is_main?: boolean
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_images_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      race_images: {
        Row: {
          caption: string | null
          category: string
          created_at: string
          display_order: number
          id: string
          image_url: string
          race_id: string
        }
        Insert: {
          caption?: string | null
          category: string
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          race_id: string
        }
        Update: {
          caption?: string | null
          category?: string
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          race_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "race_images_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      races: {
        Row: {
          average_rating: number | null
          created_at: string
          description: string | null
          distance_from_property: number | null
          distances: Json
          has_wave_starts: boolean
          highlights: string | null
          host_id: string
          id: string
          is_active: boolean
          local_tips: string | null
          max_guests: number
          modalities: Json
          name: string
          official_website: string | null
          points_cost: number
          property_id: string
          race_date: string
          registration_cost: number | null
          registration_deadline: string | null
          start_location: string | null
          terrain_profile: Json
          total_bookings: number
          updated_at: string
          weather_notes: string | null
        }
        Insert: {
          average_rating?: number | null
          created_at?: string
          description?: string | null
          distance_from_property?: number | null
          distances?: Json
          has_wave_starts?: boolean
          highlights?: string | null
          host_id: string
          id?: string
          is_active?: boolean
          local_tips?: string | null
          max_guests?: number
          modalities?: Json
          name: string
          official_website?: string | null
          points_cost?: number
          property_id: string
          race_date: string
          registration_cost?: number | null
          registration_deadline?: string | null
          start_location?: string | null
          terrain_profile?: Json
          total_bookings?: number
          updated_at?: string
          weather_notes?: string | null
        }
        Update: {
          average_rating?: number | null
          created_at?: string
          description?: string | null
          distance_from_property?: number | null
          distances?: Json
          has_wave_starts?: boolean
          highlights?: string | null
          host_id?: string
          id?: string
          is_active?: boolean
          local_tips?: string | null
          max_guests?: number
          modalities?: Json
          name?: string
          official_website?: string | null
          points_cost?: number
          property_id?: string
          race_date?: string
          registration_cost?: number | null
          registration_deadline?: string | null
          start_location?: string | null
          terrain_profile?: Json
          total_bookings?: number
          updated_at?: string
          weather_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "races_host_id_profiles_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "races_property_id_properties_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          reviewed_house_id: string
          reviewer_id: string
          swap_request_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          reviewed_house_id: string
          reviewer_id: string
          swap_request_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          reviewed_house_id?: string
          reviewer_id?: string
          swap_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_reviewed_house_id_fkey"
            columns: ["reviewed_house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_swap_request_id_fkey"
            columns: ["swap_request_id"]
            isOneToOne: false
            referencedRelation: "swap_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_name: string
          status: string
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_name?: string
          status: string
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_name?: string
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      swap_requests: {
        Row: {
          check_in_date: string
          check_out_date: string
          created_at: string | null
          guests_count: number
          id: string
          message: string | null
          requested_house_id: string
          requester_house_id: string
          requester_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          check_in_date: string
          check_out_date: string
          created_at?: string | null
          guests_count?: number
          id?: string
          message?: string | null
          requested_house_id: string
          requester_house_id: string
          requester_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          check_in_date?: string
          check_out_date?: string
          created_at?: string | null
          guests_count?: number
          id?: string
          message?: string | null
          requested_house_id?: string
          requester_house_id?: string
          requester_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "swap_requests_requested_house_id_fkey"
            columns: ["requested_house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swap_requests_requester_house_id_fkey"
            columns: ["requester_house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swap_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      process_booking_points_transaction: {
        Args: {
          p_booking_id: string
          p_guest_id: string
          p_host_id: string
          p_points_cost: number
          p_transaction_type: string
        }
        Returns: undefined
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
