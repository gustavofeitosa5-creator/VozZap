import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Users, Heart, MessageCircle } from "lucide-react";
import type { Profile, Post } from "@/types";
import { useVozZap } from "@/hooks/useVozZap";
import { useApp } from "@/contexts/AppContext";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "@/components/post/PostCard";
import { initials } from "@/lib/utils";

export function Explore() {
  const {
    searchProfiles,
    fetchTopProfiles,
    fetchTrendingPosts,
    fetchMostCommentedPosts,
  } = useVozZap();
  const { isConfigured } = useApp();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("search");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [topProfiles, setTopProfiles] = useState<Profile[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [commentedPosts, setCommentedPosts] = useState<Post[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(true);
  const [loadingTop, setLoadingTop] = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingCommented, setLoadingCommented] = useState(true);

  const runSearch = useCallback(
    async (q: string) => {
      if (!isConfigured) {
        setLoadingSearch(false);
        return;
      }
      setLoadingSearch(true);
      try {
        setSearchResults(await searchProfiles(q));
      } finally {
        setLoadingSearch(false);
      }
    },
    [searchProfiles, isConfigured]
  );

  const loadTopProfiles = useCallback(async () => {
    if (!isConfigured) {
      setLoadingTop(false);
      return;
    }
    setLoadingTop(true);
    try {
      setTopProfiles(await fetchTopProfiles());
    } finally {
      setLoadingTop(false);
    }
  }, [fetchTopProfiles, isConfigured]);

  const loadTrendingPosts = useCallback(async () => {
    if (!isConfigured) {
      setLoadingTrending(false);
      return;
    }
    setLoadingTrending(true);
    try {
      setTrendingPosts(await fetchTrendingPosts());
    } finally {
      setLoadingTrending(false);
    }
  }, [fetchTrendingPosts, isConfigured]);

  const loadCommentedPosts = useCallback(async () => {
    if (!isConfigured) {
      setLoadingCommented(false);
      return;
    }
    setLoadingCommented(true);
    try {
      setCommentedPosts(await fetchMostCommentedPosts());
    } finally {
      setLoadingCommented(false);
    }
  }, [fetchMostCommentedPosts, isConfigured]);

  useEffect(() => {
    void runSearch("");
    void loadTopProfiles();
    void loadTrendingPosts();
    void loadCommentedPosts();
  }, [runSearch, loadTopProfiles, loadTrendingPosts, loadCommentedPosts]);

  useEffect(() => {
    const t = setTimeout(() => void runSearch(query), 300);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <h2 className="text-xl font-bold">Explorar</h2>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search">Buscar</TabsTrigger>
          <TabsTrigger value="top">Top Pessoas</TabsTrigger>
          <TabsTrigger value="trending">
            <Heart className="mr-2 h-4 w-4" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="commented">
            <MessageCircle className="mr-2 h-4 w-4" />
            Comentários
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar pessoas..."
              className="pl-9"
            />
          </div>

          {!isConfigured ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              Configure o Supabase (.env) para buscar usuários.
            </Card>
          ) : loadingSearch ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : searchResults.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 p-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Users className="h-7 w-7" />
              </span>
              <p className="text-sm text-muted-foreground">
                Nenhum usuário encontrado.
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {searchResults.map((p) => (
                <Link key={p.id} to={`/u/${p.username}`}>
                  <Card className="flex items-center gap-3 p-3 hover:bg-accent/40">
                    <Avatar
                      src={p.avatar_url}
                      fallback={initials(p.display_name || p.username)}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{p.display_name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        @{p.username}
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="top" className="space-y-4">
          {!isConfigured ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              Configure o Supabase (.env) para buscar usuários.
            </Card>
          ) : loadingTop ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : topProfiles.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 p-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Users className="h-7 w-7" />
              </span>
              <p className="text-sm text-muted-foreground">
                Nenhum usuário encontrado.
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {topProfiles.map((p) => (
                <Link key={p.id} to={`/u/${p.username}`}>
                  <Card className="flex items-center gap-3 p-3 hover:bg-accent/40">
                    <Avatar
                      src={p.avatar_url}
                      fallback={initials(p.display_name || p.username)}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{p.display_name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        @{p.username}
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="trending" className="space-y-4">
          {!isConfigured ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              Configure o Supabase (.env) para buscar posts.
            </Card>
          ) : loadingTrending ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : trendingPosts.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 p-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Heart className="h-7 w-7" />
              </span>
              <p className="text-sm text-muted-foreground">
                Nenhum post encontrado.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {trendingPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="commented" className="space-y-4">
          {!isConfigured ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              Configure o Supabase (.env) para buscar posts.
            </Card>
          ) : loadingCommented ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : commentedPosts.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 p-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
                <MessageCircle className="h-7 w-7" />
              </span>
              <p className="text-sm text-muted-foreground">
                Nenhum post encontrado.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {commentedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
