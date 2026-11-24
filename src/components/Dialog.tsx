import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { ReactNode } from "react";
import {
  colors,
  radius,
  shadow,
  spacing,
  tints,
  typography,
} from "@/theme/colors";

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  actions?: ReactNode;
};

export function Dialog({
  visible,
  onClose,
  title,
  description,
  children,
  actions,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <Pressable
          accessibilityLabel="Fechar"
          style={styles.overlay}
          onPress={onClose}
        >
          <Pressable style={styles.content} onPress={() => undefined}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scroll}
            >
              <Text style={styles.title}>{title}</Text>
              {description ? (
                <Text style={styles.description}>{description}</Text>
              ) : null}
              {children}
              {actions ? <View style={styles.footer}>{actions}</View> : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    backgroundColor: tints.overlay,
  },
  content: {
    width: "100%",
    maxWidth: 512,
    maxHeight: "85%",
    borderRadius: radius.md,
    backgroundColor: colors.card,
    ...shadow.lg,
  },
  scroll: { gap: spacing.md, padding: spacing.lg },
  title: { ...typography.heading, color: colors.foreground },
  description: { ...typography.small, color: colors.mutedForeground },
  footer: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm },
});
