import React, { useEffect, useRef, useState } from "react";
import { Animated, View, StyleSheet } from "react-native";
import IntroScreen from "./IntroScreen";
import MainApp from "./MainApp";

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const introOpacity = useRef(new Animated.Value(1)).current; // Intro starts visible
  const mainOpacity = useRef(new Animated.Value(0)).current;  // Main app starts hidden

  const handleIntroFinish = () => {
    // Step 1: fade out intro
    Animated.timing(introOpacity, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setShowIntro(false); // remove intro from render tree
      // Step 2: fade in main app
      Animated.timing(mainOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    });
  };

  return (
    <View style={styles.container}>
      {/* INTRO */}
      {showIntro && (
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: introOpacity, zIndex: 2 }]}
        >
          <IntroScreen onFinish={handleIntroFinish} />
        </Animated.View>
      )}

      {/* MAIN APP */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: mainOpacity, zIndex: 1 }]}
      >
        <MainApp />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
