import { COLORS } from "@/constants/colors";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitleAlign: "center",
        contentStyle: { backgroundColor: COLORS.YELLOW },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Pomodoro",
          headerStyle: {
            backgroundColor: COLORS.RED,
          },
          headerTitleStyle: {
            color: COLORS.YELLOW,
            fontSize: 24,
            fontWeight: "thin",
          },
        }}
      />
      <Stack.Screen name="+not-found" options={{ title: "Not Found" }} />
    </Stack>
  );
}
