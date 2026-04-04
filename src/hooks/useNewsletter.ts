'use client'

import { useState } from 'react'

interface UseNewsletterReturn {
    email: string
    setEmail: (email: string) => void
    status: 'idle' | 'loading' | 'success' | 'error'
    message: string
    handleSubscribe: (e: React.FormEvent) => Promise<void>
}

export function useNewsletter(): UseNewsletterReturn {
    const [email, setEmail] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) return

        setStatus('loading')
        try {
            const res = await fetch('/api/newsletter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })

            const data = await res.json()

            if (res.ok) {
                setStatus('success')
                setMessage(data.message || 'Successfully subscribed!')
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

    return { email, setEmail, status, message, handleSubscribe }
}
