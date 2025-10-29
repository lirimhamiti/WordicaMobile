import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";

export default function IntroScreen({ onFinish }: { onFinish: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;

  const colors = ["#FF5252", "#FFEB3B", "#4CAF50", "#2196F3", "#9C27B0", "#FF9800", "#E91E63"];
  const text = "WORDICA";

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.exp),
        useNativeDriver: false, // ❗ JS driver only
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: false, // ❗ JS driver only
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(colorAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false, // ❗ JS driver only
          }),
          Animated.timing(colorAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false, // ❗ JS driver only
          }),
        ])
      ),
    ]).start();

    const timer = setTimeout(onFinish, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {text.split("").map((char, i) => {
          const animatedColor = colorAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [colors[i % colors.length], colors[(i + 1) % colors.length]],
          });
          const bounce = new Animated.Value(0);

          // Letter bounce
          useEffect(() => {
            Animated.loop(
              Animated.sequence([
                Animated.timing(bounce, {
                  toValue: -10,
                  duration: 400 + i * 50,
                  easing: Easing.out(Easing.sin),
                  useNativeDriver: false, // ❗ JS driver only
                }),
                Animated.timing(bounce, {
                  toValue: 0,
                  duration: 400 + i * 50,
                  easing: Easing.in(Easing.sin),
                  useNativeDriver: false, // ❗ JS driver only
                }),
              ])
            ).start();
          }, []);

          return (
            <Animated.Text
              key={i}
              style={[
                styles.title,
                {
                  color: animatedColor,
                  transform: [{ translateY: bounce }],
                },
              ]}
            >
              {char}
            </Animated.Text>
          );
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 58,
    fontWeight: "900",
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 2, height: 3 },
    textShadowRadius: 6,
  },
});
