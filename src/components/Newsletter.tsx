export default function Newsletter() {
  return (
    <section className="relative overflow-hidden border-t border-white/10 bg-geo-dark px-4 py-24 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-geo-dark to-geo-dark" />
      
      <div className="relative mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Join 120,000+ Professionals Worldwide
        </h2>
        <p className="mt-4 text-lg text-gray-400">
          Get the GeoMoney Weekly Intelligence Brief – crisp insights, no noise.
        </p>
        
        <form className="mt-8 flex flex-col gap-4 sm:flex-row">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm focus:border-geo-gold focus:outline-none focus:ring-1 focus:ring-geo-gold"
            required
          />
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Subscribe Now
          </button>
        </form>
        
        <div className="mt-8 flex items-center justify-center gap-8 opacity-50 grayscale">
           {/* Partner Logos Placeholder */}
           <span className="text-xl font-bold text-white">Bloomberg</span>
           <span className="text-xl font-bold text-white">PwC</span>
           <span className="text-xl font-bold text-white">ThinkMarkets</span>
        </div>
      </div>
    </section>
  );
}
