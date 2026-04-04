'use client'

import { Zap, Construction } from 'lucide-react'

export default function EnergyAdminPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Zap className="w-8 h-8 text-yellow-400" />
          Energy Section Management
        </h1>
        <p className="mt-2 text-gray-400">Configure energy section content and data sources</p>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/5 p-12 text-center">
        <Construction className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
        <h2 className="text-xl font-bold text-white mb-2">Coming Soon</h2>
        <p className="text-gray-400 max-w-md mx-auto">
          Energy section management will allow you to configure energy data sources,
          calculator parameters, and geopolitics analyzer settings.
        </p>
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
          {[
            { label: 'Energy Hub', status: 'Active' },
            { label: 'Oil & Gas', status: 'Coming Soon' },
            { label: 'Coal', status: 'Coming Soon' },
            { label: 'Energy Infrastructure', status: 'Coming Soon' },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-white/10 bg-black/30 p-4">
              <p className="text-sm font-medium text-white">{item.label}</p>
              <p className={`text-xs mt-1 ${item.status === 'Active' ? 'text-green-400' : 'text-gray-500'}`}>
                {item.status}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
