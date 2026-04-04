'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Play, ArrowRight, ChevronLeft, ChevronRight, Home, ArrowUp } from 'lucide-react'

type VideoType = {
  id: string
  title: string
  url: string
  thumbnail: string | null
  publishedAt: Date
}

interface BriefingsSectionProps {
  globalBriefings: VideoType[]
  quickBriefings: VideoType[]
}

export default function BriefingsSection({ globalBriefings, quickBriefings }: BriefingsSectionProps) {
  const [activeTab, setActiveTab] = useState<'global' | 'quick'>('global')
  const [currentIndex, setCurrentIndex] = useState(0)
  
  const currentVideos = activeTab === 'global' ? globalBriefings : quickBriefings
  
  // Carousel logic: 3 items visible at a time
  const itemsPerPage = 3
  
  const handleNext = () => {
    setCurrentIndex((prev) => (prev + itemsPerPage >= currentVideos.length ? 0 : prev + itemsPerPage))
  }
  
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - itemsPerPage < 0 ? Math.max(0, currentVideos.length - itemsPerPage) : prev - itemsPerPage))
  }

  // Auto-play effect
  useEffect(() => {
    if (currentVideos.length <= itemsPerPage) return // No need to auto-scroll if all fit
    const timer = setInterval(() => {
      handleNext()
    }, 6000) // 6 seconds auto-switch
    return () => clearInterval(timer)
  }, [activeTab, currentVideos.length, currentIndex])

  // Reset index when switching tabs
  useEffect(() => {
    setCurrentIndex(0)
  }, [activeTab])

  const visibleVideos = currentVideos.slice(currentIndex, currentIndex + itemsPerPage)

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <section className="border-t border-white/10 bg-black py-16 px-4 sm:px-6 lg:px-8 relative">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            {/* Tabs */}
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setActiveTab('global')}
                className={`text-xl font-bold transition-all px-4 py-2 border-b-2 ${
                  activeTab === 'global' ? 'border-geo-gold text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                Global Briefings
              </button>
              <button
                onClick={() => setActiveTab('quick')}
                className={`text-xl font-bold transition-all px-4 py-2 border-b-2 ${
                  activeTab === 'quick' ? 'border-geo-gold text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                Quick Briefings
              </button>
            </div>
            
            <p className="text-gray-500 text-sm">
              {activeTab === 'global' 
                ? 'Video analysis of geopolitics, energy, finance, technology, and global strategy.' 
                : 'Bite-sized strategic intelligence shorts.'}
            </p>
          </div>
          
          <Link
            href="/videos"
            className="text-sm font-semibold text-geo-gold hover:text-yellow-400 flex items-center gap-2 transition-colors group shrink-0 pb-2"
          >
            View All Briefings
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Carousel Container */}
        <div className="relative group">
          {currentVideos.length > itemsPerPage && (
            <button
              onClick={handlePrev}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/80 border border-white/20 rounded-full text-white hover:text-geo-gold hover:border-geo-gold transition-colors opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          <div className="overflow-hidden relative min-h-[300px]">
            <AnimatePresence mode="popLayout">
              {visibleVideos.length > 0 ? (
                <motion.div
                  key={currentIndex + activeTab}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.5, type: 'spring', stiffness: 200, damping: 20 }}
                  className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {visibleVideos.map((video) => (
                    <a
                      key={video.id}
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block overflow-hidden rounded-xl bg-white/5 border border-white/10 hover:border-geo-gold/30 transition-all flex flex-col h-full"
                    >
                      <div className={`relative overflow-hidden bg-gray-900 ${activeTab === 'quick' ? 'aspect-[9/16]' : 'aspect-video'}`}>
                        {video.thumbnail ? (
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gray-800">
                            <span className="text-gray-500 text-sm">No Thumbnail</span>
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-lg">
                            <Play className="w-5 h-5 fill-current ml-1" />
                          </div>
                        </div>
                      </div>
                      <div className="p-4 flex flex-col flex-1 justify-between">
                        <h3 className="mb-2 text-base font-bold text-white line-clamp-2 group-hover:text-geo-gold transition-colors leading-snug">
                          {video.title}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {new Date(video.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </a>
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="text-center py-12 text-gray-500 rounded-xl bg-white/5 border border-white/10 w-full"
                >
                  <p>No briefings available yet.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {currentVideos.length > itemsPerPage && (
            <button
              onClick={handleNext}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/80 border border-white/20 rounded-full text-white hover:text-geo-gold hover:border-geo-gold transition-colors opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Tools Sub-tabs (Go Up, Home) */}
        <div className="mt-12 pt-6 border-t border-white/10 flex justify-center items-center gap-6">
          <Link href="/" className="flex items-center gap-2 text-sm text-gray-400 hover:text-geo-gold transition-colors px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-geo-gold/10 hover:border-geo-gold/30">
            <Home className="w-4 h-4" />
            Home
          </Link>
          <button onClick={scrollToTop} className="flex items-center gap-2 text-sm text-gray-400 hover:text-geo-gold transition-colors px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-geo-gold/10 hover:border-geo-gold/30">
            <ArrowUp className="w-4 h-4" />
            Go Up
          </button>
        </div>
      </div>
    </section>
  )
}
