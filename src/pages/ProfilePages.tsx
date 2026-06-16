import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, MessageCircle, Mic } from "lucide-react";
import type { Post, Profile } from "@/types";
import { useVozZap } from "@/hooks/useVozZap";
import { useApp } from "@/contexts/AppContext";
import { PostCard } from "@/components/post/PostCard";
import { FollowersModal } from "@/components/post/FollowersModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { initials } from "@/lib/utils";

export function ProfilePage() {
  const { username = "" } = useParams();
  const navigate = useNavigate();
  const {
    myId,
    fetchProfileByUsername,
    fetchUserPosts,
    fetchFollowState,
    toggleFollow,
    fetchFollowCounts,
    getOrCreateConversation,
    addCloseFriend,
    removeCloseFriend,
    fetchCloseFriends,
  } = useVozZap();
  const { toast } = useApp();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [isCloseFriend, setIsCloseFriend] = useState(false);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [working, setWorking] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const prof = await fetchProfileByUsername(username);
      setProfile(prof);
      if (prof) {
        const [userPosts, fState, fCounts, closeFriends] = await Promise.all([
          fetchUserPosts(prof.id),
          fetchFollowState(prof.id),
          fetchFollowCounts(prof.id),
          myId ? fetchCloseFriends(myId) : Promise.resolve([]),
        ]);
        setPosts(userPosts);
        setFollowing(fState);
        setCounts(fCounts);
        setIsCloseFriend((closeFriends as Profile[]).some((cf) => cf.id === prof.id));
      }
    } catch {
      toast({ title: "Erro ao carregar perfil", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [
    username,
    fetchProfileByUsername,
    fetchUserPosts,
    fetchFollowState,
    fetchFollowCounts,
    fetchCloseFriends,
    myId,
    toast,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  const onFollow = async () => {
    if (!profile) return;
    setWorking(true);
    const next = !following;
    setFollowing(next);
    setCounts((c) => ({
      ...c,
      followers: c.followers + (next ? 1 : -1),
    }));
    try {
      await toggleFollow(profile.id, following);
    } catch {
      setFollowing(following);
      toast({ title: "Erro ao seguir", variant: "destructive" });
    } finally {
      setWorking(false);
    }
  };

  const onMessage = async () => {
    if (!profile) return;
    try {
      const convoId = await getOrCreateConversation(profile.id);
      navigate(`/chat/${convoId}`);
    } catch {
      toast({ title: "Erro ao abrir conversa", variant: "destructive" });
    }
  };

  const onToggleCloseFriend = async () => {
    if (!profile) return;
    setWorking(true);
    const next = !isCloseFriend;
    setIsCloseFriend(next);
    try {
      if (next) {
        await addCloseFriend(profile.id);
      } else {
        await removeCloseFriend(profile.id);
      }
      toast({
        title: next ? "Adicionado aos melhores amigos" : "Removido dos melhores amigos",
        variant: "success",
      });
    } catch {
      setIsCloseFriend(isCloseFriend);
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    } finally {
      setWorking(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <Card className="p-10 text-center text-sm text-muted-foreground">
          Perfil não encontrado.
        </Card>
      </div>
    );
  }

  const isMe = myId === profile.id;

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar
              src={profile.avatar_url}
              fallback={initials(profile.display_name || profile.username)}
              className="h-20 w-20 text-xl"
            />
            <div className="flex-1">
              <h2 className="text-xl font-bold">{profile.display_name}</h2>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
              <div className="mt-2 flex gap-4 text-sm">
                <span>
                  <b>{posts.length}</b>{" "}
                  <span className="text-muted-foreground">
                    {posts.length === 1 ? "áudio" : "áudios"}
                  </span>
                </span>
                <button
                  onClick={() => setShowFollowersModal(true)}
                  className="border-0 bg-transparent p-0 text-left hover:underline cursor-pointer"
                  type="button"
                >
                  <b>{counts.followers}</b>{" "}
                  <span className="text-muted-foreground">
                    {counts.followers === 1 ? "seguidor" : "seguidores"}
                  </span>
                </button>
                <button
                  onClick={() => setShowFollowingModal(true)}
                  className="border-0 bg-transparent p-0 text-left hover:underline cursor-pointer"
                  type="button"
                >
                  <b>{counts.following}</b>{" "}
                  <span className="text-muted-foreground">
                    {counts.following === 1 ? "seguindo" : "seguindo"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {profile.bio && <p className="mt-4 text-sm">{profile.bio}</p>}

          <div className="mt-4 flex gap-2">
            {isMe ? (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/profile/edit")}
              >
                Editar perfil
              </Button>
            ) : (
              <>
                <Button
                  className="flex-1"
                  variant={following ? "outline" : "default"}
                  onClick={onFollow}
                  disabled={working}
                >
                  {following ? "Seguindo" : "Seguir"}
                </Button>
                <Button
                  variant={isCloseFriend ? "default" : "outline"}
                  onClick={onToggleCloseFriend}
                  disabled={working}
                  title={isCloseFriend ? "Remover dos melhores amigos" : "Adicionar aos melhores amigos"}
                >
                  💚 {isCloseFriend ? "Melhor amigo" : "Adicionar"}
                </Button>
                <Button variant="secondary" onClick={onMessage}>
                  <MessageCircle className="h-4 w-4" /> Mensagem
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {posts.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Mic className="h-7 w-7" />
          </span>
          <p className="text-sm text-muted-foreground">
            {isMe ? "Você ainda não publicou áudios." : "Nenhum áudio publicado."}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <PostCard key={p.id} post={{ ...p, author: profile }} onChanged={load} />
          ))}
        </div>
      )}

      {profile && (
        <>
          <FollowersModal
            userId={profile.id}
            isOpen={showFollowersModal}
            onClose={() => setShowFollowersModal(false)}
            title="Seguidores"
            type="followers"
          />
          <FollowersModal
            userId={profile.id}
            isOpen={showFollowingModal}
            onClose={() => setShowFollowingModal(false)}
            title="Seguindo"
            type="following"
          />
        </>
      )}
    </div>
  );
}

export function EditProfilePage() {
  const { profile, refreshProfile } = useApp();
  const { updateProfile, uploadAvatar } = useVozZap();
  const { toast } = useApp();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name);
      setBio(profile.bio ?? "");
      setAvatarUrl(profile.avatar_url ?? "");
    }
  }, [profile]);

  const onAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadAvatar(file);
      setAvatarUrl(url);
      toast({ title: "Foto carregada", variant: "success" });
    } catch {
      toast({ title: "Erro ao enviar foto", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        display_name: displayName.trim() || profile?.username || "",
        bio: bio.trim() || null,
        avatar_url: avatarUrl || null,
      });
      await refreshProfile();
      toast({ title: "Perfil atualizado", variant: "success" });
      if (profile) navigate(`/u/${profile.username}`);
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Carregando perfil...
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <Card>
        <CardHeader>
          <CardTitle>Editar perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-5">
            <div className="flex flex-col items-center gap-3">
              <Avatar
                src={avatarUrl || null}
                fallback={initials(displayName || profile.username)}
                className="h-24 w-24 text-2xl"
              />
              <label className="cursor-pointer text-sm font-medium text-primary hover:underline">
                {uploading ? "Enviando..." : "Trocar foto"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onAvatar}
                  disabled={uploading}
                />
              </label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={160}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Fale sobre você..."
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate(-1)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
