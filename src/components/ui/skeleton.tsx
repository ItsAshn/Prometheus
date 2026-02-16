import { component$, useStylesScoped$ } from "@builder.io/qwik";
import styles from "./skeleton.css?inline";

interface SkeletonProps {
  variant?: "text" | "title" | "thumbnail" | "avatar" | "button" | "card";
  width?: string;
  height?: string;
  className?: string;
}

export const Skeleton = component$<SkeletonProps>(
  ({ variant = "text", width, height, className = "" }) => {
    useStylesScoped$(styles);

    const style = {
      width: width || undefined,
      height: height || undefined,
    };

    return (
      <div
        class={`skeleton skeleton-${variant} ${className}`}
        style={style}
        aria-label="Loading content"
        role="status"
      >
        <span class="sr-only">Loading...</span>
      </div>
    );
  },
);

// Pre-built skeleton layouts for common use cases

export const VideoCardSkeleton = component$(() => {
  useStylesScoped$(styles);

  return (
    <div class="video-card-skeleton">
      <Skeleton variant="thumbnail" />
      <div class="video-card-skeleton-content">
        <Skeleton variant="title" width="80%" />
        <Skeleton variant="text" width="60%" />
        <div class="video-card-skeleton-meta">
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
    </div>
  );
});

export const VideoListSkeleton = component$<{ count?: number }>(
  ({ count = 6 }) => {
    return (
      <div class="video-grid">
        {Array.from({ length: count }).map((_, i) => (
          <VideoCardSkeleton key={i} />
        ))}
      </div>
    );
  },
);
