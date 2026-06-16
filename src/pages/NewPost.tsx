import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Send } from "lucide-react";
import { useVozZap } from "@/hooks/useVozZap";
import { useApp } from "@/contexts/AppContext";
import {
  AudioUploader,
  type RecordedAudio,
} from "@/components/audio/AudioUploader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PostVisibility } from "@/types";

const VISIBILITY_OPTIONS: { value: PostVisibility; label: string; emoji: string }[] = [
  { value: "public", label: "Público", emoji: "🌐" },
  { value: "friends_only", label: "Apenas amigos", emoji: "👥" },
  { value: "close_friends", label: "Melhores amigos", emoji: "💚" },
];

export function NewPost() {
  const { uploadAudio, createPost } = useVozZap();
  const { toast } = useApp();
  const navigate = useNavigate();
  const [audio, setAudio] = useState<RecordedAudio | null>(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("");
  const [visibility, setVisibility] = useState<PostVisibility>("public");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audio) {
      toast({ title: "Grave ou envie um áudio primeiro", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const url = await uploadAudio(audio.blob, audio.ext);
      await createPost(
        url,
        audio.duration,
        caption,
        title || null,
        category || null,
        visibility
      );
      toast({ title: "Áudio publicado!", variant: "success" });
      navigate("/");
    } catch (err) {
      toast({
        title: "Erro ao publicar",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-4">
      <Card>
        <CardHeader>
          <CardTitle>Novo áudio</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-5">
            <AudioUploader value={audio} onChange={setAudio} />

            <div className="space-y-2">
              <Label htmlFor="title">Título (opcional)</Label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                placeholder="Dê um título ao seu áudio..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="text-right text-xs text-muted-foreground">
                {title.length}/100
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="caption">Legenda (opcional)</Label>
              <textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={280}
                rows={3}
                placeholder="Conte algo sobre seu áudio..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="text-right text-xs text-muted-foreground">
                {caption.length}/280
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria (opcional)</Label>
              <input
                id="category"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                maxLength={50}
                placeholder="#música #podcast #comédia"
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="text-xs text-muted-foreground">
                Use # para criar hashtags
              </p>
            </div>

            <div className="space-y-3">
              <Label>Visibilidade</Label>
              <div className="grid grid-cols-1 gap-2">
                {VISIBILITY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setVisibility(option.value)}
                    className={`flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all ${
                      visibility === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value={option.value}
                      checked={visibility === option.value}
                      onChange={() => {}}
                      className="h-4 w-4"
                    />
                    <span className="text-lg">{option.emoji}</span>
                    <span className="font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={submitting || !audio}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Publicar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
