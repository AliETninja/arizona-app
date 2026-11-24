import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { TripRecord } from "@/api/tripTypes";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { formatTripTime } from "@/domain/format";
import { texts } from "@/tracking/constants";
import { colors, radius, spacing, typography } from "@/theme/colors";

export const operationConsentText =
  "Comprometo-me a manter o aplicativo Arizona Log instalado e o rastreamento ligado durante a viagem, até a empresa responsável finalizar. Entendo que a perda de sinal gera um alerta e não encerra a corrida.";

type Gps = {
  active: boolean;
  busy: boolean;
  message: string;
  queued: number;
  lastSent: Date | null;
};

type Props = {
  trip: TripRecord;
  ended: boolean;
  gps: Gps;
  agreed: boolean;
  onAgree: (value: boolean) => void;
  onAccept: () => void;
};

export function TripTrackingCard({
  trip,
  ended,
  gps,
  agreed,
  onAgree,
  onAccept,
}: Props) {
  const accepted = !!trip.acceptedAt;
  return (
    <Card featured>
      <View style={styles.title}>
        <Ionicons name="navigate-outline" size={24} color={colors.primary} />
        <View style={styles.titleBody}>
          <Text style={styles.heading}>
            {ended
              ? "Viagem encerrada"
              : gps.active
                ? "Monitoramento obrigatório ativo"
                : accepted
                  ? "Monitoramento precisa de atenção"
                  : "Aceite a corrida com GPS obrigatório"}
          </Text>
          <Text style={styles.message}>
            {ended
              ? "O rastreamento desta viagem terminou."
              : !accepted && !gps.busy && gps.message === texts.waiting
                ? "O GPS inicia automaticamente ao aceitar a corrida. Você só pode aceitar uma corrida por vez, até a empresa finalizar a atual."
                : gps.message}
          </Text>
        </View>
      </View>
      {ended ? null : (
        <>
          <Text style={styles.note}>
            O app usa somente o GPS do celular durante a viagem. Em movimento,
            registra posição a cada ~15 s; parado, reduz a frequência para
            economizar bateria. Se faltar internet, guarda as posições no
            aparelho e sincroniza quando o sinal voltar.
          </Text>
          {accepted ? null : (
            <>
              <Text style={styles.consent}>
                Ao tocar em Aceitar corrida, você autoriza o compartilhamento da
                localização com a central e com o cliente durante esta viagem. O
                monitoramento começa junto com o aceite e é obrigatório até a
                empresa responsável finalizar a corrida. Movimento e chegada são
                identificados automaticamente pelo GPS. Não há opção de pausa no
                aplicativo.
              </Text>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: agreed }}
                onPress={() => onAgree(!agreed)}
                style={styles.checkRow}
              >
                <View style={[styles.check, agreed && styles.checked]}>
                  {agreed ? (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={colors.primaryForeground}
                    />
                  ) : null}
                </View>
                <Text style={styles.checkText}>{operationConsentText}</Text>
              </Pressable>
            </>
          )}
          <View style={styles.actions}>
            {accepted ? null : (
              <Button
                label={
                  gps.busy ? "Validando GPS e aceitando…" : "Aceitar corrida"
                }
                icon="radio-outline"
                disabled={gps.active || gps.busy || !agreed}
                onPress={onAccept}
              />
            )}
            <Text style={styles.sent}>
              {gps.queued
                ? gps.queued + " posições aguardando envio"
                : gps.lastSent
                  ? "Último envio: " + formatTripTime(gps.lastSent)
                  : "Aguardando primeiro envio"}
            </Text>
          </View>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { flexDirection: "row", gap: spacing.sm + 4 },
  titleBody: { flex: 1, gap: spacing.xs },
  heading: { ...typography.heading, color: colors.foreground },
  message: { ...typography.body, color: colors.mutedForeground },
  note: { ...typography.small, color: colors.mutedForeground },
  consent: {
    ...typography.small,
    padding: spacing.sm + 4,
    borderRadius: radius.base,
    color: colors.accentForeground,
    backgroundColor: colors.accent,
  },
  checkRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  check: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
  },
  checked: { borderColor: colors.primary, backgroundColor: colors.primary },
  checkText: { ...typography.small, flex: 1, color: colors.foreground },
  actions: { gap: spacing.sm + 4 },
  sent: { ...typography.small, color: colors.mutedForeground },
});
