import { useCallback } from "react";
import { supabase, AUDIO_BUCKET, AVATAR_BUCKET } from "@/lib/supabase";
import { useApp } from "@/contexts/AppContext";
import type {
  Post,
  Comment,
  Profile,
  Conversation,
  Message,
  PostVisibility,
} from "@/types";

interface RawPost {
  id: string;
  user_id: string;
  title: string | null;
  caption: string | null;
  category: string | null;
  audio_url: string;
  duration: number;
  visibility: PostVisibility;
  created_at: string;
  author: Profile | null;
  likes: { user_id: string }[];
  comments: { id: string }[];
  updated_at?: string | null;
  edited?: boolean;
}

export function useVozZap() {
  const { session } = useApp();
  const myId = session?.user.id ?? null;

  const mapPosts = useCallback(
    (rows: RawPost[]): Post[] =>
      rows.map((r) => ({
        updated_at: (r as any).updated_at ?? null,
        edited: (r as any).edited ?? false,
        id: r.id,
        user_id: r.user_id,
        title: r.title,
        caption: r.caption,
        category: r.category,
        audio_url: r.audio_url,
        duration: r.duration,
        visibility: r.visibility,
        created_at: r.created_at,
        author: r.author ?? undefined,
        likes_count: r.likes?.length ?? 0,
        comments_count: r.comments?.length ?? 0,
        liked_by_me: !!myId && (r.likes ?? []).some((l) => l.user_id === myId),
      })),
    [myId]
  );

  const POST_SELECT =
    "id, user_id, title, caption, category, audio_url, duration, visibility, created_at, updated_at, edited, author:profiles(*), likes(user_id), comments(id)";

  const canViewPost = useCallback(
    async (post: RawPost): Promise<boolean> => {
      // Se for público, qualquer um vê
      if (post.visibility === "public") return true;

      // Se não estiver logado e não for público, não pode ver
      if (!myId) return false;

      // Se for o autor do post, pode ver
      if (myId === post.user_id) return true;

      // Se for apenas amigos (seguidores do autor)
      if (post.visibility === "friends_only") {
        const { data, error } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", myId)
          .eq("following_id", post.user_id)
          .maybeSingle();
        if (error) throw error;
        return !!data;
      }

      // Se for apenas melhores amigos
      if (post.visibility === "close_friends") {
        const { data, error } = await supabase
          .from("close_friends")
          .select("id")
          .eq("user_id", post.user_id)
          .eq("close_friend_id", myId)
          .maybeSingle();
        if (error) throw error;
        return !!data;
      }

      return false;
    },
    [myId]
  );

  const filterVisiblePosts = useCallback(
    async (posts: RawPost[]): Promise<RawPost[]> => {
      const visiblePosts = await Promise.all(
        posts.map(async (post) => ({
          post,
          canView: await canViewPost(post),
        }))
      );
      return visiblePosts.filter((p) => p.canView).map((p) => p.post);
    },
    [canViewPost]
  );

  const fetchFeed = useCallback(async (): Promise<Post[]> => {
    const { data, error } = await supabase
      .from("posts")
      .select(POST_SELECT)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    const rawPosts = (data as unknown as RawPost[]) ?? [];
    const visiblePosts = await filterVisiblePosts(rawPosts);
    return mapPosts(visiblePosts);
  }, [mapPosts, filterVisiblePosts]);

  const fetchUserPosts = useCallback(
    async (userId: string): Promise<Post[]> => {
      const { data, error } = await supabase
        .from("posts")
        .select(POST_SELECT)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rawPosts = (data as unknown as RawPost[]) ?? [];
      const visiblePosts = await filterVisiblePosts(rawPosts);
      return mapPosts(visiblePosts);
    },
    [mapPosts, filterVisiblePosts]
  );

  const toggleLike = useCallback(
    async (postId: string, liked: boolean): Promise<void> => {
      if (!myId) return;
      if (liked) {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", myId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("likes")
          .insert({ post_id: postId, user_id: myId });
        if (error) throw error;
      }
    },
    [myId]
  );

  const deletePost = useCallback(async (postId: string): Promise<void> => {
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) throw error;
  }, []);

  const updatePost = useCallback(
    async (
      postId: string,
      updates: { title?: string | null; caption?: string | null; category?: string | null }
    ): Promise<void> => {
      if (!myId) return;
      // Verify edit window (1 hour)
      const { data: existing, error: fetchErr } = await supabase
        .from("posts")
        .select("created_at")
        .eq("id", postId)
        .maybeSingle();
      if (fetchErr) throw fetchErr;
      if (!existing) throw new Error("Post not found");
      const created = new Date((existing as any).created_at).getTime();
      if (Date.now() - created > 60 * 60 * 1000) {
        throw new Error("Edit window expired");
      }
      const patch: any = {};
      if (updates.title !== undefined) patch.title = updates.title ? updates.title.trim() : null;
      if (updates.caption !== undefined) patch.caption = updates.caption ? updates.caption.trim() : null;
      if (updates.category !== undefined) patch.category = updates.category ? updates.category.trim() : null;
      patch.edited = true;
      patch.updated_at = new Date().toISOString();

      const { error } = await supabase.from("posts").update(patch).eq("id", postId);
      if (error) throw error;
    },
    [myId]
  );

  const fetchComments = useCallback(
    async (postId: string): Promise<Comment[]> => {
      const { data, error } = await supabase
        .from("comments")
        .select("*, author:profiles(*)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data as unknown as Comment[]) ?? [];
    },
    []
  );

  const addComment = useCallback(
    async (postId: string, content: string): Promise<void> => {
      if (!myId) return;
      const { error } = await supabase
        .from("comments")
        .insert({ post_id: postId, user_id: myId, content });
      if (error) throw error;
    },
    [myId]
  );

  const uploadAudio = useCallback(
    async (file: Blob, ext: string): Promise<string> => {
      if (!myId) throw new Error("Sem sessão");
      const path = `${myId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from(AUDIO_BUCKET)
        .upload(path, file, {
          contentType: file.type || "audio/webm",
          upsert: false,
        });
      if (error) throw error;
      const { data } = supabase.storage.from(AUDIO_BUCKET).getPublicUrl(path);
      return data.publicUrl;
    },
    [myId]
  );

  const uploadAvatar = useCallback(
    async (file: File): Promise<string> => {
      if (!myId) throw new Error("Sem sessão");
      const ext = file.name.split(".").pop() ?? "png";
      const path = `${myId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
      return data.publicUrl;
    },
    [myId]
  );

  const createPost = useCallback(
    async (
      audioUrl: string,
      duration: number,
      caption: string,
      title: string | null = null,
      category: string | null = null,
      visibility: PostVisibility = "public"
    ): Promise<void> => {
      if (!myId) throw new Error("Sem sessão");
      const { error } = await supabase.from("posts").insert({
        user_id: myId,
        audio_url: audioUrl,
        duration: Math.round(duration),
        title: title ? title.trim() : null,
        caption: caption.trim() || null,
        category: category ? category.trim() : null,
        visibility,
      });
      if (error) throw error;
    },
    [myId]
  );

  const fetchProfileByUsername = useCallback(
    async (username: string): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .maybeSingle();
      if (error) throw error;
      return (data as Profile | null) ?? null;
    },
    []
  );

  const updateProfile = useCallback(
    async (updates: Partial<Profile>): Promise<void> => {
      if (!myId) return;
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", myId);
      if (error) throw error;
    },
    [myId]
  );

  const searchProfiles = useCallback(
    async (query: string): Promise<Profile[]> => {
      let req = supabase.from("profiles").select("*").limit(30);
      if (query.trim()) {
        req = req.or(
          `username.ilike.%${query}%,display_name.ilike.%${query}%`
        );
      }
      const { data, error } = await req;
      if (error) throw error;
      return ((data as Profile[]) ?? []).filter((p) => p.id !== myId);
    },
    [myId]
  );

  const fetchFollowState = useCallback(
    async (targetId: string): Promise<boolean> => {
      if (!myId) return false;
      const { data, error } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", myId)
        .eq("following_id", targetId)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    [myId]
  );

  const toggleFollow = useCallback(
    async (targetId: string, following: boolean): Promise<void> => {
      if (!myId) return;
      if (following) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", myId)
          .eq("following_id", targetId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: myId, following_id: targetId });
        if (error) throw error;
      }
    },
    [myId]
  );

  const fetchFollowCounts = useCallback(
    async (userId: string): Promise<{ followers: number; following: number }> => {
      const [followers, following] = await Promise.all([
        supabase
          .from("follows")
          .select("id", { count: "exact", head: true })
          .eq("following_id", userId),
        supabase
          .from("follows")
          .select("id", { count: "exact", head: true })
          .eq("follower_id", userId),
      ]);
      if (followers.error) throw followers.error;
      if (following.error) throw following.error;
      return {
        followers: followers.count ?? 0,
        following: following.count ?? 0,
      };
    },
    []
  );

  const getOrCreateConversation = useCallback(
    async (otherId: string): Promise<string> => {
      if (!myId) throw new Error("Sem sessão");
      const [a, b] = [myId, otherId].sort();
      const { data: existing, error: existingError } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_a", a)
        .eq("user_b", b)
        .maybeSingle();
      if (existingError) throw existingError;
      if (existing) return existing.id as string;
      const { data, error } = await supabase
        .from("conversations")
        .insert({ user_a: a, user_b: b })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    [myId]
  );

  const fetchConversations = useCallback(async (): Promise<Conversation[]> => {
    if (!myId) return [];
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .or(`user_a.eq.${myId},user_b.eq.${myId}`)
      .order("created_at", { ascending: false });
    if (error) throw error;
    const convos = (data as Conversation[]) ?? [];
    const enriched = await Promise.all(
      convos.map(async (c) => {
        const otherId = c.user_a === myId ? c.user_b : c.user_a;
        const { data: prof } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", otherId)
          .maybeSingle();
        const { data: last } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", c.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        return {
          ...c,
          other_user: (prof as Profile | null) ?? undefined,
          last_message: (last as Message | null) ?? null,
        };
      })
    );
    return enriched;
  }, [myId]);

  const fetchMessages = useCallback(
    async (conversationId: string): Promise<Message[]> => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data as Message[]) ?? [];
    },
    []
  );

  const sendMessage = useCallback(
    async (conversationId: string, content: string): Promise<void> => {
      if (!myId) return;
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: myId,
        content,
      });
      if (error) throw error;
    },
    [myId]
  );

  const fetchFollowers = useCallback(
    async (userId: string): Promise<Profile[]> => {
      // Buscar IDs dos seguidores
      const { data: followData, error: followError } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("following_id", userId);
      if (followError) throw followError;
      
      if (!followData || followData.length === 0) return [];
      
      const followerIds = followData.map((f) => (f as any).follower_id);
      
      // Buscar perfis dos seguidores
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", followerIds);
      if (profileError) throw profileError;
      
      return (profiles as Profile[]) ?? [];
    },
    []
  );

  const fetchFollowing = useCallback(
    async (userId: string): Promise<Profile[]> => {
      // Buscar IDs dos que estão sendo seguidos
      const { data: followData, error: followError } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", userId);
      if (followError) throw followError;
      
      if (!followData || followData.length === 0) return [];
      
      const followingIds = followData.map((f) => (f as any).following_id);
      
      // Buscar perfis dos que estão sendo seguidos
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", followingIds);
      if (profileError) throw profileError;
      
      return (profiles as Profile[]) ?? [];
    },
    []
  );

  const addCloseFriend = useCallback(
    async (closeFriendId: string): Promise<void> => {
      if (!myId) return;
      const { error } = await supabase
        .from("close_friends")
        .insert({ user_id: myId, close_friend_id: closeFriendId });
      if (error) throw error;
    },
    [myId]
  );

  const removeCloseFriend = useCallback(
    async (closeFriendId: string): Promise<void> => {
      if (!myId) return;
      const { error } = await supabase
        .from("close_friends")
        .delete()
        .eq("user_id", myId)
        .eq("close_friend_id", closeFriendId);
      if (error) throw error;
    },
    [myId]
  );

  const fetchCloseFriends = useCallback(
    async (userId: string): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from("close_friends")
        .select("close_friend_id")
        .eq("user_id", userId);
      if (error) throw error;
      
      if (!data || data.length === 0) return [];
      
      const closeFriendIds = data.map((cf) => (cf as any).close_friend_id);
      
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", closeFriendIds);
      if (profileError) throw profileError;
      
      return (profiles as Profile[]) ?? [];
    },
    []
  );

  const fetchTopProfiles = useCallback(
    async (): Promise<Profile[]> => {
      // Buscar perfis com mais seguidores
      const { data: followData, error: followError } = await supabase
        .from("follows")
        .select("following_id")
        .limit(1000);
      if (followError) throw followError;

      // Contar seguidores por usuário
      const followerCounts = (followData ?? []).reduce(
        (acc, f) => {
          const id = (f as any).following_id;
          acc[id] = (acc[id] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Ordenar por contagem de seguidores
      const topIds = Object.entries(followerCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([id]) => id);

      if (topIds.length === 0) {
        const { data: profiles, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .limit(20);
        if (profileError) throw profileError;
        return (profiles as Profile[]) ?? [];
      }

      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", topIds);
      if (profileError) throw profileError;
      return (profiles as Profile[]) ?? [];
    },
    []
  );

  const fetchTrendingPosts = useCallback(
    async (): Promise<Post[]> => {
      const { data, error } = await supabase
        .from("posts")
        .select(POST_SELECT)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      const rawPosts = (data as unknown as RawPost[]) ?? [];
      
      // Ordenar por likes
      const sorted = rawPosts.sort((a, b) => {
        const aLikes = a.likes?.length ?? 0;
        const bLikes = b.likes?.length ?? 0;
        return bLikes - aLikes;
      });

      const visiblePosts = await filterVisiblePosts(sorted);
      return mapPosts(visiblePosts);
    },
    [mapPosts, filterVisiblePosts]
  );

  const fetchMostCommentedPosts = useCallback(
    async (): Promise<Post[]> => {
      const { data, error } = await supabase
        .from("posts")
        .select(POST_SELECT)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      const rawPosts = (data as unknown as RawPost[]) ?? [];
      
      // Ordenar por comentários
      const sorted = rawPosts.sort((a, b) => {
        const aComments = a.comments?.length ?? 0;
        const bComments = b.comments?.length ?? 0;
        return bComments - aComments;
      });

      const visiblePosts = await filterVisiblePosts(sorted);
      return mapPosts(visiblePosts);
    },
    [mapPosts, filterVisiblePosts]
  );

  return {
    myId,
    supabase,
    fetchFeed,
    fetchUserPosts,
    toggleLike,
    deletePost,
    fetchComments,
    addComment,
    uploadAudio,
    uploadAvatar,
    createPost,
    fetchProfileByUsername,
    updateProfile,
    searchProfiles,
    fetchFollowState,
    toggleFollow,
    fetchFollowCounts,
    fetchFollowers,
    fetchFollowing,
    addCloseFriend,
    removeCloseFriend,
    fetchCloseFriends,
    getOrCreateConversation,
    fetchConversations,
    fetchMessages,
    sendMessage,
    fetchTopProfiles,
    fetchTrendingPosts,
    fetchMostCommentedPosts,
    updatePost,
  };
}
