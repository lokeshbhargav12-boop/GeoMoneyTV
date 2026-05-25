"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ArticleNavigationProps {
  prevSlug: string | null;
  prevTitle: string | null;
  nextSlug: string | null;
  nextTitle: string | null;
}

export default function ArticleNavigation({
  prevSlug,
  prevTitle,
  nextSlug,
  nextTitle,
}: ArticleNavigationProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between gap-4 py-6 border-t border-white/10 mt-8">
      {/* Previous */}
      {prevSlug ? (
        <button
          onClick={() => router.push(`/news/${prevSlug}`)}
          className="group flex items-center gap-3 text-left max-w-[45%]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-400 group-hover:border-geo-gold/40 group-hover:text-geo-gold transition-all">
            <ChevronLeft className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-gray-500">
              Previous
            </span>
            <p className="text-sm font-medium text-gray-300 line-clamp-1 group-hover:text-white transition-colors">
              {prevTitle}
            </p>
          </div>
        </button>
      ) : (
        <div />
      )}

      {/* Next */}
      {nextSlug ? (
        <button
          onClick={() => router.push(`/news/${nextSlug}`)}
          className="group flex items-center gap-3 text-right max-w-[45%] ml-auto"
        >
          <div className="min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-gray-500">
              Next
            </span>
            <p className="text-sm font-medium text-gray-300 line-clamp-1 group-hover:text-white transition-colors">
              {nextTitle}
            </p>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-400 group-hover:border-geo-gold/40 group-hover:text-geo-gold transition-all">
            <ChevronRight className="h-5 w-5" />
          </span>
        </button>
      ) : (
        <div />
      )}
    </div>
  );
}