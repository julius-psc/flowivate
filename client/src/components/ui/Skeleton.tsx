"use client";

import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "motion/react";

interface SkeletonProps extends HTMLMotionProps<"div"> { }

export function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <motion.div
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className={cn("rounded-md bg-gray-200 dark:bg-zinc-800", className)}
            {...props}
        />
    );
}
