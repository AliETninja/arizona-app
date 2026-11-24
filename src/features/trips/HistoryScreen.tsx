import { TripList } from "./TripList";

export function HistoryScreen() {
  return (
    <TripList
      mode="historico"
      title="Histórico de corridas"
      subtitle="Veja fretes de todas as empresas autorizadas e negocie com a empresa anunciante."
    />
  );
}
