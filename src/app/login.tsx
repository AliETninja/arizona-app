import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { SafeAreaView } from "react-native-safe-area-context";
import { loginSchema } from "@/api/auth";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { webBaseUrl } from "@/config/environment";
import { useAuth } from "@/session/AuthProvider";
import { colors, spacing } from "@/theme/colors";

const fallbackError = "Não foi possível entrar. Tente novamente.";

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const input = loginSchema.safeParse({ email: email.trim(), password });
    if (!input.success) {
      setError(fallbackError);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signIn(input.data);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : fallbackError);
    } finally {
      setLoading(false);
    }
  };

  const register = () =>
    WebBrowser.openBrowserAsync(
      webBaseUrl + "/login?perfil=caminhoneiro&cadastro=1",
    );

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heading}>
            <Text style={styles.eyebrow}>BEM-VINDO À ARIZONA LOG</Text>
            <Text style={styles.title}>Acesso do caminhoneiro</Text>
            <Text style={styles.muted}>
              Entre com seu login e senha para acompanhar suas corridas.
            </Text>
          </View>
          <TextField
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            placeholder="seu@email.com"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="username"
          />
          <TextField
            label="Senha"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            autoCapitalize="none"
            autoComplete="current-password"
            secureTextEntry
            textContentType="password"
            onSubmitEditing={submit}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button label="Entrar" loading={loading} onPress={submit} />
          <Button
            label="Criar meu cadastro"
            variant="link"
            onPress={register}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  heading: { gap: spacing.sm, marginBottom: spacing.sm },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  title: { color: colors.foreground, fontSize: 26, fontWeight: "700" },
  muted: { color: colors.mutedForeground, fontSize: 15, lineHeight: 21 },
  error: { color: colors.error, fontSize: 14 },
});
