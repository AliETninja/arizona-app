import { ActivityIndicator } from "react-native";
import { colors } from "@/theme/colors";

type Props = { size?: "sm" | "md" | "lg"; color?: string };

export function Spinner({ size = "md", color = colors.primary }: Props) {
  return (
    <ActivityIndicator
      color={color}
      size={size === "lg" ? "large" : "small"}
      style={size === "sm" ? { transform: [{ scale: 0.8 }] } : undefined}
    />
  );
}
