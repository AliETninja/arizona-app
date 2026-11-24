import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { listDriverOffers } from "@/api/driverOffers";
import type { DriverOfferRecord } from "@/api/driverOffers";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { ListScreen } from "@/components/ListScreen";
import { Spinner } from "@/components/Spinner";
import { adExpired } from "@/domain/adExpiry";
import { OfferCard } from "@/features/offers/OfferCard";
import { offersPollMs, usePolling } from "@/hooks/usePolling";
import { negotiationHref } from "@/navigation/routes";
import { useAuth } from "@/session/AuthProvider";
import { colors, typography } from "@/theme/colors";

export function OffersScreen() {
  const { state } = useAuth();
  const userId = state.type === "signedIn" ? state.user.id : 0;
  const router = useRouter();
  const queryKey = ["driver-offers", userId];
  const refetchInterval = usePolling(offersPollMs);
  const offers = useQuery({
    queryKey,
    queryFn: listDriverOffers,
    refetchInterval,
  });
  const [clock, setClock] = useState(() => Date.now());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await offers.refetch();
    } finally {
      setRefreshing(false);
    }
  }, [offers]);

  const visible = (offers.data || []).filter(
    (o) => !adExpired(o.createdAt, clock),
  );

  const negotiate = useCallback(
    (offer: DriverOfferRecord) => router.push(negotiationHref(offer.id)),
    [router],
  );

  const header = (
    <View style={styles.title}>
      <Text style={styles.heading}>Oportunidades abertas</Text>
      <Text style={styles.sub}>
        As novas viagens aparecem aqui em tempo real.
      </Text>
    </View>
  );

  return (
    <ListScreen
      title="Viagens disponíveis"
      subtitle="Veja fretes de todas as empresas autorizadas e negocie com a empresa anunciante."
      header={header}
      data={offers.data ? visible : []}
      keyExtractor={(o) => o.id}
      refreshing={refreshing}
      onRefresh={refresh}
      renderItem={({ item }) => (
        <OfferCard offer={item} onNegotiate={() => negotiate(item)} />
      )}
      ListEmptyComponent={
        offers.isPending ? (
          <View style={styles.loading}>
            <Spinner size="lg" />
          </View>
        ) : offers.isError ? (
          <ErrorState message={offers.error.message} onRetry={refresh} />
        ) : (
          <EmptyState
            icon="notifications-outline"
            title="Nenhuma viagem disponível agora"
            text="Quando a Arizona Log ou uma empresa autorizada anunciar um frete, ele aparecerá aqui."
          />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  title: { gap: 5, marginBottom: 2 },
  heading: { ...typography.heading, color: colors.foreground },
  sub: { fontSize: 12, color: colors.mutedForeground },
  loading: { height: 220, alignItems: "center", justifyContent: "center" },
});
