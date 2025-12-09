import { Play, FileText, TrendingUp } from "lucide-react";

const newsItems = [
  {
    title: "How BRICS Rewired the Oil Trade",
    category: "GeoMoney Deep Analysis",
    type: "video",
    duration: "3:16",
    image: "bg-blue-900", // Placeholder for image
  },
  {
    title: "India's Energy War Playbook",
    category: "GeoMoney Deep Analysis",
    type: "video",
    duration: "3:47",
    image: "bg-orange-900",
  },
  {
    title: "AI and the New Power Economy",
    category: "GeoMoney Deep Analysis",
    type: "video",
    duration: "4:02",
    image: "bg-purple-900",
  },
];

const features = [
  {
    title: "GeoMoney App",
    subtitle: "Launching Q1 2026",
    icon: "mobile",
  },
  {
    title: "Analytics Dashboard",
    subtitle: "Real-Time Global Macro Tracker",
    icon: "chart",
  },
  {
    title: "Power Pulse Newsletter",
    subtitle: "Join 120K+ Readers",
    icon: "mail",
  },
  {
    title: "Weekly Intelligence Brief",
    subtitle: "Inboxes of Decision Makers",
    icon: "file",
  },
];

export default function NewsGrid() {
  return (
    <section className="bg-geo-dark px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-16">
        
        {/* Feature Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <div
              key={i}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 transition-all hover:border-geo-gold/50 hover:bg-white/10"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 group-hover:text-blue-300">
                {feature.icon === "mobile" && <div className="h-6 w-4 rounded border-2 border-current" />}
                {feature.icon === "chart" && <TrendingUp className="h-6 w-6" />}
                {feature.icon === "mail" && <div className="h-6 w-6 rounded-full border-2 border-current" />}
                {feature.icon === "file" && <FileText className="h-6 w-6" />}
              </div>
              <h3 className="text-lg font-bold text-white">{feature.title}</h3>
              <p className="text-sm text-gray-400">{feature.subtitle}</p>
            </div>
          ))}
        </div>

        {/* Latest Reports */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-white">Latest Reports</h2>
            <button className="text-sm font-medium text-geo-gold hover:text-white">View All →</button>
          </div>
          
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {newsItems.map((item, i) => (
              <div key={i} className="group cursor-pointer space-y-4">
                <div className={`relative aspect-video w-full overflow-hidden rounded-xl ${item.image} border border-white/10 transition-all group-hover:border-geo-gold/50`}>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                      <Play className="ml-1 h-6 w-6 text-white" fill="currentColor" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    {item.duration}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white group-hover:text-geo-gold">{item.title}</h3>
                  <p className="text-sm text-gray-400">{item.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
