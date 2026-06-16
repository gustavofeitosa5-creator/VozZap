import * as React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  fallback: string;
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, fallback, ...props }, ref) => {
    const [errored, setErrored] = React.useState(false);
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-secondary text-secondary-foreground",
          className
        )}
        {...props}
      >
        {src && !errored ? (
          <img
            src={src}
            alt={fallback}
            onError={() => setErrored(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-sm font-semibold">
            {fallback}
          </span>
        )}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";
