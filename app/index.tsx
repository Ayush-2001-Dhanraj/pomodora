import { COLORS } from "@/constants/colors";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  TouchableOpacity,
  Platform,
  AppState,
  AppStateStatus,
} from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

const BREAK_TIME = 5;
const WORK_TIME = 25;
const LONG_BREAK = 20;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string
) {
  console.log("Mother Ghoose");
  const message = {
    to: expoPushToken,
    sound: "default",
    title: title,
    body: body,
    data: { someData: "goes here" },
  };

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });
}

async function registerForPushNotificationsAsync() {
  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      handleRegistrationError(
        "Permission not granted to get push token for push notification!"
      );
      return;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;
    if (!projectId) {
      handleRegistrationError("Project ID not found");
    }
    try {
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log(pushTokenString);
      return pushTokenString;
    } catch (e: unknown) {
      handleRegistrationError(`${e}`);
    }
  } else {
    handleRegistrationError("Must use physical device for push notifications");
  }

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }
}

function handleRegistrationError(errorMessage: string) {
  alert(errorMessage);
  throw new Error(errorMessage);
}

export default function Index() {
  const [currentMode, setCurrentMode] = useState("Timer");
  const [turn, setTurn] = useState<number>(1);
  const [currentTimer, setCurrentTimer] = useState<number>(0);
  const [activeTimer, setActiveTimer] = useState<NodeJS.Timeout | null>();
  const [totalWorks, setTotalWorks] = useState(0);

  const [expoPushToken, setExpoPushToken] = useState("");
  const [notification, setNotification] = useState<
    Notifications.Notification | undefined
  >(undefined);
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  const [appState, setAppState] = useState<AppStateStatus>(
    AppState.currentState
  );

  const countDown = () => {
    if (activeTimer) clearInterval(activeTimer);

    const timer = setInterval(() => {
      setCurrentTimer((preV) => {
        if (preV > 0) {
          return preV - 1;
        } else {
          clearInterval(timer);
          setActiveTimer(null);
          return 0;
        }
      });

      setActiveTimer(timer);
    }, 1000);
  };

  const handleStart = async () => {
    if (turn % 8 === 0) {
      setCurrentTimer(LONG_BREAK * 60);
      setCurrentMode("Long Break");
      countDown();
      setTotalWorks((preV) => preV + 1);
    } else if (turn % 2 === 0) {
      setCurrentTimer(BREAK_TIME * 60);
      setCurrentMode("Break");
      countDown();
      setTotalWorks((preV) => preV + 1);
    } else {
      setCurrentTimer(WORK_TIME * 60);
      setCurrentMode("Work");
      countDown();
    }
    setTurn((t) => t + 1);
  };

  const handleReset = async () => {
    if (activeTimer) clearInterval(activeTimer);
    setTurn(1);
    setCurrentTimer(0);
    setCurrentMode("Timer");
    setTotalWorks(0);
  };

  useEffect(() => {
    if (currentMode !== "Timer" && currentTimer === 0) handleStart();
  }, [currentTimer]);

  useEffect(() => {
    registerForPushNotificationsAsync()
      .then((token) => setExpoPushToken(token ?? ""))
      .catch((error: any) => setExpoPushToken(`${error}`));

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(response);
      });

    return () => {
      notificationListener.current &&
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      responseListener.current &&
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  const backgroundTimeRef = useRef<number | null>(null);

  useEffect(() => {
    let backgroundTimestamp: number | null = null;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        if (backgroundTimeRef.current) {
          const elapsedSeconds = Math.floor(
            (Date.now() - backgroundTimeRef.current) / 1000
          );
          setCurrentTimer((prev) => Math.max(0, prev - elapsedSeconds)); // Adjust timer
          backgroundTimeRef.current = null; // Reset ref
        }
      } else if (nextAppState === "background") {
        backgroundTimeRef.current = Date.now();
      }
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription.remove(); // Clean up the listener
    };
  }, []);
  useEffect(() => {
    if (currentMode !== "Timer") {
      console.log("Hellow");
      sendPushNotification(
        expoPushToken,
        currentMode,
        `${String(Math.floor(currentTimer / 60)).padStart(2, "0")}:${String(
          currentTimer % 60
        ).padStart(2, "0")}`
      );
    }
  }, [currentMode]);

  return (
    <View style={styles.container}>
      <View>
        {/* Timer header */}
        <Text style={styles.headerTxt}>{currentMode}</Text>
      </View>

      <ImageBackground
        source={
          currentMode === "Work"
            ? require("../assets/images/pomodora.png")
            : require("../assets/images/pomodora2.png")
        }
        resizeMode="contain"
      >
        <View style={styles.timerContainer}>
          {/* Image & Timer */}
          <Text style={styles.timerTxt}>
            {`${String(Math.floor(currentTimer / 60)).padStart(
              2,
              "0"
            )}:${String(currentTimer % 60).padStart(2, "0")}`}
          </Text>
        </View>
      </ImageBackground>
      <View style={styles.actionContainer}>
        {/* action btns */}
        <TouchableOpacity
          style={[
            styles.actionBtn,
            currentMode !== "Timer" && styles.disabledBtn,
          ]}
          onPress={handleStart}
          disabled={currentMode !== "Timer"}
        >
          <Text style={styles.actionTxt}>Start</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleReset}>
          <Text style={styles.actionTxt}>Reset</Text>
        </TouchableOpacity>
      </View>
      <View>
        {/* rounds info */}
        <Text style={styles.tickTxt}>
          {new Array(totalWorks).fill("✔").join("")}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
    gap: 10,
  },
  timerContainer: {
    height: 400,
    width: 300,
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
    borderWidth: 4,
    borderColor: COLORS.DARK,
  },
  actionTxt: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.DARK,
  },
  actionContainer: {
    display: "flex",
    justifyContent: "space-between",
    flexDirection: "row",
    width: "100%",
  },
  headerTxt: {
    fontSize: 50,
    fontWeight: "bold",
    color: COLORS.DARK,
  },
  timerTxt: {
    color: COLORS.WHITE,
    fontWeight: "bold",
    fontSize: 40,
    marginTop: 70,
  },
  tickTxt: {
    color: COLORS.DARK,
    fontSize: 24,
  },
  disabledBtn: {
    opacity: 0.5,
  },
});
