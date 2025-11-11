import { BackgroundPaths } from "./ui/background-paths";
import { Button } from "@/components/ui/button";

interface WelcomePageProps {
	onEnter: () => void;
}

export function WelcomePage({ onEnter }: WelcomePageProps) {
	return (
		<div className="relative min-h-screen flex items-center justify-center overflow-hidden">
			<BackgroundPaths />
			<div className="relative z-10 text-center space-y-8 px-4">
				<div className="space-y-4">
					<h1 className="text-6xl md:text-8xl font-bold text-white tracking-tight">
						CAD ROOMS
					</h1>
					<p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto">
						Manage your 3D scenes and assemblies with precision and ease
					</p>
				</div>
				<Button
					onClick={onEnter}
					size="lg"
					className="text-lg px-8 py-6 bg-white text-black hover:bg-gray-200 transition-all duration-300 transform hover:scale-105">
					Enter Scene Manager
				</Button>
			</div>
		</div>
	);
}
