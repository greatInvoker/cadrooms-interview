"use client";

import Spline from "@splinetool/react-spline";
import { cn } from "@/lib/tailwindUtil";

interface SplineSceneProps {
	scene: string;
	className?: string;
}

export function SplineScene({ scene, className }: SplineSceneProps) {
	return (
		<div className={cn("w-full h-full", className)}>
			<Spline scene={scene} />
		</div>
	);
}
