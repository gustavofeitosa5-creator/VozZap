import { useApp } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export function Toaster() {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="pointer-events-none fixed bottom-20 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 sm:bottom-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg",
            t.variant === "destructive"
              ? "border-destructive bg-destructive text-destructive-foreground"
              : t.variant === "success"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-card-foreground"
          )}
        >
          <span className="mt-0.5">
            {t.variant === "destructive" ? (
              <AlertCircle className="h-5 w-5" />
            ) : t.variant === "success" ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <Info className="h-5 w-5" />
            )}
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold">{t.title}</p>
            {t.description && (
              <p className="text-sm opacity-90">{t.description}</p>
            )}
          </div>
          <button onClick={() => dismissToast(t.id)} aria-label="Fechar">
            <X className="h-4 w-4 opacity-70 hover:opacity-100" />
          </button>
        </div>
      ))}
    </div>
  );
}
