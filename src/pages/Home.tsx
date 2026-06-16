import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Mic, RefreshCw } from "lucide-react";
import type { Post } from "@/types";
import { useVozZap } from "@/hooks/useVozZap";
import { useApp } from "@/contexts/AppContext";
import { PostCard } from "@/components/post/PostCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <Card key={i} className="space-y-3 p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-6 w-24" />
        </Card>
      ))}
    </div>
  );
}

export function Home() {
  const { fetchFeed } = useVozZap();
  const { isConfigured, toast } = useApp();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setPosts(await fetchFeed());
    } catch {
      toast({ title: "Erro ao carregar o feed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [fetchFeed, isConfigured, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Feed</h2>
        <Button variant="ghost" size="icon" onClick={load} aria-label="Atualizar">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {!isConfigured ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Configure o Supabase (.env) para carregar os áudios.
          </p>
        </Card>
      ) : loading ? (
        <FeedSkeleton />
      ) : posts.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Mic className="h-7 w-7" />
          </span>
          <h3 className="font-semibold">Ainda não há áudios</h3>
          <p className="text-sm text-muted-foreground">
            Seja o primeiro a publicar um áudio curto na VozZap.
          </p>
          <Link
            to="/new"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Gravar agora
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} onChanged={load} />
          ))}
        </div>
      )}
    </div>
  );
}
