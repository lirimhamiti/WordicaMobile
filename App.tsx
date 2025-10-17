import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  LogBox,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { Animated, Easing } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Svg, { Circle, Rect, Polygon, Path } from "react-native-svg";



// Ignore Expo warnings
LogBox.ignoreLogs([
  "[expo-av]: Expo AV has been deprecated",
  "SafeAreaView has been deprecated",
]);

const API_BASE = "https://0d33e3d0dc19.ngrok-free.app";

// Data for each category
const animals = ["Dog", "Cat", "Cow", "Horse", "Lion", "Chicken", "Rabbit", "Bear"];
const fruits = ["Apple", "Pear", "Lemon", "Banana", "Strawberry"];
const numbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
const colors = ["Red", "Blue", "Yellow", "Green", "Orange", "Purple", "Pink"];
const vehicles = ["Car", "Bus", "Train", "Airplane", "Bicycle"];
const clothes = ["Shirt", "Dress", "Shoes", "Gloves", "Hat"];
const objects = ["Cup", "Chair", "Table", "Ball", "Book", "Pen"];
const shapes = ["Circle", "Square", "Triangle", "Star"];

// Preload image maps for categories
const imageMap: Record<string, any> = {
  // Animals
  dog: require("./assets/images/dog-poster.png"),
  cat: require("./assets/images/cat-poster.png"),
  cow: require("./assets/images/cow-poster.png"),
  horse: require("./assets/images/horse-poster.png"),
  lion: require("./assets/images/lion-poster.png"),
  chicken: require("./assets/images/chicken-poster.png"),
  rabbit: require("./assets/images/rabbit-poster.png"),
  bear: require("./assets/images/bear-poster.png"),
  // Fruits
  apple: require("./assets/images/apple-poster.png"),
  pear: require("./assets/images/pear-poster.png"),
  lemon: require("./assets/images/lemon-poster.png"),
  banana: require("./assets/images/banana-poster.png"),
  strawberry: require("./assets/images/strawberry-poster.png"),
  // Vehicles
  car: require("./assets/images/car-poster.png"),
  bus: require("./assets/images/bus-poster.png"),
  train: require("./assets/images/train-poster.png"),
  airplane: require("./assets/images/airplane-poster.png"),
  bicycle: require("./assets/images/bicycle-poster.png"),
  // Clothes
  shirt: require("./assets/images/shirt-poster.png"),
  dress: require("./assets/images/dress-poster.png"),
  shoes: require("./assets/images/shoes-poster.png"),
  gloves: require("./assets/images/gloves-poster.png"),
  hat: require("./assets/images/hat-poster.png"),
  // Objects
  cup: require("./assets/images/cup-poster.png"),
  chair: require("./assets/images/chair-poster.png"),
  table: require("./assets/images/table-poster.png"),
  ball: require("./assets/images/ball-poster.png"),
  book: require("./assets/images/book-poster.png"),
  pen: require("./assets/images/pen-poster.png"),
};

export default function App() {
  const [category, setCategory] = useState("Animals");
  const [index, setIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [heard, setHeard] = useState<string>("");
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [darkMode, setDarkMode] = useState(false);
  const bgAnim = useRef(new Animated.Value(0)).current;


  // Category-specific data
  const items =
    category === "Animals" ? animals :
      category === "Fruits" ? fruits :
        category === "Numbers" ? numbers :
          category === "Colors" ? colors :
            category === "Vehicles" ? vehicles :
              category === "Clothes" ? clothes :
                category === "Objects" ? objects :
                  shapes;

  const currentItem = items[index];

  useEffect(() => {
    Animated.timing(bgAnim, {
      toValue: darkMode ? 1 : 0,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [darkMode]);


  // 🔊 TTS from backend
  const playTTS = async (text: string) => {
    try {
      const res = await fetch(`${API_BASE}/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Text: text }),
      });

      if (!res.ok) throw new Error("TTS failed");
      const data = await res.json();
      const filePath = FileSystem.cacheDirectory + "tts.wav";
      await FileSystem.writeAsStringAsync(filePath, data.audio, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync({ uri: filePath });
      soundRef.current = sound;
      await sound.playAsync();

    } catch (err) {
      console.error("TTS playback error:", err);
    }
  };

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);


  // 🎙 Start mic recording
  const startRecording = async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        setRecording(null);
      }

      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      console.log("🎙 Started recording");
    } catch (err) {
      console.error("Start recording error:", err);
    }
  };

  // 🛑 Stop and send to backend
  const stopRecording = async () => {
    try {
      if (!recording) return;
      setIsRecording(false);
      await recording.stopAndUnloadAsync();

      const uri = recording.getURI();
      setRecording(null);
      if (!uri) return;

      const form = new FormData();
      form.append("audio", { uri, name: "clip.m4a", type: "audio/m4a" } as any);

      const sttRes = await fetch(`${API_BASE}/stt`, { method: "POST", body: form });
      if (!sttRes.ok) return console.error("STT failed:", await sttRes.text());
      const { text } = await sttRes.json();

      const recognized = (text || "").trim();
      setHeard(recognized);

      const isCorrect =
        recognized.toLowerCase().replace(/[^\w]/g, "") === currentItem.toLowerCase();

      const chatRes = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Message: recognized, CorrectWord: currentItem }),
      });
      if (!chatRes.ok) return console.error("Chat failed:", await chatRes.text());
      const chatData = await chatRes.json();

      const replyPath = FileSystem.cacheDirectory + "airesponse.wav";
      await FileSystem.writeAsStringAsync(replyPath, chatData.audio, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync({ uri: replyPath });
      soundRef.current = sound;
      await sound.playAsync();

      if (isCorrect) setTimeout(() => setIndex(i => (i + 1) % items.length), 400);
    } catch (err) {
      console.error("Stop recording error:", err);
    } finally {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    }
  };

  const nextItem = () => setIndex(i => (i + 1) % items.length);

  // Play automatically when category or index changes
  useEffect(() => {
    playTTS(currentItem);
  }, [index, category]);

  // reset index when switching category
  useEffect(() => {
    setIndex(0);
  }, [category]);

  // 🖼 pick correct image for current category
  const hasImages = ["Animals", "Fruits", "Vehicles", "Clothes", "Objects"].includes(category);

  const getCurrentImage = () => {
    const key = currentItem.toLowerCase();
    if (imageMap[key]) return imageMap[key];
    return require("./assets/images/dog-poster.png");
  };

  const backgroundColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#ffffff", "#121212"], // light → dark
  });


  return (
    <SafeAreaProvider>
      <SafeAreaView style={[
        styles.container,
        { backgroundColor: darkMode ? "#121212" : "#fff" },
      ]}>
        {/* Category bar — 2 rows, left-aligned */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => setDarkMode(!darkMode)}
            style={[
              styles.themeButton,
              darkMode && styles.themeButtonActive
            ]}
          >
            {darkMode ? (
              <Ionicons name="moon" size={30} color="#fdd835" />
            ) : (
              <Ionicons name="sunny" size={30} color="#ff9800" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.categoryWrapper}>
          <View style={styles.categoryBar}>
            <TouchableOpacity onPress={() => setCategory("Animals")}>
              <View style={[styles.categoryButton, category === "Animals" && styles.activeCategory]}>
                <FontAwesome5 name="paw" size={25} color={category === "Animals" ? "#1976d2" : "#4CAF50"} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setCategory("Numbers")}>
              <View style={[styles.categoryButton, category === "Numbers" && styles.activeCategory]}>
                <Ionicons name="calculator" size={25} color={category === "Numbers" ? "#1976d2" : "#9C27B0"} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setCategory("Fruits")}>
              <View style={[styles.categoryButton, category === "Fruits" && styles.activeCategory]}>
                <MaterialCommunityIcons name="apple" size={25} color={category === "Fruits" ? "#1976d2" : "#FF5722"} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setCategory("Vehicles")}>
              <View style={[styles.categoryButton, category === "Vehicles" && styles.activeCategory]}>
                <FontAwesome5 name="car-side" size={25} color={category === "Vehicles" ? "#1976d2" : "#2196F3"} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.categoryBar}>
            <TouchableOpacity onPress={() => setCategory("Clothes")}>
              <View style={[styles.categoryButton, category === "Clothes" && styles.activeCategory]}>
                <MaterialCommunityIcons name="tshirt-crew" size={25} color={category === "Clothes" ? "#1976d2" : "#795548"} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setCategory("Objects")}>
              <View style={[styles.categoryButton, category === "Objects" && styles.activeCategory]}>
                <FontAwesome5 name="cube" size={25} color={category === "Objects" ? "#1976d2" : "#009688"} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setCategory("Colors")}>
              <View style={[styles.categoryButton, category === "Colors" && styles.activeCategory]}>
                <Ionicons name="color-palette" size={25} color={category === "Colors" ? "#1976d2" : "#FFEB3B"} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setCategory("Shapes")}>
              <View style={[styles.categoryButton, category === "Shapes" && styles.activeCategory]}>
                <MaterialCommunityIcons name="shape" size={25} color={category === "Shapes" ? "#1976d2" : "#E91E63"} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Image */}
       <View style={styles.imageContainer}>
  {hasImages ? (
    <Image source={getCurrentImage()} style={styles.image} />
  ) : category === "Numbers" ? (
    <View style={styles.placeholderBox}>
      <Text style={styles.numberText}>{currentItem}</Text>
    </View>
  ) : category === "Colors" ? (
    <View
      style={[
        styles.colorBox,
        { backgroundColor: currentItem.toLowerCase() },
      ]}
    />
  ) : category === "Shapes" ? (
    <View style={styles.placeholderBox}>
      {currentItem === "Circle" && (
        <Svg height="150" width="150">
          <Circle cx="75" cy="75" r="60" fill="#1976d2" />
        </Svg>
      )}
      {currentItem === "Square" && (
        <Svg height="150" width="150">
          <Rect x="25" y="25" width="100" height="100" fill="#388e3c" />
        </Svg>
      )}
      {currentItem === "Triangle" && (
        <Svg height="150" width="150">
          <Polygon points="75,20 130,130 20,130" fill="#f57c00" />
        </Svg>
      )}
      {currentItem === "Star" && (
        <Svg height="150" width="150" viewBox="0 0 100 100">
          <Path
            d="M50 5 L61 38 L95 38 L67 58 L78 90 L50 70 L22 90 L33 58 L5 38 L39 38 Z"
            fill="#fbc02d"
          />
        </Svg>
      )}
    </View>
  ) : (
    <View style={styles.placeholderBox}>
      <Text style={styles.placeholderText}>🙂</Text>
    </View>
  )}
</View>


        {/* Repeat pronunciation */}
        <TouchableOpacity style={styles.repeatButton} onPress={() => playTTS(currentItem)}>
          <Ionicons name="repeat" size={28} color="#1976d2" />
        </TouchableOpacity>

        {/* Speak / stop recording */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[
              styles.micButton,
              isRecording && { backgroundColor: "#ff5252", borderColor: "#c62828", borderWidth: 3 },
            ]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <Text style={[styles.micText, isRecording && { color: "#fff" }]}>
              {isRecording ? "🎙 ..." : "🎤"}
            </Text>
          </TouchableOpacity>
        </Animated.View>


        {/* Next button */}
        <TouchableOpacity style={styles.nextButton} onPress={nextItem}>
          <Text style={styles.nextText}>Next ➡️</Text>
        </TouchableOpacity>

        <Text style={{ marginTop: 10, fontSize: 16 }}>Heard: {heard || "—"}</Text>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 20,
  },
  categoryWrapper: {
    width: "90%",
    marginTop: 10,
    marginBottom: 10,
  },
  categoryBar: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 10,
    gap: 10,
  },
  categoryButton: {
    backgroundColor: "#fff",
    borderRadius: 50,
    padding: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 3,
  },
  activeCategory: {
    backgroundColor: "#e3f2fd",
    borderWidth: 2,
    borderColor: "#1976d2",
  },
imageContainer: {
  width: 260,
  height: 260,
  marginBottom: 20,
  marginTop: 35,
  alignItems: "center",
  justifyContent: "center",
},
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  micButton: {
    backgroundColor: "#fdd835",
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 50,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 6,
  },
  micText: {
    fontSize: 18,
    fontWeight: "600",
  },
  nextButton: {
    backgroundColor: "#1e88e5",
    paddingVertical: 12,
    paddingHorizontal: 26,
    borderRadius: 25,
  },
  nextText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "500",
  },
  repeatButton: {
    backgroundColor: "#e3f2fd",
    borderRadius: 40,
    padding: 14,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
    elevation: 3,
  },
  topBar: {
    position: "absolute",
    top: 110,
    right: 50,
    zIndex: 10,
  },
  themeButton: {
    backgroundColor: "#fff",
    borderRadius: 50,
    padding: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 3,
  },
  themeButtonActive: {
    backgroundColor: "#e3f2fd",
    borderWidth: 2,
    borderColor: "#1976d2",
  },
placeholderBox: {
  width: 220,
  height: 220,
  borderRadius: 20,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#fafafa",
  shadowColor: "#000",
  shadowOpacity: 0.1,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 5,
  elevation: 4,
},
numberText: {
  fontSize: 160,
  fontWeight: "800",
  color: "#1976d2",
  textAlign: "center",
  textAlignVertical: "center",
  includeFontPadding: false,
},
colorBox: {
  width: 220,
  height: 220,
  borderRadius: 25,
  shadowColor: "#000",
  shadowOpacity: 0.15,
  shadowOffset: { width: 0, height: 3 },
  shadowRadius: 5,
  elevation: 5,
},
placeholderText: {
  fontSize: 80,
  fontWeight: "700",
  color: "#1976d2",
},



});
