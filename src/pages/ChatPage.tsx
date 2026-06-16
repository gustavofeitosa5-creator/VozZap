import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Send, ArrowLeft, MessageCircle, Loader2, Users } from "lucide-react";
import type { Conversation, Message, Profile } from "@/types";
import { supabase } from "@/lib/supabase";
import { useVozZap } from "@/hooks/useVozZap";
import { useApp } from "@/contexts/AppContext";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, initials, timeAgo } from "@/lib/utils";

function ConversationList() {
  const {
    myId,
    fetchConversations,
    fetchFollowing,
    getOrCreateConversation,
  } = useVozZap();
  const { isConfigured, toast } = useApp();
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [friends, setFriends] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [activeTab, setActiveTab] = useState("conversations");
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const typingTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});
  const navigate = useNavigate();

  const load = useCallback(async () => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setConvos(await fetchConversations());
    } finally {
      setLoading(false);
    }
  }, [fetchConversations, isConfigured]);

  const loadFriends = useCallback(async () => {
    if (!isConfigured || !myId) {
      setLoadingFriends(false);
      return;
    }
    setLoadingFriends(true);
    try {
      setFriends(await fetchFollowing(myId));
    } finally {
      setLoadingFriends(false);
    }
  }, [fetchFollowing, isConfigured, myId]);

  useEffect(() => {
    void load();
    void loadFriends();
  }, [load, loadFriends]);

  useEffect(() => {
    const typingChannel = supabase
      .channel("typing_broadcast")
      .on("broadcast", { event: "typing" }, (payload) => {
        console.debug("[typing-broadcast][convo-list] payload:", payload);
        if (payload.payload.userId !== myId) {
          const conversationId = payload.payload.conversationId;
          setTypingUsers((prev) => ({
            ...prev,
            [conversationId]: true,
          }));

          if (typingTimeoutsRef.current[conversationId]) {
            clearTimeout(typingTimeoutsRef.current[conversationId]);
          }
          typingTimeoutsRef.current[conversationId] = setTimeout(() => {
            setTypingUsers((prev) => ({
              ...prev,
              [conversationId]: false,
            }));
          }, 3000);
        }
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(typingChannel);
      Object.values(typingTimeoutsRef.current).forEach((timeout) =>
        clearTimeout(timeout)
      );
    };
  }, [myId]);

  const startConversation = async (friendId: string) => {
    try {
      const conversationId = await getOrCreateConversation(friendId);
      navigate(`/chat/${conversationId}`);
    } catch {
      toast({ title: "Erro ao iniciar conversa", variant: "destructive" });
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <h2 className="text-xl font-bold">Mensagens</h2>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="conversations">
            <MessageCircle className="mr-2 h-4 w-4" />
            Conversas
          </TabsTrigger>
          <TabsTrigger value="friends">
            <Users className="mr-2 h-4 w-4" />
            Amigos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversations" className="space-y-2">
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : convos.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 p-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
                <MessageCircle className="h-7 w-7" />
              </span>
              <p className="text-sm text-muted-foreground">
                Nenhuma conversa. Visite um perfil e envie uma mensagem.
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {convos.map((c) => (
                <Link key={c.id} to={`/chat/${c.id}`}>
                  <Card className="flex items-center gap-3 p-3 hover:bg-accent/40">
                    <Avatar
                      src={c.other_user?.avatar_url}
                      fallback={initials(
                        c.other_user?.display_name ||
                          c.other_user?.username ||
                          "?"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">
                        {c.other_user?.display_name ?? "Usuário"}
                      </p>
                      {typingUsers[c.id] ? (
                        <div className="flex items-center gap-1">
                          <p className="text-xs text-muted-foreground italic">escrevendo...</p>
                        </div>
                      ) : (
                        <p className="truncate text-xs text-muted-foreground">
                          {c.last_message?.content ?? "Inicie a conversa"}
                        </p>
                      )}
                    </div>
                    {c.last_message && (
                      <span className="text-[11px] text-muted-foreground">
                        {timeAgo(c.last_message.created_at)}
                      </span>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="friends" className="space-y-2">
          {loadingFriends ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : friends.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 p-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Users className="h-7 w-7" />
              </span>
              <p className="text-sm text-muted-foreground">
                Você não está seguindo ninguém. Visite a aba Explorar!
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {friends.map((friend) => (
                <Card
                  key={friend.id}
                  className="flex items-center gap-3 p-3 hover:bg-accent/40"
                >
                  <Link to={`/u/${friend.username}`} className="flex-1">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={friend.avatar_url}
                        fallback={initials(
                          friend.display_name || friend.username
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">
                          {friend.display_name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          @{friend.username}
                        </p>
                      </div>
                    </div>
                  </Link>
                  <Button
                    size="sm"
                    onClick={() => startConversation(friend.id)}
                    variant="outline"
                  >
                    Conversar
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ConversationView({ conversationId }: { conversationId: string }) {
  const { myId, fetchMessages, sendMessage, fetchConversations } = useVozZap();
  const { toast } = useApp();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [convo, setConvo] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingChannelRef = useRef<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [msgs, convos] = await Promise.all([
        fetchMessages(conversationId),
        fetchConversations(),
      ]);
      setMessages(msgs);
      setConvo(convos.find((c) => c.id === conversationId) ?? null);
    } catch {
      toast({ title: "Erro ao carregar conversa", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [conversationId, fetchMessages, fetchConversations, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) =>
            prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
          );
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    // Create and subscribe to typing channel once
    const typingChannel = supabase
      .channel("typing_broadcast")
      .on("broadcast", { event: "typing" }, (payload) => {
        console.debug("[typing-broadcast][conversation-view] payload:", payload);
        if (
          payload.payload.userId !== myId &&
          payload.payload.conversationId === conversationId
        ) {
          setIsOtherTyping(true);
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            setIsOtherTyping(false);
          }, 3000);
        }
      })
      .subscribe();

    typingChannelRef.current = typingChannel;

    return () => {
      void supabase.removeChannel(typingChannel);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId, myId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setText("");
    try {
      await sendMessage(conversationId, content);
      await load();
    } catch {
      toast({ title: "Erro ao enviar", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleTextChange = (value: string) => {
    setText(value);
    if (value.trim() && typingChannelRef.current) {
      console.log("[typing-sender] Sending typing event");
      typingChannelRef.current.send("broadcast", {
        event: "typing",
        payload: { userId: myId, conversationId },
      });
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-3.5rem-3.5rem)] max-w-2xl flex-col">
      <div className="flex items-center gap-2 border-b border-border p-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/chat")}
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        {convo?.other_user ? (
          <Link
            to={`/u/${convo.other_user.username}`}
            className="flex items-center gap-2"
          >
            <Avatar
              className="h-9 w-9"
              src={convo.other_user.avatar_url}
              fallback={initials(
                convo.other_user.display_name || convo.other_user.username
              )}
            />
            <span className="font-semibold">
              {convo.other_user.display_name}
            </span>
          </Link>
        ) : (
          <span className="font-semibold">Conversa</span>
        )}
      </div>

      <div className="vz-scrollbar flex-1 space-y-2 overflow-y-auto p-4">
        {loading ? (
          <>
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="ml-auto h-10 w-1/2" />
          </>
        ) : messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma mensagem ainda. Diga olá!
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === myId;
            return (
              <div
                key={m.id}
                className={cn("flex", mine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                    mine
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm bg-muted text-foreground"
                  )}
                >
                  <p>{m.content}</p>
                  <p
                    className={cn(
                      "mt-1 text-[10px]",
                      mine
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    )}
                  >
                    {timeAgo(m.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        {isOtherTyping && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '0ms' }} />
                <span className="inline-block h-3 w-3 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '150ms' }} />
                <span className="inline-block h-3 w-3 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={submit}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <Input
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Mensagem..."
          maxLength={1000}
        />
        <Button type="submit" size="icon" disabled={sending || !text.trim()}>
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}

export function ChatPage() {
  const { conversationId } = useParams();
  if (conversationId) {
    return <ConversationView conversationId={conversationId} />;
  }
  return <ConversationList />;
}
