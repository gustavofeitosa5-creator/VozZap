import { NavLink, useNavigate } from "react-router-dom";
import { Home, Compass, PlusCircle, MessageCircle, User } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const { profile, loading } = useApp();
  const navigate = useNavigate();

  const handleProfileClick = (e: React.MouseEvent) => {
    if (loading || !profile) {
      e.preventDefault();
      return;
    }
    navigate(`/u/${profile.username}`);
  };

  const items = [
    { to: "/", label: "Início", icon: Home, end: true },
    { to: "/explore", label: "Explorar", icon: Compass, end: false },
    { to: "/new", label: "Postar", icon: PlusCircle, end: false },
    { to: "/chat", label: "Chat", icon: MessageCircle, end: false },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-stretch justify-around">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <NavLink
              key={it.label}
              to={it.to}
              end={it.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              <Icon className="h-5 w-5" />
              <span>{it.label}</span>
            </NavLink>
          );
        })}
        
        {/* Botão de perfil com navegação customizada */}
        <button
          onClick={handleProfileClick}
          disabled={loading}
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs transition-colors border-0 bg-transparent",
            !profile
              ? "text-muted-foreground hover:text-foreground cursor-pointer"
              : "text-muted-foreground hover:text-foreground cursor-pointer",
            loading && "opacity-50 cursor-not-allowed"
          )}
          type="button"
        >
          <User className="h-5 w-5" />
          <span>Perfil</span>
        </button>
      </div>
    </nav>
  );
}
