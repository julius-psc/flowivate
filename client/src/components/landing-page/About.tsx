"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import whiteLogo from "../../assets/brand/logo-v1.5-white.svg";
import {
    IconTarget,
    IconLungsFilled,
    IconBookFilled,
    IconCloverFilled,
    IconWritingFilled,
    IconDropletFilled,
    IconPiano,
    IconCircleCheckFilled,
    IconMoodHappyFilled,
    IconBedFilled,
    IconAlarmFilled
} from "@tabler/icons-react";
import Matter from "matter-js";

const COLORS = {
    yellow: "#F1B229",
    blue: "#1890DC",
    red: "#FF3D00",
    pink: "#FB5EBE",
    green: "#30C649",
    purple: "#7C3AED"
};

// Preserving user's modified positions exactly
const CLOUD_TAGS = [
    { text: "Deep Work", icon: IconTarget, color: COLORS.pink, top: "20%", left: "35%", rotate: "15deg" },
    { text: "Journal", icon: IconWritingFilled, color: COLORS.green, top: "12%", left: "50%", rotate: "40deg" },
    { text: "Mood", icon: IconMoodHappyFilled, color: COLORS.red, top: "23%", left: "62%", rotate: "-5deg" },
    { text: "Breathing", icon: IconLungsFilled, color: COLORS.red, top: "32%", left: "30%", rotate: "-12deg" },
    { text: "Affirmations", icon: IconCloverFilled, color: COLORS.yellow, top: "42%", left: "40%", rotate: "-30deg" },
    { text: "Pomodoro", icon: IconAlarmFilled, color: COLORS.blue, top: "32%", left: "65%", rotate: "-12deg" },
    { text: "Sleep", icon: IconBedFilled, color: COLORS.pink, top: "5%", left: "65%", rotate: "-40deg" },
    { text: "Books", icon: IconBookFilled, color: COLORS.green, top: "10%", left: "30%", rotate: "-10deg" },
    { text: "Water", icon: IconDropletFilled, color: COLORS.blue, top: "60%", left: "48%", rotate: "10deg" },
    { text: "Sounds", icon: IconPiano, color: COLORS.purple, top: "45%", left: "60%", rotate: "40deg" },
    { text: "Tasks", icon: IconCircleCheckFilled, color: COLORS.yellow, top: "-5%", left: "50%", rotate: "25deg" },
];

export default function About() {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<HTMLDivElement>(null);
    const boxRef = useRef<HTMLDivElement>(null);
    const tagRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [isAnimating, setIsAnimating] = useState(false);
    const [hiddenTags, setHiddenTags] = useState<Set<number>>(new Set());
    const hasTriggeredRef = useRef(false);

    const startPhysics = useCallback(() => {
        if (!sceneRef.current || !boxRef.current) return;

        const sceneEl = sceneRef.current;
        const boxEl = boxRef.current;
        const sceneRect = sceneEl.getBoundingClientRect();
        const boxRect = boxEl.getBoundingClientRect();

        const boxCenterX = boxRect.left - sceneRect.left + boxRect.width / 2;
        const boxTopY = boxRect.top - sceneRect.top;
        const boxWidth = boxRect.width;
        const boxHeight = boxRect.height;

        const { Engine, World, Bodies, Body } = Matter;

        const engine = Engine.create({
            gravity: { x: 0, y: 1.2, scale: 0.001 }
        });
        const world = engine.world;

        // Collision Categories for Ghost Mode
        const defaultCategory = 0x0001;
        const tagCategory = 0x0002;

        const wallOptions = {
            isStatic: true,
            collisionFilter: {
                category: defaultCategory,
                mask: tagCategory
            }
        };

        const floor = Bodies.rectangle(boxCenterX, boxTopY + boxHeight - 15, boxWidth - 30, 30, wallOptions);
        const leftWall = Bodies.rectangle(boxCenterX - boxWidth / 2 + 10, boxTopY + boxHeight / 2, 20, boxHeight, wallOptions);
        const rightWall = Bodies.rectangle(boxCenterX + boxWidth / 2 - 10, boxTopY + boxHeight / 2, 20, boxHeight, wallOptions);

        const funnelLeft = Bodies.rectangle(
            boxCenterX - 300,
            boxTopY - 200,
            30,
            600,
            { ...wallOptions, angle: -Math.PI / 6 }
        );
        const funnelRight = Bodies.rectangle(
            boxCenterX + 300,
            boxTopY - 200,
            30,
            600,
            { ...wallOptions, angle: Math.PI / 6 }
        );

        World.add(world, [floor, leftWall, rightWall, funnelLeft, funnelRight]);

        const tagBodies: Matter.Body[] = [];

        tagRefs.current.forEach((el, i) => {
            if (!el) return;

            const tagRect = el.getBoundingClientRect();
            const x = tagRect.left - sceneRect.left + tagRect.width / 2;
            const y = tagRect.top - sceneRect.top + tagRect.height / 2;

            const style = window.getComputedStyle(el);
            const transform = style.transform;
            let angle = 0;
            if (transform && transform !== 'none') {
                const match = transform.match(/matrix\(([^)]+)\)/);
                if (match) {
                    const values = match[1].split(',').map(v => parseFloat(v.trim()));
                    angle = Math.atan2(values[1], values[0]);
                }
            }

            const body = Bodies.rectangle(x, y, tagRect.width, tagRect.height, {
                restitution: 0.4, // Increased bounciness slightly for more "physics" feel
                friction: 0.05 + Math.random() * 0.1, // Random friction variation
                frictionAir: 0.01 + Math.random() * 0.01, // Random air resistance variation
                angle: angle,
                collisionFilter: {
                    category: tagCategory,
                    mask: defaultCategory
                }
            });

            // Add slight initial spin for chaos
            Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.05);

            tagBodies.push(body);
        });

        World.add(world, tagBodies);

        setIsAnimating(true);

        let frameId: number;

        const update = () => {
            Matter.Engine.update(engine, 1000 / 60);

            const newHidden = new Set<number>();

            tagBodies.forEach((body, i) => {
                const el = tagRefs.current[i];
                if (el) {
                    const { x, y } = body.position;
                    const angle = body.angle;

                    if (y > boxTopY + 80 &&
                        x > boxCenterX - boxWidth / 2 + 20 &&
                        x < boxCenterX + boxWidth / 2 - 20) {
                        newHidden.add(i);
                    }

                    el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${angle}rad)`;
                    el.style.top = '0';
                    el.style.left = '0';
                }
            });

            setHiddenTags(prev => {
                if (prev.size === newHidden.size) return prev;
                return newHidden;
            });

            frameId = requestAnimationFrame(update);
        };

        update();

        return () => {
            cancelAnimationFrame(frameId);
            Matter.World.clear(world, false);
            Matter.Engine.clear(engine);
        };
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasTriggeredRef.current) {
                    hasTriggeredRef.current = true;
                    // INCREASED DELAY to 2.0s
                    setTimeout(() => {
                        startPhysics();
                    }, 2000);
                }
            },
            { threshold: 0.8 }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, [startPhysics]);

    return (
        <section ref={containerRef} className="relative w-full py-24 px-6 md:px-12 lg:px-24 overflow-hidden flex justify-center">
            <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                {/* Left Column */}
                <div className="flex flex-col items-start space-y-8 z-10">
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="w-10 h-10 rounded-full border-2 border-primary-black"
                                    style={{ backgroundColor: `hsl(0, 0%, ${20 + i * 10}%)` }}
                                />
                            ))}
                        </div>
                        <span className="text-neutral-400 text-sm font-medium">
                            100+ active users right now
                        </span>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-4xl md:text-5xl font-semibold text-white leading-tight tracking-tight">
                            Chaos is the enemy <br /> of deep work.
                        </h2>
                        <p className="text-base md:text-lg text-neutral-400 max-w-lg leading-relaxed">
                            Fragmented tools lead to fragmented focus. Stop juggling
                            apps and unify your mental stack.
                        </p>
                    </div>

                    <button className="bg-primary-blue hover:bg-[var(--color-primary-blue-hover)] text-white px-5 py-2 rounded-full font-medium transition-colors duration-200">
                        Unlock your potential
                    </button>
                </div>

                {/* Right Column */}
                <div ref={sceneRef} className="relative w-full h-[600px]">

                    {/* Tags */}
                    {CLOUD_TAGS.map((tag, i) => (
                        <div
                            key={i}
                            ref={(el: HTMLDivElement | null) => { tagRefs.current[i] = el; }}
                            className="absolute px-3.5 py-1.5 rounded-full text-white text-sm font-medium shadow-md flex items-center gap-2 whitespace-nowrap will-change-transform"
                            style={{
                                backgroundColor: tag.color,
                                top: isAnimating ? 0 : tag.top,
                                left: isAnimating ? 0 : tag.left,
                                transform: isAnimating ? undefined : `translate(-50%, -50%) rotate(${tag.rotate})`,
                                zIndex: 10,
                                opacity: hiddenTags.has(i) ? 0 : 1,
                                transition: 'opacity 0.4s ease',
                            }}
                        >
                            <tag.icon size={16} />
                            {tag.text}
                        </div>
                    ))}

                    {/* Logo Box */}
                    <div
                        ref={boxRef}
                        className="absolute top-[55%] left-1/2 -translate-x-1/2 w-60 h-60 bg-primary-black rounded-3xl flex items-center justify-center z-30"
                    >
                        <Image
                            src={whiteLogo}
                            alt="Flowivate Logo"
                            className="w-28 h-28 object-contain opacity-90"
                        />
                    </div>

                </div>
            </div>
        </section>
    );
}