export interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
}

export type PostVisibility = 'public' | 'friends_only' | 'close_friends';

export interface Post {
  id: string;
  user_id: string;
  title: string | null;
  caption: string | null;
  category: string | null;
  audio_url: string;
  duration: number;
  visibility: PostVisibility;
  created_at: string;
  updated_at?: string | null;
  edited?: boolean;
  author?: Profile;
  likes_count: number;
  comments_count: number;
  liked_by_me: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: Profile;
}

export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_a: string;
  user_b: string;
  created_at: string;
  other_user?: Profile;
  last_message?: Message | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: "default" | "destructive" | "success";
}

export interface ToastInput {
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
}

export interface CloseFriend {
  id: string;
  user_id: string;
  close_friend_id: string;
  created_at: string;
  friend?: Profile;
}

export interface AppContextValue {
  session: import("@supabase/supabase-js").Session | null;
  profile: Profile | null;
  loading: boolean;
  isConfigured: boolean;
  theme: "light" | "dark";
  toasts: ToastItem[];
  toggleTheme: () => void;
  toast: (t: ToastInput) => void;
  dismissToast: (id: string) => void;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}
