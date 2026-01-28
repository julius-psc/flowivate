"use client";
import Navbar from "@/components/landing-page/Navbar";
import Footer from "@/components/landing-page/Footer";
import React from "react";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#121212] text-white antialiased">
            <Navbar />

            <main className="max-w-3xl mx-auto px-6 pt-40 pb-32">

                {/* Header */}
                <header className="mb-16">
                    <h1 className="text-[2.5rem] font-semibold tracking-[-0.02em] text-white mb-3">
                        Terms of Service
                    </h1>
                    <p className="text-sm text-zinc-500">
                        Last updated: January 3, 2026
                    </p>
                </header>

                {/* Content */}
                <div className="space-y-12">

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">1. Agreement to Terms</h2>
                        <p className="text-zinc-400 text-[15px] leading-relaxed">
                            By accessing or using Flowivate, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">2. Use License</h2>
                        <p className="text-zinc-400 text-[15px] leading-relaxed mb-4">
                            Permission is granted to temporarily access and use Flowivate for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                        </p>
                        <ul className="space-y-2 text-zinc-400 text-[15px]">
                            <li><span className="mr-2 text-zinc-600">•</span>Modify or copy the materials</li>
                            <li><span className="mr-2 text-zinc-600">•</span>Use the materials for any commercial purpose</li>
                            <li><span className="mr-2 text-zinc-600">•</span>Attempt to decompile or reverse engineer any software</li>
                            <li><span className="mr-2 text-zinc-600">•</span>Remove any copyright or proprietary notations</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">3. Account Responsibilities</h2>
                        <p className="text-zinc-400 text-[15px] leading-relaxed">
                            You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">4. Service Modifications</h2>
                        <p className="text-zinc-400 text-[15px] leading-relaxed">
                            We reserve the right to modify or discontinue, temporarily or permanently, the service with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">5. Subscriptions & Payment</h2>
                        <p className="text-zinc-400 text-[15px] leading-relaxed mb-4">
                            <strong>Pricing:</strong> VAT not applicable, article 293 B of the CGI (TVA non applicable, art. 293 B du CGI). Prices are clearly displayed before checkout.
                        </p>
                        <p className="text-zinc-400 text-[15px] leading-relaxed mb-4">
                            <strong>Right of Withdrawal:</strong> Under French law, consumers have a 14-day right of withdrawal. However, for digital content/SaaS provided immediately, you acknowledge and agree that by subscribing, you waive your right of withdrawal to gain immediate access to the service. A checkbox at checkout confirms this agreement.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">6. Cancellation & Termination</h2>
                        <p className="text-zinc-400 text-[15px] leading-relaxed mb-4">
                            <strong>"3-Click" Cancellation:</strong> You may cancel your subscription at any time. In compliance with French law (Loi n° 2022-1158), we provide a simple, easily accessible formatting for termination.
                        </p>
                        <p className="text-zinc-400 text-[15px] leading-relaxed">
                            To cancel: Go to <strong>Settings {'>'} Billing</strong> and click "Cancel Subscription". Alternatively, you can use the dedicated termination button found in your account dashboard. Cancellation is effective immediately at the end of the current billing cycle.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">7. Limitation of Liability</h2>
                        <p className="text-zinc-400 text-[15px] leading-relaxed">
                            In no event shall Flowivate or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Flowivate, even if Flowivate has been notified of the possibility of such damage.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">8. Governing Law</h2>
                        <p className="text-zinc-400 text-[15px] leading-relaxed">
                            These terms and conditions are governed by and construed in accordance with applicable laws and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">9. Contact Us</h2>
                        <p className="text-zinc-400 text-[15px] leading-relaxed">
                            If you have any questions about these Terms of Service, please contact us at flowivate@gmail.com.
                        </p>
                    </section>

                </div>
            </main>

            <Footer />
        </div>
    );
}
