'use client';

import { useState } from 'react';

export default function WaitlistPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);

    try {
      await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
    } catch (err) {
      alert('Something went wrong. Please try again.');
      console.error(err)
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-purple-800 to-indigo-900 text-white">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-4xl font-bold">
          🚀 Flowivate is almost here
        </h1>
        <p className="text-lg">
          Get early access and be the first to experience the future of productivity.
        </p>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-4 py-3 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-white text-purple-700 font-bold hover:bg-purple-200 transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Joining...' : 'Join the Waitlist'}
            </button>
          </form>
        ) : (
          <p className="text-green-300 text-lg font-semibold">
            🎉 You’re on the list! We’ll keep you posted.
          </p>
        )}
      </div>
    </main>
  );
}
