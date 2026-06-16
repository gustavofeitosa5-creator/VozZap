import { useEffect, useRef, useState } from "react";
import { Mic, Square, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { formatDuration } from "@/lib/utils";

export interface RecordedAudio {
  blob: Blob;
  url: string;
  ext: string;
  duration: number;
}

interface AudioUploaderProps {
  value: RecordedAudio | null;
  onChange: (audio: RecordedAudio | null) => void;
}

export function AudioUploader({ value, onChange }: AudioUploaderProps) {
  const { toast } = useApp();
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mr.mimeType || "audio/webm",
        });
        const url = URL.createObjectURL(blob);
        const duration = (Date.now() - startRef.current) / 1000;
        onChange({ blob, url, ext: "webm", duration });
        stream.getTracks().forEach((t) => t.stop());
      };
      startRef.current = Date.now();
      setElapsed(0);
      mr.start();
      recorderRef.current = mr;
      setRecording(true);
      timerRef.current = setInterval(() => {
        setElapsed((Date.now() - startRef.current) / 1000);
      }, 200);
    } catch {
      toast({
        title: "Microfone indisponível",
        description: "Permita o acesso ao microfone ou envie um arquivo.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "mp3";
    const audio = new Audio(url);
    audio.onloadedmetadata = () => {
      onChange({
        blob: file,
        url,
        ext,
        duration: Number.isFinite(audio.duration) ? audio.duration : 0,
      });
    };
    audio.onerror = () => {
      onChange({ blob: file, url, ext, duration: 0 });
    };
  };

  const clear = () => {
    if (value) URL.revokeObjectURL(value.url);
    onChange(null);
    setElapsed(0);
  };

  if (value) {
    return (
      <div className="space-y-3 rounded-lg border border-border bg-accent/40 p-4">
        <audio src={value.url} controls className="w-full" />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Duração: {formatDuration(value.duration)}</span>
          <Button type="button" variant="ghost" size="sm" onClick={clear}>
            <Trash2 className="h-4 w-4" /> Remover
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border p-8">
        {recording ? (
          <>
            <div className="flex items-center gap-2 text-destructive">
              <span className="h-3 w-3 animate-pulse rounded-full bg-destructive" />
              <span className="font-mono text-lg">{formatDuration(elapsed)}</span>
            </div>
            <Button
              type="button"
              variant="destructive"
              onClick={stopRecording}
            >
              <Square className="h-4 w-4" /> Parar gravação
            </Button>
          </>
        ) : (
          <>
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Mic className="h-7 w-7" />
            </span>
            <p className="text-sm text-muted-foreground">
              Grave um áudio ou envie um arquivo
            </p>
            <Button type="button" onClick={startRecording}>
              <Mic className="h-4 w-4" /> Gravar
            </Button>
          </>
        )}
      </div>

      <div className="flex items-center justify-center">
        <input
          ref={fileRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleFile}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={recording}
        >
          <Upload className="h-4 w-4" /> Enviar arquivo
        </Button>
      </div>
    </div>
  );
}
