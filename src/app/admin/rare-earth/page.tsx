'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, X, Save } from 'lucide-react'

interface RareEarthMaterial {
  id: string
  name: string
  symbol: string
  category: string
  price: number | null
  unit: string | null
  description: string | null
  applications: string | null
  countries: string | null
}

const EMPTY_FORM = {
  name: '', symbol: '', category: '', price: '', unit: '', description: '', applications: '', countries: ''
}

export default function RareEarthPage() {
  const [materials, setMaterials] = useState<RareEarthMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchMaterials() }, [])

  const fetchMaterials = async () => {
    try {
      const response = await fetch('/api/rare-earth')
      const data = await response.json()
      setMaterials(data.materials || [])
    } catch (error) {
      console.error('Error fetching materials:', error)
    } finally {
      setLoading(false)
    }
  }

  const seedDatabase = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/rare-earth', { method: 'POST' })
      if (response.ok) fetchMaterials()
    } catch (error) {
      console.error('Error seeding database:', error)
    } finally {
      setLoading(false)
    }
  }

  const openAddForm = () => {
    setFormData(EMPTY_FORM)
    setEditingId(null)
    setShowForm(true)
  }

  const openEditForm = (material: RareEarthMaterial) => {
    setFormData({
      name: material.name,
      symbol: material.symbol,
      category: material.category,
      price: material.price?.toString() || '',
      unit: material.unit || '',
      description: material.description || '',
      applications: material.applications || '',
      countries: material.countries || '',
    })
    setEditingId(material.id)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.symbol || !formData.category) {
      alert('Name, symbol, and category are required')
      return
    }
    setSaving(true)
    try {
      const url = editingId ? '/api/admin/rare-earth' : '/api/admin/rare-earth'
      const method = editingId ? 'PUT' : 'POST'
      const body = editingId ? { id: editingId, ...formData } : formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }

      setShowForm(false)
      setEditingId(null)
      fetchMaterials()
    } catch (error: any) {
      alert(error.message || 'Failed to save material')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return
    try {
      const res = await fetch(`/api/admin/rare-earth?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setMaterials(materials.filter(m => m.id !== id))
      } else {
        alert('Failed to delete material')
      }
    } catch (error) {
      console.error('Error deleting material:', error)
    }
  }

  if (loading) return <div className="p-8 text-white">Loading...</div>

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rare Earth Materials</h1>
          <p className="mt-2 text-gray-400">
            {materials.length} critical minerals configured
          </p>
        </div>
        <div className="flex gap-3">
          {materials.length === 0 && (
            <button onClick={seedDatabase}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              Seed Default Data
            </button>
          )}
          <button onClick={openAddForm}
            className="flex items-center gap-2 rounded-md bg-geo-gold px-4 py-2 text-black hover:bg-yellow-500">
            <Plus className="w-4 h-4" /> Add Material
          </button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {materials.map((material) => (
          <div key={material.id} className="rounded-lg border border-white/10 bg-white/5 p-6 hover:bg-white/10 relative group">
            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => openEditForm(material)}
                className="p-1.5 rounded-md bg-blue-500/20 text-blue-400 hover:bg-blue-500/30">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(material.id)}
                className="p-1.5 rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/30">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold">{material.name}</h3>
                <p className="text-sm text-gray-400">{material.symbol}</p>
              </div>
              <span className="rounded-full bg-geo-gold/20 px-3 py-1 text-xs text-geo-gold">
                {material.category}
              </span>
            </div>
            {material.price && (
              <p className="mt-2 text-lg font-bold text-white">
                ${material.price.toFixed(2)}
                {material.unit && <span className="text-sm text-gray-400 ml-1">/{material.unit}</span>}
              </p>
            )}
            <p className="mt-4 text-sm text-gray-300 line-clamp-2">{material.description || 'No description'}</p>
            {material.applications && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-400">APPLICATIONS</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(() => { try { return JSON.parse(material.applications).slice(0, 3) } catch { return [] } })()
                    .map((app: string) => (
                      <span key={app} className="rounded-md bg-white/5 px-2 py-1 text-xs">{app}</span>
                    ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {materials.length === 0 && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-12 text-center">
          <p className="text-gray-400">No rare earth materials found. Click &ldquo;Seed Default Data&rdquo; or &ldquo;Add Material&rdquo; to get started.</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-lg border border-white/10 bg-gray-900 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingId ? 'Edit Material' : 'Add New Material'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Name *</label>
                  <input type="text" value={formData.name} required
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Lithium"
                    className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-gray-500 focus:border-geo-gold focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Symbol *</label>
                  <input type="text" value={formData.symbol} required
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    placeholder="e.g., Li"
                    className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-gray-500 focus:border-geo-gold focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Category *</label>
                  <input type="text" value={formData.category} required
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Battery Metal"
                    className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-gray-500 focus:border-geo-gold focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Unit</label>
                  <input type="text" value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="e.g., kg, tonne"
                    className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-gray-500 focus:border-geo-gold focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Price (USD)</label>
                <input type="number" step="0.01" value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="e.g., 45.50"
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-gray-500 focus:border-geo-gold focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                <textarea value={formData.description} rows={3}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this material..."
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-gray-500 focus:border-geo-gold focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Applications (JSON array)</label>
                <input type="text" value={formData.applications}
                  onChange={(e) => setFormData({ ...formData, applications: e.target.value })}
                  placeholder='e.g., ["EV Batteries","Electronics","Glass"]'
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-gray-500 focus:border-geo-gold focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Countries (JSON array)</label>
                <input type="text" value={formData.countries}
                  onChange={(e) => setFormData({ ...formData, countries: e.target.value })}
                  placeholder='e.g., ["Australia","Chile","China"]'
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-gray-500 focus:border-geo-gold focus:outline-none" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button type="button" onClick={() => setShowForm(false)}
                  className="rounded-md px-4 py-2 text-sm font-medium text-gray-300 hover:bg-white/5">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 rounded-md bg-geo-gold px-4 py-2 text-sm font-medium text-black hover:bg-yellow-500 disabled:opacity-50">
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : editingId ? 'Update Material' : 'Add Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
