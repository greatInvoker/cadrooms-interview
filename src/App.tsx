import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import type { Scene } from "./types";

function App() {
	const [scenes, setScenes] = useState<Scene[]>([]);

	async function getScenes() {
		const { data } = await supabase.from("scenes").select();
		setScenes(data || []);
	}

	useEffect(() => {
		getScenes();
	}, []);

	return (
		<ul>
			{scenes.map((scene) => (
				<li key={scene.id}>{scene.name}</li>
			))}
		</ul>
	);
}

export default App;
