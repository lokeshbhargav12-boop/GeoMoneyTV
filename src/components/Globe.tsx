"use client";

export default function Globe() {
  return (
    <div className="absolute inset-0 h-full w-full overflow-hidden">
      {/* Hero background video */}
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
      {/* Dark overlay to keep text readable */}
      <div className="absolute inset-0 bg-black/60" />
    </div>
  );
}
