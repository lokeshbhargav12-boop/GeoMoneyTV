"use client";

import { useState, useEffect } from "react";
import Globe from "./Globe";
import { Play } from "lucide-react";
import AiAssistant from "./AiAssistant";

export default function Hero() {
  const [text, setText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  const fullText = "How energy, resources, and markets shape the global order";
  const highlightStart = "How energy, resources, and markets ".length;

  useEffect(() => {
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setIsTypingComplete(true);
        setShowCursor(false);
      }
    }, 50);

    return () => clearInterval(typingInterval);
  }, []);

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-20 text-center sm:px-6 lg:px-8">
      <Globe />

      <div className="relative z-10 flex h-full w-full max-w-7xl flex-col justify-between py-12 pb-32">
        {/* Main Content */}

        <div className="mt-10 flex flex-1 flex-col items-center justify-center space-y-6">
          <div className="animate-fade-in-up space-y-4">
            <h1 className="text-6xl font-black tracking-tighter sm:text-8xl uppercase relative z-20">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-yellow-200 via-geo-gold to-yellow-700 drop-shadow-[0_0_15px_rgba(212,175,55,0.5)] filter">
                Global Power & Money
              </span>
              {/* <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-yellow-200 via-geo-gold to-yellow-700 drop-shadow-[0_0_15px_rgba(212,175,55,0.5)] filter">
                
              </span> */}
            </h1>

            <div className="mx-auto max-w-3xl text-xl text-gray-300 sm:text-2xl font-light tracking-wide drop-shadow-md min-h-[6rem]">
              <p>
                {text.slice(0, highlightStart)}
                <span
                  className={`${text.length > highlightStart ? "bg-geo-gold text-black px-1 font-medium" : ""}`}
                >
                  {text.slice(highlightStart)}
                </span>
                {showCursor && <span className="animate-pulse">|</span>}
              </p>
            </div>
          </div>
        </div>

        {/* AI Navigation */}
        <div className="mt-auto w-full z-20">
          <AiAssistant />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-geo-dark to-transparent" />
    </section>
  );
}
