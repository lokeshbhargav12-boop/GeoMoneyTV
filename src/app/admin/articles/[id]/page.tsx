'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Trash2, Loader2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface ArticleFormData {
  title: string
  slug: string
  description: string
  content: string
  imageUrl: string
  category: string
  featured: boolean
  published: boolean
}

export default function EditArticlePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState<ArticleFormData>({
    title: '',
    slug: '',
    description: '',
    content: '',
    imageUrl: '',
    category: 'news',
    featured: false,
    published: false,
  })

  useEffect(() => {
    fetchArticle()
  }, [params.id])

  const fetchArticle = async () => {
    try {
      const response = await fetch(`/api/admin/articles/${params.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch article')
      }
      const data = await response.json()
      setFormData({
        title: data.title,
        slug: data.slug,
        description: data.description || '',
        content: data.content,
        imageUrl: data.imageUrl || '',
        category: data.category,
        featured: data.featured,
        published: data.published,
      })
    } catch (err) {
      setError('Error loading article')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/admin/articles/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update article')
      }

      router.refresh()
      router.push('/admin/articles')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/articles/${params.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete article')
      }

      router.refresh()
      router.push('/admin/articles')
    } catch (err) {
      setError('Error deleting article')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-geo-gold" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/articles"
            className="rounded-full bg-white/5 p-2 text-gray-400 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Edit Article</h1>
            <p className="text-sm text-gray-400">Update article details and settings</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 rounded-md bg-red-500/10 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/20 disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 rounded-md bg-geo-gold px-6 py-2 text-sm font-bold text-black hover:bg-yellow-500 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-500/10 p-4 text-red-500 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Main Content */}
          <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white focus:border-geo-gold focus:outline-none focus:ring-1 focus:ring-geo-gold"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Slug <span className="text-gray-500 font-normal">(URL-friendly identifier)</span>
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white focus:border-geo-gold focus:outline-none focus:ring-1 focus:ring-geo-gold"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Description <span className="text-gray-500 font-normal">(Short summary)</span>
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white focus:border-geo-gold focus:outline-none focus:ring-1 focus:ring-geo-gold"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Content
              </label>
              <textarea
                rows={15}
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white font-mono text-sm focus:border-geo-gold focus:outline-none focus:ring-1 focus:ring-geo-gold"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Sidebar Settings */}
          <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-6">
             <h3 className="font-bold text-white mb-4 border-b border-white/10 pb-2">Publishing</h3>
             
             <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">Published</label>
                <button
                    type="button"
                    onClick={() => setFormData({ ...formData, published: !formData.published })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-geo-gold focus:ring-offset-2 focus:ring-offset-gray-900 ${
                    formData.published ? 'bg-green-500' : 'bg-gray-700'
                    }`}
                >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.published ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                </button>
             </div>

             <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">Featured</label>
                <button
                    type="button"
                    onClick={() => setFormData({ ...formData, featured: !formData.featured })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-geo-gold focus:ring-offset-2 focus:ring-offset-gray-900 ${
                    formData.featured ? 'bg-geo-gold' : 'bg-gray-700'
                    }`}
                >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.featured ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                </button>
             </div>

             <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white focus:border-geo-gold focus:outline-none focus:ring-1 focus:ring-geo-gold"
              >
                <option value="news">News</option>
                <option value="analysis">Analysis</option>
                <option value="report">Report</option>
                <option value="alert">Alert</option>
              </select>
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-6">
             <h3 className="font-bold text-white mb-4 border-b border-white/10 pb-2">Media</h3>
             
             <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Image URL
              </label>
              <input
                type="text"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://..."
                className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white focus:border-geo-gold focus:outline-none focus:ring-1 focus:ring-geo-gold mb-2"
              />
              <p className="text-xs text-gray-500 mb-4">
                  For RSS feeds, this is populated automatically. You can override it here.
              </p>

              {/* Image Preview */}
              <div className="aspect-video w-full rounded-lg border border-white/10 bg-black/50 overflow-hidden relative">
                 {formData.imageUrl ? (
                    <img 
                        src={formData.imageUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                 ) : (
                    <div className="flex h-full items-center justify-center text-gray-600 text-sm">
                        No Image
                    </div>
                 )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
