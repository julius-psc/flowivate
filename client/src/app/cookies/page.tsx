"use client";
import Navbar from "@/components/landing-page/Navbar";
import Footer from "@/components/landing-page/Footer";
import React from "react";

export default function CookiesPage() {
    return (
        <div className="min-h-screen bg-[#121212] text-white antialiased">
            <Navbar />

            <main className="max-w-3xl mx-auto px-6 pt-40 pb-32">

                {/* Header */}
                <header className="mb-16">
                    <h1 className="text-[2.5rem] font-semibold tracking-[-0.02em] text-white mb-3">
                        Cookie Policy
                    </h1>
                    <p className="text-sm text-zinc-500">
                        Last updated: January 3, 2026
                    </p>
                </header>

                {/* Content */}
                <div className="space-y-12">

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">1. What Are Cookies</h2>
                        <p className="text-zinc-400 text-[15px] leading-relaxed">
                            Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and to provide information to the owners of the site.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">2. How We Use Cookies</h2>
                        <p className="text-zinc-400 text-[15px] leading-relaxed mb-4">
                            We use cookies for the following purposes:
                        </p>
                        <ul className="space-y-2 text-zinc-400 text-[15px]">
                            <li><span className="mr-2 text-zinc-600">•</span><span className="text-white font-medium">Essential Cookies</span> — required for the website to function properly.</li>
                            <li><span className="mr-2 text-zinc-600">•</span><span className="text-white font-medium">Analytics Cookies</span> — help us understand how visitors interact with our website.</li>
                            <li><span className="mr-2 text-zinc-600">•</span><span className="text-white font-medium">Preference Cookies</span> — remember your settings and preferences.</li>
                            <li><span className="mr-2 text-zinc-600">•</span><span className="text-white font-medium">Authentication Cookies</span> — keep you logged in during your session.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">3. Third-Party Cookies</h2>
                        <p className="text-zinc-400 text-[15px] leading-relaxed">
                            In some cases, we use cookies provided by trusted third parties. These third-party cookies may track your use of our website and other websites to provide you with relevant content and advertisements.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">4. Managing Cookies</h2>
                        <p className="text-zinc-400 text-[15px] leading-relaxed">
                            Most web browsers allow you to control cookies through their settings. You can set your browser to refuse cookies or delete certain cookies. However, if you block or delete cookies, some features of our website may not function properly.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">5. Updates to This Policy</h2>
                        <p className="text-zinc-400 text-[15px] leading-relaxed">
                            We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">6. Contact Us</h2>
                        <p className="text-zinc-400 text-[15px] leading-relaxed">
                            If you have any questions about our use of cookies, please contact us at privacy@flowivate.com.
                        </p>
                    </section>

                </div>
            </main>

            <Footer />
        </div>
    );
}
