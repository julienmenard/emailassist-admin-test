export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          created_at: string;
          updated_at: string;
          timezone: string | null;
          analysis_language: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          created_at?: string;
          updated_at?: string;
          timezone?: string | null;
          analysis_language?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          created_at?: string;
          updated_at?: string;
          timezone?: string | null;
          analysis_language?: string | null;
        };
      };
      google_users: {
        Row: {
          id: string;
          user_id: string;
          google_email: string;
          google_oauth2_token: string;
          google_refresh_token: string | null;
          token_expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          google_email: string;
          google_oauth2_token: string;
          google_refresh_token?: string | null;
          token_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          google_email?: string;
          google_oauth2_token?: string;
          google_refresh_token?: string | null;
          token_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      microsoft_users: {
        Row: {
          id: string;
          user_id: string;
          microsoft_email: string;
          microsoft_oauth2_token: string;
          created_at: string;
          updated_at: string;
          microsoft_refresh_token: string | null;
          token_expires_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          microsoft_email: string;
          microsoft_oauth2_token: string;
          created_at?: string;
          updated_at?: string;
          microsoft_refresh_token?: string | null;
          token_expires_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          microsoft_email?: string;
          microsoft_oauth2_token?: string;
          created_at?: string;
          updated_at?: string;
          microsoft_refresh_token?: string | null;
          token_expires_at?: string | null;
        };
      };
      admin_users: {
        Row: {
          id: string;
          email: string;
          password: string;
          created_at: string;
          last_login: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          password: string;
          created_at?: string;
          last_login?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          password?: string;
          created_at?: string;
          last_login?: string | null;
        };
      };
      edge_function_logs: {
        Row: {
          id: string;
          function_name: string;
          created_at: string;
          status: number;
          method: string;
          execution_time: number;
          error?: string;
          user_id?: string;
        };
        Insert: {
          id?: string;
          function_name: string;
          created_at?: string;
          status: number;
          method: string;
          execution_time: number;
          error?: string;
          user_id?: string;
        };
        Update: {
          id?: string;
          function_name?: string;
          created_at?: string;
          status?: number;
          method?: string;
          execution_time?: number;
          error?: string;
          user_id?: string;
        };
      };
    };
  };
};