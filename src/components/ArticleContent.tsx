"use client";

import { useState, useEffect } from "react";
import { Loader2, Sparkles } from "lucide-react";
import NewsAnalysis from "./NewsAnalysis";

// ── Content Formatting Helpers ────────────────────────────────────────────────

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&hellip;/g, "…")
    .replace(/&lsquo;|&#8216;/g, "\u2018")
    .replace(/&rsquo;|&#8217;/g, "\u2019")
    .replace(/&ldquo;|&#8220;/g, "\u201C")
    .replace(/&rdquo;|&#8221;/g, "\u201D")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
}

function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]*>/g, "");
}

function renderInline(text: string): React.ReactNode {
  // Handle **bold** and __bold__
  const parts = text.split(/(\*\*[^*\n]+\*\*|__[^_\n]+__)/g);
  if (parts.length === 1) return <>{text}</>;
  return (
    <>
      {parts.map((part, i) => {
        if (
          (part.startsWith("**") && part.endsWith("**")) ||
          (part.startsWith("__") && part.endsWith("__"))
        ) {
          return (
            <strong key={i} className="font-semibold text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function renderFormattedContent(raw: string): React.ReactNode {
  const text = decodeHtmlEntities(stripHtmlTags(raw)).trim();
  const blocks = text.split(/\n{2,}/);

  return (
    <>
      {blocks.map((block, blockIdx) => {
        const lines = block.split("\n").filter((l) => l.trim() !== "");
        if (lines.length === 0) return null;

        // ── Markdown headers: # / ## / ###
        if (lines.length === 1) {
          const mdHeader = lines[0].match(/^(#{1,3})\s+(.+)$/);
          if (mdHeader) {
            const level = mdHeader[1].length;
            const headerText = mdHeader[2].trim();
            const sizeClass =
              level === 1 ? "text-xl" : level === 2 ? "text-lg" : "text-base";
            return (
              <h3
                key={blockIdx}
                className={`${sizeClass} font-semibold text-geo-gold mt-8 mb-3 tracking-wide`}
              >
                {headerText}
              </h3>
            );
          }
        }

        // ── Bullet list block: every line starts with - / • / * / ·
        const bulletPattern = /^[-•*·]\s+/;
        const numberedPattern = /^\d+[.)]\s+/;
        const isBulletList = lines.every((l) => bulletPattern.test(l.trim()));
        const isNumberedList =
          !isBulletList && lines.every((l) => numberedPattern.test(l.trim()));

        if (isBulletList) {
          return (
            <ul
              key={blockIdx}
              className="mb-6 list-disc list-outside pl-6 space-y-2"
            >
              {lines.map((line, i) => (
                <li
                  key={i}
                  className="text-[17px] text-gray-200 font-light tracking-wide leading-[1.8]"
                >
                  {renderInline(line.replace(bulletPattern, "").trim())}
                </li>
              ))}
            </ul>
          );
        }

        if (isNumberedList) {
          return (
            <ol
              key={blockIdx}
              className="mb-6 list-decimal list-outside pl-6 space-y-2"
            >
              {lines.map((line, i) => (
                <li
                  key={i}
                  className="text-[17px] text-gray-200 font-light tracking-wide leading-[1.8]"
                >
                  {renderInline(line.replace(numberedPattern, "").trim())}
                </li>
              ))}
            </ol>
          );
        }

        // ── Regular paragraph (with inline br for single line breaks)
        return (
          <p
            key={blockIdx}
            className="mb-6 leading-[1.8] text-[17px] text-gray-200 font-light tracking-wide"
          >
            {lines.map((line, lineIdx) => (
              <span key={lineIdx}>
                {renderInline(line)}
                {lineIdx < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </>
  );
}

interface ArticleContentProps {
  articleId: string;
  content: string;
  aiSummary: string | null;
  title: string;
}

export default function ArticleContent({
  articleId,
  content,
  aiSummary,
  title,
}: ArticleContentProps) {
  const [displayContent, setDisplayContent] = useState<string>(
    aiSummary || content,
  );
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [isAiGenerated, setIsAiGenerated] = useState(!!aiSummary);

  const cleanedContent = content.replace(/\[\+\d+ chars\]$/, "").trim();
  const isTruncated =
    cleanedContent.match(/\[\+\d+ chars\]$/) ||
    cleanedContent.endsWith("...") ||
    cleanedContent.length < 300;

  useEffect(() => {
    if (aiSummary) {
      setDisplayContent(aiSummary);
      setIsAiGenerated(true);
    } else if (isTruncated) {
      generateAiSummary();
    } else {
      setDisplayContent(cleanedContent);
    }
  }, [articleId]);

  const generateAiSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.summary) {
          setDisplayContent(data.summary);
          setIsAiGenerated(true);
        }
      }
    } catch (error) {
      console.error("Failed to generate AI summary:", error);
    } finally {
      setLoadingSummary(false);
    }
  };

  const finalContent = displayContent || cleanedContent;

  return (
    <>
      {/* AI Analysis — Full Width, Below Article */}
      <div className="mb-12">
        <NewsAnalysis
          title={title}
          text={finalContent}
          articleId={articleId}
          className="shadow-2xl shadow-black/80"
        />
      </div>

      {/* Article Body */}
      <div className="mb-12">
        {loadingSummary && (
          <div className="flex items-center gap-3 mb-6 p-4 bg-geo-gold/10 border border-geo-gold/20 rounded-xl">
            <Loader2 className="w-5 h-5 animate-spin text-geo-gold" />
            <div>
              <p className="text-sm font-semibold text-white">
                Generating full article with AI...
              </p>
              <p className="text-xs text-gray-400">
                This will be cached for future visits
              </p>
            </div>
          </div>
        )}

        {isAiGenerated && !loadingSummary && (
          <div className="flex items-center gap-2 mb-6 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <p className="text-xs text-purple-300">
              AI-enhanced article — original source was truncated. Full analysis
              generated by GeoMoney AI.
            </p>
          </div>
        )}

        <div className="prose prose-invert prose-lg max-w-none">
          {renderFormattedContent(finalContent)}
        </div>
      </div>
    </>
  );
}
