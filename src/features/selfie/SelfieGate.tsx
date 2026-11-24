import { useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import {
  putFileToPresignedUrl,
  requestSelfieUpload,
  selfieTooOld,
  startSelfieUpload,
} from "@/api/documentUpload";
import { saveDriverSelfie } from "@/api/driverSelfie";
import { Button } from "@/components/Button";
import { useAuth } from "@/session/AuthProvider";
import { colors, spacing, typography } from "@/theme/colors";
import { LiveProfilePhoto } from "./LiveProfilePhoto";
import type { CapturedPhoto } from "./LiveProfilePhoto";

const maxAgeMs = 1800000;

type Draft = { token: string; photo?: CapturedPhoto; id?: string };

export function SelfieGate() {
  const { state, signOut } = useAuth();
  const queryClient = useQueryClient();
  const userId = state.type === "signedIn" ? state.user.id : 0;
  const displayName = state.type === "signedIn" ? state.user.displayName : "";
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null);
  const [progress, setProgress] = useState("");
  const draft = useRef<Draft | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      if (!photo || Date.now() - photo.capturedAt.getTime() > maxAgeMs)
        throw new Error(selfieTooOld);
      if (!draft.current) {
        const started = await startSelfieUpload();
        draft.current = { token: started.token! };
      }
      let id = draft.current.photo === photo ? draft.current.id : undefined;
      if (!id) {
        setProgress("Enviando selfie…");
        const blob = await (await fetch(photo.uri)).blob();
        const target = await requestSelfieUpload({
          token: draft.current.token,
          sizeBytes: blob.size,
          capturedAt: photo.capturedAt,
        });
        await putFileToPresignedUrl(
          photo.uri,
          target.presignedUrl!,
          target.headers,
        );
        id = target.id!;
        draft.current.photo = photo;
        draft.current.id = id;
      }
      setProgress("Salvando selfie…");
      return saveDriverSelfie(draft.current.token, id);
    },
    onSuccess: (status) => {
      queryClient.setQueryData(["driver-selfie", userId], status);
      void queryClient.invalidateQueries({
        queryKey: ["driver-selfie", userId],
      });
    },
    onError: (error) => {
      if (/expir|Limite/.test(error.message)) draft.current = null;
    },
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          hitSlop={12}
          onPress={() => void signOut()}
          style={styles.exit}
        >
          <Ionicons
            name="log-out-outline"
            size={16}
            color={colors.foreground}
          />
          <Text style={styles.exitText}>Sair</Text>
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.eyebrow}>PRIMEIRO ACESSO DO MOTORISTA</Text>
        <Text style={styles.title}>Olá, {displayName}</Text>
        <Text style={styles.text}>
          Seu cadastro foi feito pela central Arizona Log. Você precisa apenas
          tirar uma selfie pela câmera para a central conferir com sua CNH. Não
          é necessário reenviar os documentos ou preencher outro cadastro.
        </Text>
        <LiveProfilePhoto
          disabled={save.isPending}
          onCapture={(captured) => {
            setPhoto(captured);
            save.reset();
          }}
        />
        {save.error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {save.error.message}
          </Text>
        ) : null}
        <Button
          label={
            save.isPending
              ? progress || "Preparando envio…"
              : "Enviar selfie e acessar minhas corridas"
          }
          disabled={!photo || save.isPending}
          onPress={() => save.mutate()}
        />
        <Text style={styles.note}>
          A selfie ficará privada no seu cadastro e disponível à central
          responsável para conferência.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 15,
    backgroundColor: colors.surface,
  },
  exit: { flexDirection: "row", alignItems: "center", gap: 6 },
  exitText: { fontSize: 14, fontWeight: "500", color: colors.foreground },
  content: {
    gap: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
  },
  eyebrow: { ...typography.eyebrow, color: colors.primary },
  title: { fontSize: 27, fontWeight: "700", color: colors.foreground },
  text: { fontSize: 13, lineHeight: 22, color: colors.mutedForeground },
  error: { fontSize: 13, color: colors.error },
  note: { fontSize: 11, lineHeight: 18, color: colors.mutedForeground },
});
