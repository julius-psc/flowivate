"use client";
import Navbar from "@/components/landing-page/Navbar";
import Footer from "@/components/landing-page/Footer";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import juliusPfp from "@/assets/images/julius-pfp2.png";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#121212] text-white antialiased">
            <Navbar />

            <main className="max-w-2xl mx-auto px-6 pt-40 pb-32">

                {/* Content */}
                <div className="space-y-10">

                    {/* Profile Section */}
                    <div className="flex items-center gap-6">
                        {/* Avatar Placeholder */}
                        <Image
                            src={juliusPfp}
                            alt="Julius Peschard"
                            className="w-20 h-20 rounded-full border border-zinc-700 object-cover flex-shrink-0"
                        />

                        <div>
                            <h2 className="text-lg font-semibold text-white">Julius Peschard</h2>
                            <p className="text-zinc-500 text-sm">Founder @ Flowivate</p>
                        </div>
                    </div>

                    {/* Bio */}
                    <div className="space-y-5 text-zinc-400 text-[15px] leading-relaxed">
                        <p>
                            Hey, I'm Julius - an 18-year-old undergraduate student pursuing a BSc in Computer Science in France.
                        </p>
                        <p>
                            I love building full-stack SaaS products and I'm obsessive about beautiful, pixel-perfect design. There's something deeply satisfying about crafting interfaces that feel right.
                        </p>
                        <p>
                            I built Flowivate to help myself become more productive. Managing focus, tasks, and deep work was always a struggle, so I made something that actually works for me. When friends told me it could help others too, I decided to make it public.
                        </p>
                        <p>
                            If you have questions, feedback, or just want to chat - I'd love to hear from you.
                        </p>
                        <Link
                            href="/contact"
                            className="inline-flex items-center text-primary-blue text-[15px] font-medium hover:underline"
                        >
                            Get in touch →
                        </Link>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
}
