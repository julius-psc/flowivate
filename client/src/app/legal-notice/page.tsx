"use client";
import Navbar from "@/components/landing-page/Navbar";
import Footer from "@/components/landing-page/Footer";
import React from "react";

export default function LegalNoticePage() {
    return (
        <div className="min-h-screen bg-[#121212] text-white antialiased">
            <Navbar />

            <main className="max-w-3xl mx-auto px-6 pt-40 pb-32">

                {/* Header */}
                <header className="mb-16">
                    <h1 className="text-[2.5rem] font-semibold tracking-[-0.02em] text-white mb-3">
                        Legal Notice (Mentions Légales)
                    </h1>
                    <p className="text-sm text-zinc-500">
                        Last updated: January 15, 2026
                    </p>
                </header>

                {/* Content */}
                <div className="space-y-12">

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">1. Editor Information</h2>
                        <p className="text-zinc-400 text-[15px] leading-relaxed mb-4">
                            The website Flowivate is edited by:
                        </p>
                        <ul className="space-y-2 text-zinc-400 text-[15px]">
                            <li><span className="text-white font-medium">Full Name (Micro-entrepreneur):</span> Julius Peschard</li>
                            <li><span className="text-white font-medium">Professional Address:</span> 15 Rue Jean Baptiste Colbert 14000 CAEN</li>
                            <li><span className="text-white font-medium">SIRET Number:</span> 99928205600012</li>
                            <li><span className="text-white font-medium">Contact Email:</span> flowivate@gmail.com</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">2. Intellectual Property</h2>
                        <p className="text-zinc-400 text-[15px] leading-relaxed">
                            All content on this website (text, images, graphics, logo, icons, etc.) is the exclusive property of Flowivate unless otherwise stated. Any reproduction, distribution, modification, adaptation, retransmission, or publication of these elements, even partial, is strictly prohibited without the express written consent of the publication director.
                        </p>
                    </section>

                </div>
            </main >

            <Footer />
        </div >
    );
}
