import Hero from "@/components/Hero";
import Ticker from "@/components/Ticker";
import NewsGrid from "@/components/NewsGrid";
import Newsletter from "@/components/Newsletter";

export default function Home() {
  return (
    <main className="min-h-screen text-white selection:bg-geo-gold selection:text-black">
      <div className="fixed top-0 z-50 w-full">
        <Ticker />
        <nav className="flex items-center justify-between border-b border-white/10 bg-geo-dark/80 px-4 py-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-geo-gold to-yellow-600" />
            <span className="text-xl font-bold tracking-tighter">GEOMONEY TV</span>
          </div>
          <div className="hidden items-center gap-8 text-sm font-medium text-gray-300 sm:flex">
            <a href="#" className="hover:text-white">Reports</a>
            <a href="#" className="hover:text-white">Academy</a>
            <a href="#" className="hover:text-white">Institute</a>
            <a href="#" className="hover:text-white">Media Desk</a>
          </div>
          <button className="rounded-full border border-white/20 px-4 py-1.5 text-sm font-medium hover:bg-white/10">
            Subscribe
          </button>
        </nav>
      </div>
      
      <Hero />
      <NewsGrid />
      <Newsletter />
      
      <footer className="border-t border-white/10 bg-black py-12 text-center text-sm text-gray-500">
        <p>© 2025 GeoMoney TV. All rights reserved.</p>
      </footer>
    </main>
  );
}
