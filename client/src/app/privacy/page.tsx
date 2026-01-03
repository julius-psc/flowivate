"use client";
import Navbar from "@/components/landing-page/Navbar";
import Footer from "@/components/landing-page/Footer";
import React from "react";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#121212] text-white antialiased">
            <Navbar />

            <main className="max-w-3xl mx-auto px-6 pt-40 pb-32">

                {/* Header */}
                <header className="mb-16">
                    <h1 className="text-[2.5rem] font-semibold tracking-[-0.02em] text-white mb-3">
                        Privacy Policy
                    </h1>
                    <p className="text-sm text-zinc-500">
                        Last updated: January 3, 2026
                    </p>
                </header>

                {/* Content */}
                <div className="space-y-12">

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">1. Introduction</h2>
                        <p className="text-zinc-400 text-[15px] leading-relaxed">
                            Welcome to Flowivate. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">2. Data We Collect</h2>
                        <p className="text-zinc-400 text-[15px] leading-relaxed mb-4">
                            We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
                        </p>
                        <ul className="space-y-2 text-zinc-400 text-[15px]">
                            <li><span className="mr-2 text-zinc-600">•</span><span className="text-white font-medium">Identity Data</span> — includes first name, last name, username or similar identifier.</li>
                            <li><span className="mr-2 text-zinc-600">•</span><span className="text-white font-medium">Contact Data</span> — includes email address.</li>
                            <li><span className="mr-2 text-zinc-600">•</span><span className="text-white font-medium">Technical Data</span> — includes internet protocol (IP) address, browser type and version, time zone setting and location.</li>
                            <li><span className="mr-2 text-zinc-600">•</span><span className="text-white font-medium">Usage Data</span> — includes information about how you use our website and services.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">3. How We Use Your Data</h2>
                        <p className="text-zinc-400 text-[15px] leading-relaxed">
                            We will only use your personal data when the law allows us to. Most commonly, we will use your personal data to provide and improve our services, to communicate with you, and to comply with legal obligations.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">4. Data Security</h2>
                        <p className="text-zinc-400 text-[15px] leading-relaxed">
                            We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. We limit access to your personal data to those employees and partners who have a business need to know.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">5. Your Rights</h2>
                        <p className="text-zinc-400 text-[15px] leading-relaxed">
                            Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, restriction, transfer, or to object to processing.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">6. Contact Us</h2>
                        <p className="text-zinc-400 text-[15px] leading-relaxed">
                            If you have any questions about this privacy policy or our privacy practices, please contact us at privacy@flowivate.com.
                        </p>
                    </section>

                </div>
            </main>

            <Footer />
        </div>
    );
}
