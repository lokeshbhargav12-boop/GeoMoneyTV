import Globe from "./Globe";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-20 text-center sm:px-6 lg:px-8">
      <Globe />
      
      <div className="relative z-10 max-w-4xl space-y-8">
        <div className="animate-fade-in-up space-y-4">
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-geo-gold/30 bg-geo-gold/10 px-4 py-1 text-sm font-medium text-geo-gold backdrop-blur-sm">
            <span>↑ USDollar Index 1034 ↑</span>
            <span className="mx-2 text-white/20">|</span>
            <span>Gold $2.428 ↑</span>
            <span className="mx-2 text-white/20">|</span>
            <span>BRICS Index 92.7 ↑</span>
          </div>
          
          <h1 className="text-5xl font-bold tracking-tight text-white sm:text-7xl">
            Decode Power. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              Follow Money.
            </span> <br />
            Understand the Future.
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg text-gray-300 sm:text-xl">
            Strategic intelligence for decision makers worldwide.
            Decoding economics & geopolitics for the investor-ready professional.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button className="group flex items-center gap-2 rounded-full bg-blue-600 px-8 py-3 text-lg font-semibold text-white transition-all hover:bg-blue-700">
            Watch Now
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>
          <button className="rounded-full border border-white/20 bg-white/5 px-8 py-3 text-lg font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10">
            Join the Intelligence Brief
          </button>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-geo-dark to-transparent" />
    </section>
  );
}
