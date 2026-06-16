import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Send } from "lucide-react";
import type { Comment } from "@/types";
import { useVozZap } from "@/hooks/useVozZap";
import { useApp } from "@/contexts/AppContext";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { initials, timeAgo } from "@/lib/utils";

interface CommentSectionProps {
  postId: string;
  onCountChange?: (count: number) => void;
}

export function CommentSection({ postId, onCountChange }: CommentSectionProps) {
  const { fetchComments, addComment } = useVozZap();
  const { profile, session, toast } = useApp();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchComments(postId);
      setComments(data);
      onCountChange?.(data.length);
    } catch {
      toast({ title: "Erro ao carregar comentários", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [fetchComments, postId, onCountChange, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      await addComment(postId, content);
      setText("");
      await load();
    } catch {
      toast({ title: "Erro ao comentar", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-3">
      {session && (
        <form onSubmit={submit} className="flex items-center gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escreva um comentário..."
            maxLength={500}
            disabled={sending}
          />
          <Button type="submit" size="icon" disabled={sending || !text.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      )}

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-3/4" />
        </div>
      ) : comments.length === 0 ? (
        <p className="py-2 text-center text-sm text-muted-foreground">
          Nenhum comentário ainda. Seja o primeiro!
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-2">
              <Link to={c.author ? `/u/${c.author.username}` : "#"}>
                <Avatar
                  className="h-8 w-8"
                  src={c.author?.avatar_url}
                  fallback={initials(
                    c.author?.display_name || c.author?.username || "?"
                  )}
                />
              </Link>
              <div className="flex-1 rounded-lg bg-muted px-3 py-2">
                <p className="text-xs font-semibold">
                  {c.author?.display_name || "Usuário"}{" "}
                  <span className="font-normal text-muted-foreground">
                    · {timeAgo(c.created_at)}
                  </span>
                </p>
                <p className="text-sm">{c.content}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
