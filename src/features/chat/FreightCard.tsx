import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Thread } from "@/api/negotiations";
import { Button } from "@/components/Button";
import { colors, radius, tints } from "@/theme/colors";

type Props = {
  offer: Thread;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
};

export function FreightCard({ offer, selected, onSelect, onOpen }: Props) {
  return (
    <View
      accessibilityLabel={"Nova negociação " + offer.reference}
      style={[styles.card, selected && styles.active]}
    >
      <Text style={styles.kicker}>NOVA NEGOCIAÇÃO · {offer.reference}</Text>
      <View style={styles.route}>
        <Ionicons name="location-outline" size={16} color={colors.foreground} />
        <Text style={styles.routeText}>
          {offer.origin} → {offer.destination}
        </Text>
      </View>
      <Text style={styles.muted}>
        {offer.tripId
          ? "Corrida aprovada"
          : offer.offerStatus === "open"
            ? "Negociação deste frete"
            : "Anúncio encerrado"}
      </Text>
      {!selected ? (
        <Button
          size="sm"
          variant="outline"
          icon="chatbubble-outline"
          label="Conversar sobre este frete"
          onPress={onSelect}
          style={styles.button}
        />
      ) : (
        <>
          <Text style={styles.muted}>Respondendo sobre este frete</Text>
          {offer.tripId ? (
            <Button
              size="sm"
              icon="location-outline"
              label="Ver e aceitar corrida"
              onPress={onOpen}
              style={styles.button}
            />
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 9,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.card,
  },
  active: {
    borderColor: colors.primary,
    backgroundColor: tints.warning + "80",
  },
  kicker: { fontSize: 11, fontWeight: "700", color: colors.primary },
  route: { flexDirection: "row", alignItems: "center", gap: 7 },
  routeText: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "700",
    color: colors.foreground,
  },
  muted: { fontSize: 11, color: colors.mutedForeground },
  button: { alignSelf: "flex-start", borderRadius: radius.base },
});
