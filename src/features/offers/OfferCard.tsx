import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { DriverOfferRecord } from "@/api/driverOffers";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { adExpiry } from "@/domain/adExpiry";
import {
  formatDateTimeFull,
  formatDateTimeShort,
  formatFreight,
} from "@/domain/format";
import { CompanyBrand } from "@/features/offers/CompanyBrand";
import { colors, radius, typography } from "@/theme/colors";

type Props = { offer: DriverOfferRecord; onNegotiate: () => void };

function OfferCardView({ offer: o, onNegotiate }: Props) {
  return (
    <Card featured={o.isFeatured} style={styles.card}>
      {o.isFeatured ? (
        <View style={styles.featured}>
          <Ionicons name="star-outline" size={13} color={colors.primary} />
          <Text style={styles.featuredText}>ANÚNCIO EM DESTAQUE</Text>
        </View>
      ) : null}
      <View style={styles.publisher}>
        <CompanyBrand companyName={o.companyName} logoUrl={o.companyLogoUrl} />
      </View>
      <Text style={styles.small}>
        {"Válido até " +
          formatDateTimeFull(adExpiry(o.createdAt)) +
          " · 72 horas"}
      </Text>
      <View style={styles.top}>
        <View style={styles.topText}>
          <Text style={styles.reference}>{o.reference}</Text>
          <Text style={styles.created}>{formatDateTimeShort(o.createdAt)}</Text>
        </View>
        <Ionicons
          name="notifications-outline"
          size={21}
          color={colors.primary}
        />
      </View>
      <View style={styles.route}>
        <View style={styles.stop}>
          <Ionicons name="location-outline" size={15} color={colors.primary} />
          <Text style={styles.stopText}>{o.origin}</Text>
        </View>
        <View style={styles.line} />
        <View style={styles.stop}>
          <Ionicons
            name="checkmark-circle-outline"
            size={15}
            color={colors.primary}
          />
          <Text style={styles.stopText}>{o.destination}</Text>
        </View>
      </View>
      {o.pickupCep || o.deliveryCep ? (
        <View style={styles.ceps}>
          {o.pickupCep ? (
            <Text style={styles.cep}>CEP do carregamento: {o.pickupCep}</Text>
          ) : null}
          {o.deliveryCep ? (
            <Text style={styles.cep}>CEP da descarga: {o.deliveryCep}</Text>
          ) : null}
        </View>
      ) : null}
      {o.client ? (
        <Text style={styles.notes}>
          <Text style={styles.notesStrong}>Cliente / embarcador:</Text>{" "}
          {o.client}
        </Text>
      ) : null}
      <View style={styles.facts}>
        <Text style={styles.fact}>{o.vehicle}</Text>
        <Text style={styles.fact}>
          {o.cargo}
          {o.weightTons ? " · " + o.weightTons + " t" : ""}
        </Text>
        <Text style={styles.freight}>
          {formatFreight(o.freightValue, o.freightUnit)}
        </Text>
      </View>
      {o.notes ? <Text style={styles.notes}>{o.notes}</Text> : null}
      <Button
        icon="chatbubble-outline"
        variant={o.interested ? "secondary" : "primary"}
        label={o.interested ? "Abrir negociação" : "Negociar viagem"}
        onPress={onNegotiate}
      />
    </Card>
  );
}

export const OfferCard = memo(OfferCardView);

const styles = StyleSheet.create({
  card: { gap: 18 },
  featured: { flexDirection: "row", alignItems: "center", gap: 6 },
  featuredText: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
    color: colors.primary,
  },
  publisher: {
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  small: { ...typography.caption, color: colors.mutedForeground },
  top: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  topText: { flex: 1, gap: 2 },
  reference: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.foreground,
    fontVariant: ["tabular-nums"],
  },
  created: { fontSize: 11, color: colors.mutedForeground },
  route: { gap: 10 },
  stop: { flexDirection: "row", alignItems: "center", gap: 9 },
  stopText: { flex: 1, fontSize: 13, color: colors.foreground },
  line: {
    width: 1,
    height: 18,
    marginLeft: 7,
    backgroundColor: colors.border,
  },
  ceps: { gap: 4 },
  cep: { fontSize: 12, lineHeight: 19, color: colors.mutedForeground },
  notes: {
    fontSize: 12,
    lineHeight: 19,
    color: colors.mutedForeground,
  },
  notesStrong: { fontWeight: "700" },
  facts: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 7,
  },
  fact: {
    fontSize: 11,
    color: colors.mutedForeground,
    backgroundColor: colors.surface,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  freight: {
    width: "100%",
    marginTop: 4,
    fontSize: 13,
    fontWeight: "600",
    color: colors.foreground,
    fontVariant: ["tabular-nums"],
  },
});
