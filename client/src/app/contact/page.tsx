"use client";
import Navbar from "@/components/landing-page/Navbar";
import Footer from "@/components/landing-page/Footer";
import React, { useState } from "react";

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        message: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission
        console.log(formData);
    };

    return (
        <div className="min-h-screen bg-[#121212] text-white antialiased">
            <Navbar />

            <main className="max-w-xl mx-auto px-6 pt-40 pb-32">

                {/* Header */}
                <header className="mb-12">
                    <h1 className="text-[2.5rem] font-semibold tracking-[-0.02em] text-white mb-4">
                        Contact
                    </h1>
                    <p className="text-zinc-500 text-[15px] leading-relaxed">
                        Have a question or feedback? Send me a message and I'll get back to you within 24 hours.
                    </p>
                </header>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name" className="block text-sm text-zinc-400 mb-2">
                                Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3.5 py-2.5 bg-transparent border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 text-[15px]"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm text-zinc-400 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-3.5 py-2.5 bg-transparent border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 text-[15px]"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="message" className="block text-sm text-zinc-400 mb-2">
                            Message
                        </label>
                        <textarea
                            id="message"
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            rows={5}
                            className="w-full px-3.5 py-2.5 bg-transparent border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 text-[15px] resize-none"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="px-5 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-zinc-200 transition-colors"
                    >
                        Send
                    </button>

                </form>

                {/* Footer note */}
                <p className="mt-12 text-zinc-600 text-sm">
                    For urgent issues, include "URGENT" in your message.
                </p>

            </main>

            <Footer />
        </div>
    );
}
