import { useState } from "react";
import { Link } from "react-router-dom";
import { Globe2, Heart, MessageCircle, ShieldCheck, Trash2, Users, MoreVertical } from "lucide-react";
import type { Post } from "@/types";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { AudioPlayer } from "@/components/audio/AudioPlayer";
import { CommentSection } from "@/components/post/CommentSection";
import { useVozZap } from "@/hooks/useVozZap";
import { useApp } from "@/contexts/AppContext";
import { cn, initials, timeAgo } from "@/lib/utils";

interface PostCardProps {
  post: Post;
  onChanged?: () => void;
}

export function PostCard({ post, onChanged }: PostCardProps) {
  const { myId, toggleLike, deletePost, updatePost } = useVozZap();
  const { toast } = useApp();
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likes, setLikes] = useState(post.likes_count);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.comments_count);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState<string | null>(post.title ?? "");
  const [editCaption, setEditCaption] = useState<string | null>(post.caption ?? "");

  const author = post.author;
  const isEditable = myId === post.user_id && (Date.now() - new Date(post.created_at).getTime()) < 60 * 60 * 1000;

  const handleLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikes((c) => c + (next ? 1 : -1));
    try {
      await toggleLike(post.id, liked);
    } catch {
      setLiked(liked);
      setLikes(post.likes_count);
      toast({ title: "Erro ao curtir", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    try {
      await deletePost(post.id);
      toast({ title: "Áudio removido", variant: "success" });
      onChanged?.();
    } catch {
      toast({ title: "Erro ao remover", variant: "destructive" });
    }
  };

  const handleEditSave = async () => {
    try {
      await updatePost(post.id, { title: editTitle ?? null, caption: editCaption ?? null });
      toast({ title: "Áudio atualizado", variant: "success" });
      setEditing(false);
      onChanged?.();
    } catch (err: any) {
      const msg = err?.message || String(err);
      toast({ title: "Erro ao atualizar", description: msg || "Erro desconhecido", variant: "destructive" });
      console.error("updatePost error:", err);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 p-4 pb-3">
        <Link to={author ? `/u/${author.username}` : "#"}>
          <Avatar
            src={author?.avatar_url}
            fallback={initials(author?.display_name || author?.username || "?")}
          />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            to={author ? `/u/${author.username}` : "#"}
            className="block truncate font-semibold hover:underline"
          >
            {author?.display_name || "Usuário"}
          </Link>
          <p className="truncate text-xs text-muted-foreground">
            @{author?.username ?? "..."} · {timeAgo(post.created_at)}{post.edited ? " · editado" : ""}
          </p>
        </div>
        {myId === post.user_id && (
          <DropdownMenu
            trigger={
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            }
          >
            {isEditable && (
              <DropdownMenuItem onClick={() => setEditing(true)}>
                Editar
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" /> Excluir
            </DropdownMenuItem>
          </DropdownMenu>
        )}
      </div>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogHeader>
          <DialogTitle>Editar áudio</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <label className="text-sm text-muted-foreground">Título</label>
          <Input value={editTitle ?? ""} onChange={(e) => setEditTitle(e.target.value)} />
          <label className="text-sm text-muted-foreground">Legenda</label>
          <Input value={editCaption ?? ""} onChange={(e) => setEditCaption(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
            <Button onClick={handleEditSave}>Salvar</Button>
          </div>
        </div>
      </Dialog>

      {post.caption && (
        <p className="px-4 pb-3 text-sm">{post.caption}</p>
      )}

      {post.title && (
        <h3 className="px-4 pb-2 font-semibold text-base">{post.title}</h3>
      )}

      {post.category && (
        <p className="px-4 pb-3 text-xs text-blue-600 dark:text-blue-400">
          {post.category}
        </p>
      )}

      <div className="flex items-center justify-between px-4 pb-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {post.visibility === "public" && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/10 px-2 py-1">
              <Globe2 className="h-3.5 w-3.5" /> Público
            </span>
          )}
          {post.visibility === "friends_only" && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/10 px-2 py-1">
              <Users className="h-3.5 w-3.5" /> Amigos
            </span>
          )}
          {post.visibility === "close_friends" && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/10 px-2 py-1">
              <ShieldCheck className="h-3.5 w-3.5" /> Melhores amigos
            </span>
          )}
        </div>
      </div>

      <div className="px-4">
        <AudioPlayer src={post.audio_url} duration={post.duration} />
      </div>

      <div className="flex items-center gap-1 p-2 pt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          className={cn(liked && "text-destructive")}
        >
          <Heart className={cn("h-4 w-4", liked && "fill-current")} />
          {likes}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments((v) => !v)}
        >
          <MessageCircle className="h-4 w-4" />
          {comments}
        </Button>
      </div>

      {showComments && (
        <div className="border-t border-border px-4 py-3">
          <CommentSection
            postId={post.id}
            onCountChange={(n) => setComments(n)}
          />
        </div>
      )}
    </Card>
  );
}
