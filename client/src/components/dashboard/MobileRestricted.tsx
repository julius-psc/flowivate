import React from "react";
import Image from "next/image";
import logo from "../../assets/brand/logo-v1.5.svg";
import { Monitor, Tablet, PhoneOff } from "lucide-react";

export default function MobileRestricted() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-[#0B0B0D] text-center relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#0075C4]/20 rounded-full blur-[120px] pointer-events-none opacity-20" />

            <div className="relative z-10 flex flex-col items-center max-w-md animate-fade-in">
                <Image
                    src={logo}
                    alt="Flowivate"
                    width={140}
                    height={50}
                    className="mb-12"
                    priority
                />

                <div className="mb-8 relative">
                    <div className="flex items-center justify-center gap-4 text-zinc-400">
                        <Monitor size={48} className="text-secondary-white" strokeWidth={1.5} />
                        <Tablet size={40} className="text-secondary-white" strokeWidth={1.5} />
                        <div className="w-px h-12 bg-zinc-800 mx-2" />
                        <PhoneOff size={32} className="text-zinc-600" strokeWidth={1.5} />
                    </div>
                </div>

                <h1 className="text-2xl md:text-3xl font-semibold text-secondary-white mb-4 tracking-tight">
                    Optimized for Desktop
                </h1>

                <p className="text-zinc-400 text-base md:text-lg leading-relaxed">
                    Flowivate is designed to provide the best productivity experience on larger screens.
                </p>

                <div className="mt-8 py-3 px-5 rounded-lg bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-sm">
                    <p className="text-sm text-zinc-500 font-medium">
                        Please switch to a desktop or tablet to continue.
                    </p>
                </div>
            </div>
        </div>
    );
}
