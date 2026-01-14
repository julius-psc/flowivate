"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";

interface FAQItem {
    question: string;
    answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
    {
        question: "What exactly is Flowivate?",
        answer: "Flowivate is a ruthless operating system designed for deep work. It unifies your essential productivity stack—tasks, habits, journaling, and focus tools—into one cohesive interface, eliminating the chaos of juggling multiple apps."
    },
    {
        question: "Is Flowivate free to use?",
        answer: "Yes! We offer a generous Free plan that gives you access to the core Deep Work environment and basic components. For unlimited usage, AI assistance, and advanced analytics, you can upgrade to our Elite plan."
    },
    {
        question: "How does it help me focus?",
        answer: "By reducing context switching. Instead of opening one app for tasks, another for timers, and a third for notes, Flowivate puts everything you need for a flow state in one distraction-free view."
    },
    {
        question: "Can I track my personal habits?",
        answer: "Absolutely. Flowivate includes dedicated trackers for sleep, hydration, reading, and mood, allowing you to see how your personal well-being correlates with your productivity."
    },
    {
        question: "What is included in the Elite plan?",
        answer: "The Elite plan unlocks unlimited component usage, our AI-powered assistant for personalized insights, unlimited journal entries, and deep-dive analytics into your work patterns."
    }
];

export default function FAQ() {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const toggleIndex = (index: number) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    return (
        <section id="faq" className="w-full py-16 md:py-20 px-6 md:px-12 lg:px-24">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-2xl md:text-4xl font-semibold text-white tracking-tight">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-neutral-400 text-sm max-w-xl mx-auto leading-relaxed">
                        Everything you need to know about the product and billing.
                    </p>
                </div>

                <div className="flex flex-col space-y-4">
                    {FAQ_ITEMS.map((item, index) => {
                        const isOpen = activeIndex === index;

                        return (
                            <div
                                key={index}
                                className="group"
                            >
                                <button
                                    onClick={() => toggleIndex(index)}
                                    className={`w-full flex items-center justify-between p-3 md:p-4 text-left transition-all duration-200 
                    ${isOpen ? "bg-zinc-800/80 rounded-t-2xl" : "bg-zinc-800/40 hover:bg-zinc-800/60 rounded-2xl"}
                    ${isOpen ? "" : "border border-transparent hover:border-zinc-700/50"}
                  `}
                                >
                                    <span className="text-sm md:text-base font-medium text-zinc-100 pr-8">
                                        {item.question}
                                    </span>
                                    <span className={`flex-shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
                                        <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                                    </span>
                                </button>

                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                            className="overflow-hidden bg-zinc-800/80 rounded-b-2xl"
                                        >
                                            <div className="p-3 md:p-4 pt-0 text-zinc-500 leading-relaxed text-xs md:text-sm border-t border-zinc-700/50">
                                                {item.answer}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
