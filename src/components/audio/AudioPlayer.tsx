import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/utils";

interface AudioPlayerProps {
  src: string;
  duration: number;
}

const BAR_COUNT = 40;

export function AudioPlayer({ src, duration }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(duration || 0);

  // Stop & reset audio when the component unmounts (leaving card/page).
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrent(audio.currentTime);
    const onMeta = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setTotal(audio.duration);
      }
    };
    const onEnd = () => {
      setPlaying(false);
      setCurrent(0);
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      void audio.play();
      setPlaying(true);
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !total) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * total;
    setCurrent(audio.currentTime);
  };

  const progress = total > 0 ? current / total : 0;
  const activeBars = Math.round(progress * BAR_COUNT);

  return (
    <div className="flex items-center gap-3 rounded-lg bg-accent/60 p-3">
      <audio ref={audioRef} src={src} preload="metadata" />
      <Button
        type="button"
        size="icon"
        onClick={toggle}
        className="h-11 w-11 shrink-0 rounded-full"
        aria-label={playing ? "Pausar" : "Reproduzir"}
      >
        {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
      </Button>

      <div className="min-w-0 flex-1">
        <div
          className="flex h-10 cursor-pointer items-center gap-[2px]"
          onClick={seek}
        >
          {Array.from({ length: BAR_COUNT }).map((_, i) => {
            const seed = ((i * 37) % 13) / 13;
            const base = 0.3 + seed * 0.7;
            const isActive = i < activeBars;
            return (
              <span
                key={i}
                className="flex-1 rounded-full transition-colors"
                style={{
                  height: `${base * 100}%`,
                  background: isActive
                    ? "hsl(var(--primary))"
                    : "hsl(var(--muted-foreground) / 0.35)",
                  animation:
                    playing && isActive
                      ? `vz-bar 0.9s ease-in-out ${i * 0.03}s infinite`
                      : undefined,
                }}
              />
            );
          })}
        </div>
        <div className="mt-1 flex justify-between text-[11px] font-medium text-muted-foreground">
          <span>{formatDuration(current)}</span>
          <span>{formatDuration(total)}</span>
        </div>
      </div>
    </div>
  );
}
