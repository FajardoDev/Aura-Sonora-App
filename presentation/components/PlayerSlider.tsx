import Slider from "@react-native-community/slider";
import { useAudioPlayers } from "../hooks/useAudioPlayer";

export default function PlayerSlider() {
  const { duration, currentTime, seekTo } = useAudioPlayers();

  return (
    <Slider
      minimumValue={0}
      maximumValue={duration || 0}
      value={currentTime || 0}
      onSlidingComplete={(value) => seekTo(value)}
      minimumTrackTintColor="#f43f5e"
      maximumTrackTintColor="#ccc"
    />
  );
}
