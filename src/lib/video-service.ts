import { prisma } from '@/lib/prisma'

// Helper: parse ISO 8601 duration (PT1M30S → 90 seconds)
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')
  return hours * 3600 + minutes * 60 + seconds
}

export async function syncVideosToDatabase(): Promise<{ added: number; total: number }> {
  try {
    // Read channel ID and API key from SiteSettings, fallback to env vars
    const settings = await prisma.siteSettings.findMany({
      where: {
        key: { in: ['youtube_channel_id', 'youtube_api_key'] },
      },
    })

    const settingsMap: Record<string, string> = {}
    settings.forEach((s) => (settingsMap[s.key] = s.value))

    const channelId = settingsMap['youtube_channel_id'] || process.env.YOUTUBE_CHANNEL_ID || ''
    const apiKey = settingsMap['youtube_api_key'] || process.env.YOUTUBE_API_KEY || ''

    console.log(`[VideoSync] Channel: ${channelId}, API Key configured: ${!!apiKey}`)

    if (!apiKey) {
      console.error('[VideoSync] No YouTube API key configured. Cannot fetch videos.')
      return { added: 0, total: 0 }
    }

    if (!channelId) {
      console.error('[VideoSync] No YouTube channel ID configured.')
      return { added: 0, total: 0 }
    }

    // Step 1: Get the "uploads" playlist ID for the channel
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`
    console.log('[VideoSync] Fetching channel uploads playlist...')
    const channelRes = await fetch(channelUrl)

    if (!channelRes.ok) {
      const errText = await channelRes.text()
      console.error(`[VideoSync] Channel API error (${channelRes.status}):`, errText)
      return { added: 0, total: 0 }
    }

    const channelData = await channelRes.json()
    const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads

    if (!uploadsPlaylistId) {
      console.error('[VideoSync] Could not find uploads playlist for channel:', channelId)
      return { added: 0, total: 0 }
    }

    console.log(`[VideoSync] Uploads playlist: ${uploadsPlaylistId}`)

    // Step 2: Fetch videos from the uploads playlist (up to 50)
    const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50&key=${apiKey}`
    console.log('[VideoSync] Fetching playlist items...')
    const playlistRes = await fetch(playlistUrl)

    if (!playlistRes.ok) {
      const errText = await playlistRes.text()
      console.error(`[VideoSync] Playlist API error (${playlistRes.status}):`, errText)
      return { added: 0, total: 0 }
    }

    const playlistData = await playlistRes.json()
    const playlistItems = playlistData.items || []
    console.log(`[VideoSync] Found ${playlistItems.length} videos in uploads playlist`)

    if (playlistItems.length === 0) {
      return { added: 0, total: 0 }
    }

    // Build video list from playlist items
    const videosToAdd: {
      videoId: string
      title: string
      url: string
      thumbnail: string
      publishedAt: Date
      source: string
      videoType: string
    }[] = []

    for (const item of playlistItems) {
      const snippet = item.snippet
      if (!snippet || !snippet.resourceId?.videoId) continue

      const videoId = snippet.resourceId.videoId
      const title = snippet.title || 'Untitled'
      const publishedAt = new Date(snippet.publishedAt)
      const url = `https://www.youtube.com/watch?v=${videoId}`
      // Use maxresdefault for best quality, fallback to hqdefault
      const thumbnail = snippet.thumbnails?.maxres?.url
        || snippet.thumbnails?.high?.url
        || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`

      videosToAdd.push({
        videoId,
        title,
        url,
        thumbnail,
        publishedAt,
        source: 'youtube_channel',
        videoType: 'video', // default, will be updated after duration check
      })
    }

    // Step 3: Check durations to classify shorts (≤ 60 seconds)
    const batchSize = 50
    for (let i = 0; i < videosToAdd.length; i += batchSize) {
      const batch = videosToAdd.slice(i, i + batchSize)
      const videoIds = batch.map((v) => v.videoId).join(',')

      try {
        const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${apiKey}`
        console.log(`[VideoSync] Checking durations for ${batch.length} videos...`)
        const detailsRes = await fetch(detailsUrl)

        if (!detailsRes.ok) {
          const errorText = await detailsRes.text()
          console.error(`[VideoSync] Video details API error (${detailsRes.status}):`, errorText)
          continue
        }

        const detailsData = await detailsRes.json()
        console.log(`[VideoSync] Got duration data for ${detailsData.items?.length || 0} videos`)

        if (detailsData.items) {
          const durationMap: Record<string, number> = {}
          detailsData.items.forEach((item: any) => {
            const duration = parseDuration(item.contentDetails.duration)
            durationMap[item.id] = duration
          })

          // Videos ≤ 180 seconds (3 min) are classified as shorts
          // YouTube extended the Shorts limit from 60s to 3 minutes in 2023
          batch.forEach((video) => {
            const duration = durationMap[video.videoId]
            if (duration !== undefined && duration <= 180) {
              video.videoType = 'short'
              // Use portrait thumbnail for shorts
              video.thumbnail = `https://i.ytimg.com/vi/${video.videoId}/oar2.jpg`
            }
          })
        }
      } catch (apiError) {
        console.error('[VideoSync] Video details API error (non-fatal):', apiError)
      }
    }

    // Step 4: Upsert videos into the database
    let addedCount = 0

    for (const video of videosToAdd) {
      const existing = await prisma.video.findFirst({
        where: { url: video.url },
      })

      if (!existing) {
        await prisma.video.create({
          data: {
            title: video.title,
            url: video.url,
            thumbnail: video.thumbnail,
            publishedAt: video.publishedAt,
            source: video.source,
            videoType: video.videoType,
          },
        })
        addedCount++
      } else if (existing.videoType === 'video' && video.videoType === 'short') {
        // Update previously misclassified videos (e.g. old 60s threshold → new 180s threshold)
        await prisma.video.update({
          where: { id: existing.id },
          data: { videoType: 'short', thumbnail: video.thumbnail },
        })
      }
    }

    const shortsCount = videosToAdd.filter(v => v.videoType === 'short').length
    const videosCount = videosToAdd.filter(v => v.videoType === 'video').length
    console.log(`[VideoSync] Complete: added=${addedCount}, total=${videosToAdd.length}, videos=${videosCount}, shorts=${shortsCount}`)

    return { added: addedCount, total: videosToAdd.length }
  } catch (error) {
    console.error('[VideoSync] Error syncing videos:', error)
    return { added: 0, total: 0 }
  }
}
