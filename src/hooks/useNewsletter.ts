'use client'

import { useState } from 'react'

interface UseNewsletterReturn {
    name: string
    setName: (name: string) => void
    phone: string
    setPhone: (phone: string) => void
    email: string
    setEmail: (email: string) => void
    status: 'idle' | 'loading' | 'success' | 'error'
    message: string
    handleSubscribe: (e: React.FormEvent) => Promise<void>
}

export function useNewsletter(): UseNewsletterReturn {
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim() || !phone.trim() || !email.trim()) {
            setStatus('error')
            setMessage('Please enter your name, phone number, and email address.')
            return
        }

        setStatus('loading')
        setMessage('')
        try {
            const res = await fetch('/api/newsletter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone, email }),
            })

            const data = await res.json()

            if (res.ok) {
                setStatus('success')
                setMessage(data.message || 'Successfully subscribed!')
                setName('')
                setPhone('')
                setEmail('')
            } else {
                setStatus('error')
                setMessage(data.error || 'Something went wrong. Please try again.')
            }
        } catch {
            setStatus('error')
            setMessage('Network error. Please try again.')
        }
    }

    return { name, setName, phone, setPhone, email, setEmail, status, message, handleSubscribe }
}
