import { Link, useNavigate } from "react-router-dom";
import { Mic, Moon, Sun, LogOut, User as UserIcon } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/utils";

export function Header() {
  const { profile, theme, toggleTheme, signOut } = useApp();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Mic className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight">
            Voz<span className="text-primary">Zap</span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Tema">
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {profile && (
            <DropdownMenu
              trigger={
                <button aria-label="Menu do usuário">
                  <Avatar
                    src={profile.avatar_url}
                    fallback={initials(profile.display_name || profile.username)}
                    className="h-9 w-9 cursor-pointer"
                  />
                </button>
              }
            >
              <DropdownMenuItem
                onClick={() => navigate(`/u/${profile.username}`)}
              >
                <UserIcon className="h-4 w-4" /> Meu perfil
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate("/profile/edit")}
              >
                <UserIcon className="h-4 w-4" /> Editar perfil
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={async () => {
                  await signOut();
                  navigate("/login");
                }}
              >
                <LogOut className="h-4 w-4" /> Sair
              </DropdownMenuItem>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
