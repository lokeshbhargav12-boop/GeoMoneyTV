"use client";

import { useState, useRef } from "react";
import { clsx } from "clsx";

interface NewsImageProps {
  src?: string;
  alt: string;
  className?: string;
  fill?: boolean;
}

export default function NewsImage({
  src,
  alt,
  className,
  fill = false,
}: NewsImageProps) {
  const [error, setError] = useState(false);
  const [needsContain, setNeedsContain] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Default fallback image (GeoMoney Intel placeholder)
  const fallbackSrc =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCA4MDAgNDAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzExMSIgLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzMzMyIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+R0VPTU9ORVkgSU5URUw8L3RleHQ+PC9zdmc+";

  const handleLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    // If the image is very wide relative to its height (banner/logo aspect ratio > 3:1),
    // switch to contain mode so it isn't zoomed in unpleasantly.
    const ratio = img.naturalWidth / img.naturalHeight;
    if (ratio > 3) setNeedsContain(true);
  };

  if (error || !src) {
    return (
      <div
        className={clsx(
          "relative overflow-hidden bg-gray-900 flex items-center justify-center",
          className,
        )}
      >
        <img
          src={fallbackSrc}
          alt={alt}
          className="w-full h-full object-cover opacity-100"
        />
      </div>
    );
  }

  if (needsContain) {
    // Blurred-backdrop pattern: blurred copy fills the container, sharp image
    // is centred with object-contain so the full logo/banner is always visible.
    return (
      <div
        className={clsx(
          "relative overflow-hidden bg-gray-900 flex items-center justify-center",
          className,
        )}
      >
        {/* blurred background fill */}
        <img
          src={src}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-40 pointer-events-none select-none"
        />
        {/* sharp foreground image */}
        <img
          src={src}
          alt={alt}
          className="relative z-10 max-w-full max-h-full object-contain"
          onError={() => setError(true)}
        />
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      className={className}
      onLoad={handleLoad}
      onError={() => setError(true)}
    />
  );
}
