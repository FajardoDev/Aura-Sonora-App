// Añade esta función fuera del componente AudioPlayer
export const formatTime = (seconds: number) => {
	if (isNaN(seconds)) return "00:00";
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
};