"use client";

export default function Globe() {
  return (
    <div className="absolute inset-0 h-full w-full overflow-hidden">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="/hero-video.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/images/mining-pit.jpg"
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(8,145,178,0.16),transparent_38%),radial-gradient(circle_at_20%_80%,rgba(249,115,22,0.12),transparent_32%)]" />
      <div className="absolute inset-0 bg-black/60" />
    </div>
  );
}
