import { useState, useEffect } from "react";
import { useVozZap } from "@/hooks/useVozZap";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import type { Profile } from "@/types";
import { cn, initials } from "@/lib/utils";

interface CloseFriendsModalProps {
  userId: string;
}

export function CloseFriendsModal({ userId }: CloseFriendsModalProps) {
  const { myId, removeCloseFriend, fetchCloseFriends } = useVozZap();
  const { toast } = useApp();
  const [open, setOpen] = useState(false);
  const [closeFriends, setCloseFriends] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    loadCloseFriends();
  }, [open]);

  const loadCloseFriends = async () => {
    setLoading(true);
    try {
      const friends = await fetchCloseFriends(userId);
      setCloseFriends(friends);
    } catch (err) {
      toast({
        title: "Erro ao carregar melhores amigos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (closeFriendId: string) => {
    try {
      await removeCloseFriend(closeFriendId);
      setCloseFriends((prev) => prev.filter((cf) => cf.id !== closeFriendId));
      toast({ title: "Removido dos melhores amigos", variant: "success" });
    } catch (err) {
      toast({
        title: "Erro ao remover",
        variant: "destructive",
      });
    }
  };

  // Apenas mostrar se for o próprio usuário
  if (myId !== userId) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          💚 Melhores amigos
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Melhores Amigos</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : closeFriends.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum melhor amigo ainda
          </p>
        ) : (
          <div className="space-y-3">
            {closeFriends.map((friend) => (
              <div key={friend.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={friend.avatar_url}
                    fallback={initials(friend.display_name || friend.username || "?")}
                  />
                  <div>
                    <p className="font-semibold">{friend.display_name}</p>
                    <p className="text-xs text-muted-foreground">
                      @{friend.username}
                    </p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemove(friend.id)}
                >
                  Remover
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
