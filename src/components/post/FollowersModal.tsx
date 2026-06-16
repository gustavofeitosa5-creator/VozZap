import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import type { Profile } from "@/types";
import { useVozZap } from "@/hooks/useVozZap";
import { useApp } from "@/contexts/AppContext";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { initials } from "@/lib/utils";

interface FollowersModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  title: "Seguidores" | "Seguindo";
  type: "followers" | "following";
}

export function FollowersModal({
  userId,
  isOpen,
  onClose,
  title,
  type,
}: FollowersModalProps) {
  const { fetchFollowers, fetchFollowing, myId, toggleFollow, fetchFollowState } = useVozZap();
  const { toast } = useApp();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [followStates, setFollowStates] = useState<Record<string, boolean>>({});
  const [working, setWorking] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data =
        type === "followers"
          ? await fetchFollowers(userId)
          : await fetchFollowing(userId);
      setProfiles(data);

      // Load follow states for each profile
      const states: Record<string, boolean> = {};
      if (myId) {
        for (const profile of data) {
          const isFollowing = await fetchFollowState(profile.id);
          states[profile.id] = isFollowing;
        }
      }
      setFollowStates(states);
    } catch {
      toast({ title: "Erro ao carregar lista", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [userId, type, fetchFollowers, fetchFollowing, fetchFollowState, myId, toast]);

  useEffect(() => {
    if (isOpen) {
      void load();
    }
  }, [isOpen, load]);

  const handleToggleFollow = async (profileId: string) => {
    if (!myId || myId === profileId) return;
    setWorking((prev) => ({ ...prev, [profileId]: true }));
    const wasFollowing = followStates[profileId];
    setFollowStates((prev) => ({ ...prev, [profileId]: !prev[profileId] }));
    try {
      await toggleFollow(profileId, wasFollowing);
    } catch {
      setFollowStates((prev) => ({ ...prev, [profileId]: wasFollowing }));
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    } finally {
      setWorking((prev) => ({ ...prev, [profileId]: false }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogHeader>
        <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
      </DialogHeader>
      <div className="max-h-[60vh] overflow-y-auto mt-4">
        {loading ? (
          <div className="space-y-3 p-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum {type === "followers" ? "seguidor" : "seguido"} ainda
            </p>
          </div>
        ) : (
          <ul className="space-y-3 p-2">
            {profiles.map((profile) => (
              <li
                key={profile.id}
                className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted"
              >
                <Link to={`/u/${profile.username}`} onClick={onClose}>
                  <Avatar
                    src={profile.avatar_url}
                    fallback={initials(profile.display_name || profile.username)}
                    className="h-10 w-10"
                  />
                </Link>
                <Link
                  to={`/u/${profile.username}`}
                  onClick={onClose}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-semibold truncate">
                    {profile.display_name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    @{profile.username}
                  </p>
                </Link>
                {myId && myId !== profile.id && (
                  <Button
                    size="sm"
                    variant={followStates[profile.id] ? "outline" : "default"}
                    onClick={() => handleToggleFollow(profile.id)}
                    disabled={working[profile.id]}
                    className="flex-shrink-0"
                  >
                    {working[profile.id] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : followStates[profile.id] ? (
                      "Seguindo"
                    ) : (
                      "Seguir"
                    )}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Dialog>
  );
}
