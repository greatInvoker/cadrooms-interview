import { useState } from "react";
import { ScenesList } from "./components/ScenesList";
import { WelcomePage } from "./components/WelcomePage";
import { Toaster } from "sonner";

function App() {
	const [showWelcome, setShowWelcome] = useState(true);

	if (showWelcome) {
		return (
			<>
				<WelcomePage onEnter={() => setShowWelcome(false)} />
				<Toaster />
			</>
		);
	}

	return (
		<div>
			<ScenesList />
			<Toaster />
		</div>
	);
}

export default App;
