'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user',
    password: '',
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (!res.ok) throw new Error('Failed to fetch users')
      const data = await res.json()
      setUsers(data)
    } catch (err) {
      setError('Failed to load users')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete user')
      }
      
      setUsers(users.filter(u => u.id !== userId))
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name || '',
      email: user.email,
      role: user.role,
      password: '', // Password is empty by default
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error('Failed to update user')

      const updatedUser = await res.json()
      setUsers(users.map(u => u.id === updatedUser.id ? { ...updatedUser, createdAt: u.createdAt } : u)) // keep original createdAt string format if API returns date object
      setIsModalOpen(false)
      setEditingUser(null)
    } catch (err) {
      alert('Failed to update user')
      console.error(err)
    }
  }

  if (loading) return <div className="text-white">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Users Management</h1>
      </div>

      {error && <div className="rounded-md bg-red-500/10 p-4 text-red-500">{error}</div>}

      <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5">
        <table className="min-w-full divide-y divide-white/10">
          <thead className="bg-black/20">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Joined</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-white/5">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{user.name || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(user)}
                    className="mr-4 text-indigo-400 hover:text-indigo-300"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-white/10 bg-gray-900 p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold text-white">Edit User</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-gray-500 focus:border-geo-gold focus:outline-none focus:ring-1 focus:ring-geo-gold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-gray-500 focus:border-geo-gold focus:outline-none focus:ring-1 focus:ring-geo-gold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400">Role</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-geo-gold focus:outline-none focus:ring-1 focus:ring-geo-gold"
                >
                  <option value="user" className="text-black">User</option>
                  <option value="admin" className="text-black">Admin</option>
                </select>
              </div>
              <div className="pt-4 border-t border-white/10">
                <h3 className="mb-2 text-sm font-medium text-yellow-500">Reset Password (Optional)</h3>
                <label className="block text-sm font-medium text-gray-400">New Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Leave blank to keep current"
                  className="mt-1 block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-gray-500 focus:border-geo-gold focus:outline-none focus:ring-1 focus:ring-geo-gold"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md px-4 py-2 text-sm font-medium text-gray-300 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-geo-gold px-4 py-2 text-sm font-medium text-black hover:bg-yellow-500"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
