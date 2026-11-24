import { useEffect, useRef, useState } from "react";
import { AppState, Image, Linking, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/Button";
import { colors, radius, spacing } from "@/theme/colors";

export type CapturedPhoto = { uri: string; capturedAt: Date };

const maxSide = 1280;
const jpegQuality = 0.9;

const noCamera =
  "Nenhuma câmera encontrada. Faça o cadastro em um aparelho com câmera.";
const denied =
  "Permita o acesso à câmera nas configurações do celular ou navegador e tente novamente.";

export function LiveProfilePhoto({
  disabled = false,
  onCapture,
}: {
  disabled?: boolean;
  onCapture: (photo: CapturedPhoto) => void;
}) {
  const camera = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [opening, setOpening] = useState(false);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [needsSettings, setNeedsSettings] = useState(false);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => {
      if (next !== "active") {
        setActive(false);
        setReady(false);
      }
    });
    return () => subscription.remove();
  }, []);

  const open = async () => {
    setOpening(true);
    setError("");
    setNeedsSettings(false);
    try {
      const available = await CameraView.isAvailableAsync();
      if (!available) {
        setError(noCamera);
        return;
      }
      let current = permission;
      if (!current?.granted) {
        if (current && !current.canAskAgain) {
          setError(denied);
          setNeedsSettings(true);
          return;
        }
        current = await requestPermission();
      }
      if (!current.granted) {
        setError(denied);
        setNeedsSettings(true);
        return;
      }
      setReady(false);
      setActive(true);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível abrir a câmera.",
      );
    } finally {
      setOpening(false);
    }
  };

  const capture = async () => {
    if (!ready || !camera.current) return;
    setError("");
    try {
      const picture = await camera.current.takePictureAsync({ quality: 0.9 });
      if (!picture?.uri) {
        setError("Não foi possível capturar. Tente novamente.");
        return;
      }
      const capturedAt = new Date();
      const longest = Math.max(picture.width, picture.height);
      const context = ImageManipulator.manipulate(picture.uri);
      if (longest > maxSide) {
        context.resize(
          picture.width >= picture.height
            ? { width: maxSide }
            : { height: maxSide },
        );
      }
      const rendered = await context.renderAsync();
      const resized = await rendered.saveAsync({
        format: SaveFormat.JPEG,
        compress: jpegQuality,
      });
      setPhoto(resized.uri);
      setActive(false);
      setReady(false);
      onCapture({ uri: resized.uri, capturedAt });
    } catch {
      setError("Não foi possível capturar. Tente novamente.");
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        Foto de perfil tirada na hora{" "}
        <Text style={styles.required}>Obrigatória</Text>
      </Text>
      <Text style={styles.text}>
        Abra a câmera, enquadre o rosto sem óculos escuros ou filtros e tire a
        foto. A central irá comparar com sua CNH.
      </Text>
      <View style={styles.frame}>
        {active ? (
          <CameraView
            ref={camera}
            style={StyleSheet.absoluteFill}
            facing="front"
            mute
            onCameraReady={() => setReady(true)}
            onMountError={() => {
              setActive(false);
              setReady(false);
              setError(noCamera);
            }}
          />
        ) : photo ? (
          <Image
            source={{ uri: photo }}
            accessibilityLabel="Sua foto de perfil capturada pela câmera"
            style={styles.image}
          />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons
              name="camera-outline"
              size={36}
              color={colors.mutedForeground}
            />
            <Text style={styles.placeholderText}>
              Use a câmera do aplicativo
            </Text>
          </View>
        )}
      </View>
      <View style={styles.actions}>
        {active ? (
          <Button
            label="Tirar foto agora"
            icon="camera-outline"
            disabled={disabled || !ready}
            onPress={() => void capture()}
          />
        ) : (
          <Button
            label={
              opening
                ? "Abrindo câmera…"
                : photo
                  ? "Tirar outra foto"
                  : "Abrir câmera"
            }
            icon={photo ? "refresh-outline" : "camera-outline"}
            variant={photo ? "outline" : "primary"}
            disabled={disabled || opening}
            onPress={() => void open()}
          />
        )}
        {photo && !active ? (
          <View style={styles.done}>
            <Ionicons
              name="checkmark-circle-outline"
              size={16}
              color={colors.success}
            />
            <Text style={styles.doneText}>Foto capturada</Text>
          </View>
        ) : null}
      </View>
      {needsSettings ? (
        <Button
          label="Abrir configurações"
          variant="outline"
          style={styles.settings}
          onPress={() => void Linking.openSettings()}
        />
      ) : null}
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
      <Text style={styles.note}>
        A foto de perfil é capturada pela câmera. Não é possível escolher uma
        imagem da galeria.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.base,
    padding: 18,
    backgroundColor: colors.card,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.foreground,
    marginBottom: 10,
  },
  required: { fontSize: 10, fontWeight: "500", color: colors.primary },
  text: {
    fontSize: 12,
    lineHeight: 19,
    color: colors.mutedForeground,
    marginBottom: 15,
  },
  frame: {
    width: "100%",
    maxWidth: 320,
    aspectRatio: 1,
    alignSelf: "center",
    overflow: "hidden",
    borderRadius: radius.base,
    backgroundColor: colors.surface,
  },
  image: { width: "100%", height: "100%" },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  placeholderText: { fontSize: 12, color: colors.mutedForeground },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
    marginTop: 15,
  },
  done: { flexDirection: "row", alignItems: "center", gap: 6 },
  doneText: { fontSize: 11, color: colors.success },
  settings: { marginTop: spacing.sm + 4 },
  error: { marginTop: 12, fontSize: 12, color: colors.error },
  note: {
    marginTop: 12,
    fontSize: 10,
    lineHeight: 16,
    color: colors.mutedForeground,
  },
});
