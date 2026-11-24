import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth-context";
import { Brand } from "@/components/workspace/shared";
import { errorMessage } from "@/lib/business";

export const Route = createFileRoute("/auth")({
  beforeLoad: ({ context }) => {
    if (context.auth?.user) throw redirect({ to: "/painel" });
  },
  component: AuthPage,
});

function AuthPage() {
  return (
    <div className="auth-layout">
      <div className="auth-inner">
        <div className="flex justify-center">
          <Brand light={false} />
        </div>
        <AuthForm />
      </div>
    </div>
  );
}

function AuthForm() {
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { name: name.trim() } },
        });
        if (error) throw error;
        setNotice("Conta criada! Você já pode entrar com seu e-mail e senha.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      }
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  if (user) {
    return (
      <div className="auth-form">
        <Button type="button" disabled asChild>
          <span>
            <Loader2 className="size-4 animate-spin" /> Preparando seu espaço...
          </span>
        </Button>
      </div>
    );
  }

  return (
    <>
      <h1>{mode === "signin" ? "Entrar na conta" : "Criar minha conta"}</h1>
      <p className="auth-subtitle">
        {mode === "signin"
          ? "Bem-vindo de volta. Seu negócio continua em ordem."
          : "Comece a organizar seus clientes, orçamentos e seu dinheiro."}
      </p>
      <form className="auth-form" onSubmit={submit}>
        {mode === "signup" && (
          <label className="form-field">
            Seu nome
            <input
              type="text"
              required
              autoComplete="name"
              placeholder="Como você se chama"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
        )}
        <label className="form-field">
          E-mail
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="voce@exemplo.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="form-field">
          Senha
          <span className="relative block">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              placeholder="Pelo menos 6 caracteres"
              className="pr-11"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </span>
        </label>
        {error && (
          <p role="alert" className="text-xs font-medium text-destructive">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="text-xs font-medium text-success">
            {notice}
          </p>
        )}
        <Button type="submit" disabled={busy} className="h-10 text-sm">
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Aguarde...
            </>
          ) : mode === "signin" ? (
            "Entrar"
          ) : (
            "Criar conta"
          )}
        </Button>
      </form>
      <p className="auth-switch">
        {mode === "signin" ? "Ainda não tem conta? " : "Já tem uma conta? "}
        <button
          type="button"
          className="font-semibold text-primary underline-offset-2 hover:underline"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setNotice(null);
          }}
        >
          {mode === "signin" ? "Criar agora" : "Entrar"}
        </button>
      </p>
    </>
  );
}
