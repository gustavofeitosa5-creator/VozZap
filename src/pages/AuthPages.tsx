import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mic, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { slugifyUsername } from "@/lib/utils";

function Brand() {
  return (
    <div className="mb-6 flex flex-col items-center gap-2">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <Mic className="h-7 w-7" />
      </span>
      <h1 className="text-2xl font-bold tracking-tight">
        Voz<span className="text-primary">Zap</span>
      </h1>
      <p className="text-sm text-muted-foreground">
        A rede social dos áudios curtos
      </p>
    </div>
  );
}

export function LoginPage() {
  const { isConfigured, toast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured) {
      toast({
        title: "Supabase não configurado",
        description: "Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Falha no login", description: error.message, variant: "destructive" });
      return;
    }
    navigate(from, { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <Brand />
        <Card>
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  required
                   autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  required
                   autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <div className="text-right">
                  <button type="button" className="text-sm text-primary hover:underline" onClick={() => setForgotOpen(true)}>
                    Esqueceu a senha?
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Entrar
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Não tem conta?{" "}
              <Link to="/register" className="font-medium text-primary hover:underline">
                Criar conta
              </Link>
            </p>
            <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
              <DialogHeader>
                <DialogTitle>Recuperar senha</DialogTitle>
                <DialogDescription>Informe o e-mail para receber um link de redefinição.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <Label htmlFor="forgot-email">E-mail</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                  {/* autocomplete for password recovery */}
                  <input style={{display:'none'}} aria-hidden />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setForgotOpen(false)}>Cancelar</Button>
                  <Button
                    onClick={async () => {
                      if (!forgotEmail) {
                        toast({ title: "Informe um e-mail", variant: "destructive" });
                        return;
                      }
                      setForgotLoading(true);
                      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail);
                      setForgotLoading(false);
                      if (error) {
                        toast({ title: "Erro", description: error.message, variant: "destructive" });
                        return;
                      }
                      toast({ title: "Enviado", description: "Verifique seu e-mail para redefinir a senha.", variant: "success" });
                      setForgotOpen(false);
                    }}
                  >
                    {forgotLoading ? "Enviando..." : "Enviar link"}
                  </Button>
                </div>
              </div>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { isConfigured, toast } = useApp();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured) {
      toast({
        title: "Supabase não configurado",
        description: "Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.",
        variant: "destructive",
      });
      return;
    }
    const cleanUser = slugifyUsername(username);
    if (cleanUser.length < 3) {
      toast({
        title: "Nome de usuário inválido",
        description: "Use ao menos 3 letras/números.",
        variant: "destructive",
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Senhas não coincidem", variant: "destructive" });
      return;
    }
    setLoading(true);

    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", cleanUser)
      .maybeSingle();
    if (existing) {
      setLoading(false);
      toast({ title: "Usuário já em uso", variant: "destructive" });
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error || !data.user) {
      setLoading(false);
      toast({
        title: "Falha no cadastro",
        description: error?.message,
        variant: "destructive",
      });
      return;
    }

    const { error: profErr } = await supabase.from("profiles").insert({
      id: data.user.id,
      username: cleanUser,
      display_name: displayName.trim() || cleanUser,
      bio: null,
      avatar_url: null,
    });
    setLoading(false);

    if (profErr) {
      toast({
        title: "Conta criada, mas houve um erro no perfil",
        description: profErr.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Conta criada!", variant: "success" });
    }

    if (data.session) {
      navigate("/", { replace: true });
    } else {
      toast({
        title: "Confirme seu e-mail",
        description: "Verifique sua caixa de entrada para ativar a conta.",
      });
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm">
        <Brand />
        <Card>
          <CardHeader>
            <CardTitle>Criar conta</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display">Nome</Label>
                <Input
                  id="display"
                  required
                  autoComplete="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Seu nome"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Usuário</Label>
                <Input
                  id="username"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(slugifyUsername(e.target.value))}
                  placeholder="seu_usuario"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="remail">E-mail</Label>
                <Input
                  id="remail"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rpass">Senha</Label>
                <Input
                  id="rpass"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rpass2">Confirmar senha</Label>
                <Input
                  id="rpass2"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Criar conta
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Já tem conta?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Entrar
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
