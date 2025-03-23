import { COLORS } from "@/constants/colors";
import { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  TouchableOpacity,
} from "react-native";

const BREAK_TIME = 2;
const WORK_TIME = 1;
const LONG_BREAK = 20;

export default function Index() {
  const [currentMode, setCurrentMode] = useState("Timer");
  const [turn, setTurn] = useState<number>(1);
  const [currentTimer, setCurrentTimer] = useState<number>(0);
  const [activeTimer, setActiveTimer] = useState<NodeJS.Timeout | null>();
  const [totalWorks, setTotalWorks] = useState(0);

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

  const handleStart = () => {
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

  const handleReset = () => {
    if (activeTimer) clearInterval(activeTimer);
    setTurn(1);
    setCurrentTimer(0);
    setCurrentMode("Timer");
    setTotalWorks(0);
  };

  useEffect(() => {
    if (currentMode !== "Timer" && currentTimer === 0) handleStart();
  }, [currentTimer]);

  return (
    <View style={styles.container}>
      <View>
        {/* Timer header */}
        <Text style={styles.headerTxt}>{currentMode}</Text>
      </View>
      <ImageBackground
        source={require("../assets/images/pomodora.png")}
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
    fontWeight: "condensedBold",
    fontSize: 30,
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
