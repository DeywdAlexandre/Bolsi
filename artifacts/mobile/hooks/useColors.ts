import { useColorScheme } from "react-native";
import { useSettings } from "@/contexts/SettingsContext";
import colors from "@/constants/colors";

export function useColors() {
  const systemScheme = useColorScheme();
  const { settings } = useSettings();

  const theme = settings.themeMode === "system" ? systemScheme : settings.themeMode;
  
  const palette =
    theme === "dark" && "dark" in colors
      ? (colors as any).dark
      : colors.light;

  return { ...palette, radius: colors.radius } as typeof colors.light & { radius: number };
}
