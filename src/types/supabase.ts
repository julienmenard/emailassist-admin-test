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
    };
    Views: {
      [key: string]: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
    };
    Functions: Record<string, unknown>;
  };
};