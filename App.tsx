import React, { useRef, useState } from "react";
import { Button, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";

const API_BASE_URL = "https://10fb6114b98c.ngrok-free.app"; // <-- your backend URL

export default function App() {
  const [text, setText] = useState("Hello from Wordica mobile!");
  const [status, setStatus] = useState("idle");
  const soundRef = useRef<Audio.Sound | null>(null);

  const playTTS = async () => {
    try {
      if (!text.trim()) {
        alert("Please enter some text first.");
        return;
      }

      setStatus("processing");

      const response = await fetch(`${API_BASE_URL}/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Your backend model has `Text` (capital T). ASP.NET is usually case-insensitive,
        // but we’ll match it exactly to be safe:
        body: JSON.stringify({ Text: text }),
      });

      if (!response.ok) {
        console.error("TTS failed:", response.status, await response.text());
        alert("TTS request failed.");
        setStatus("idle");
        return;
      }

      const data = await response.json(); // { audio: base64 }
      if (!data?.audio) {
        console.error("No 'audio' field in response:", data);
        alert("No audio returned from server.");
        setStatus("idle");
        return;
      }

      // Save base64 -> local file
      const filePath = FileSystem.cacheDirectory + "tts.wav";
      await FileSystem.writeAsStringAsync(filePath, data.audio, {
        // FIX: use literal string so it works across Expo versions
        encoding: "base64" as any,
      });

      // Stop any previously playing audio
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // Play it
      const { sound } = await Audio.Sound.createAsync({ uri: filePath });
      soundRef.current = sound;
      await sound.playAsync();

      setStatus("done");
      console.log("✅ Audio played:", filePath);
    } catch (err) {
      console.error("TTS playback error:", err);
      alert("Error playing audio.");
      setStatus("idle");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Wordica Mobile — TTS Test</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Enter text to speak:</Text>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type something..."
        />

        <View style={{ height: 12 }} />
        <Button title="🔊 Speak" onPress={playTTS} />

        <View style={{ height: 16 }} />
        <Text style={styles.status}>Status: {status}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f7fb", padding: 16 },
  title: { fontSize: 20, fontWeight: "600", textAlign: "center", marginVertical: 8 },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  label: { fontSize: 16, color: "#333", marginBottom: 6 },
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
  },
  status: { textAlign: "center", color: "#666", marginTop: 8 },
});
