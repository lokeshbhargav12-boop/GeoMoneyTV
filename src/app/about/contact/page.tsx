import Link from 'next/link'
import { ArrowLeft, Mail, MapPin, MessageSquare } from 'lucide-react'

export const metadata = {
  title: 'Contact GeoMoney',
  description: 'For general inquiries, partnerships, or support, contact the GeoMoney team.',
}

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-geo-dark via-black to-geo-dark text-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <Link href="/about" className="inline-flex items-center gap-2 text-gray-400 hover:text-geo-gold transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to About
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <MessageSquare className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Contact GeoMoney</h1>
          </div>
        </div>

        <div className="space-y-8">
          <p className="text-lg text-gray-300 leading-relaxed">
            For general inquiries, partnerships, or support, contact the GeoMoney team.
          </p>

          {/* Email Card */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-geo-gold/30 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <Mail className="w-5 h-5 text-geo-gold" />
              <h3 className="font-bold text-lg">Email</h3>
            </div>
            <a href="mailto:support@geomoneytv.com" className="text-geo-gold hover:text-yellow-400 transition-colors text-lg">
              support@geomoneytv.com
            </a>
          </div>

          {/* Location Card */}
          {/* <div className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-geo-gold/30 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <MapPin className="w-5 h-5 text-geo-gold" />
              <h3 className="font-bold text-lg">Headquarters</h3>
            </div>
            <p className="text-gray-400">
              GeoMoney is operated by [Your Corporation Name], Canada.
            </p>
          </div> */}
        </div>
      </div>
    </main>
  )
}
