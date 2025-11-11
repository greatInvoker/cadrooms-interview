"use client";

import { useEffect, useRef } from "react";

export function BackgroundPaths() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current!;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Set canvas size
		const resizeCanvas = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		};
		resizeCanvas();
		window.addEventListener("resize", resizeCanvas);

		// Animation variables
		const paths: Path[] = [];
		const numPaths = 50;

		class Path {
			x: number;
			y: number;
			length: number;
			speed: number;
			angle: number;
			opacity: number;
			hue: number;

			constructor() {
				this.x = Math.random() * canvas.width;
				this.y = Math.random() * canvas.height;
				this.length = Math.random() * 100 + 50;
				this.speed = Math.random() * 2 + 0.5;
				this.angle = Math.random() * Math.PI * 2;
				this.opacity = Math.random() * 0.5 + 0.2;
				this.hue = Math.random() * 60 + 200; // Blue to purple range
			}

			update() {
				this.x += Math.cos(this.angle) * this.speed;
				this.y += Math.sin(this.angle) * this.speed;

				// Wrap around screen
				if (this.x < 0) this.x = canvas.width;
				if (this.x > canvas.width) this.x = 0;
				if (this.y < 0) this.y = canvas.height;
				if (this.y > canvas.height) this.y = 0;
			}

			draw() {
				if (!ctx) return;

				ctx.beginPath();
				ctx.moveTo(this.x, this.y);
				const endX = this.x + Math.cos(this.angle) * this.length;
				const endY = this.y + Math.sin(this.angle) * this.length;
				ctx.lineTo(endX, endY);
				ctx.strokeStyle = `hsla(${this.hue}, 70%, 60%, ${this.opacity})`;
				ctx.lineWidth = 2;
				ctx.stroke();
			}
		}

		// Initialize paths
		for (let i = 0; i < numPaths; i++) {
			paths.push(new Path());
		}

		// Animation loop
		let animationId: number;
		const animate = () => {
			ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			paths.forEach((path) => {
				path.update();
				path.draw();
			});

			animationId = requestAnimationFrame(animate);
		};
		animate();

		return () => {
			window.removeEventListener("resize", resizeCanvas);
			cancelAnimationFrame(animationId);
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			className="fixed inset-0 w-full h-full bg-black"
			style={{ zIndex: -1 }}
		/>
	);
}
