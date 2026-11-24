import { TripList } from "./TripList";

export function TripsScreen() {
  return (
    <TripList
      mode="corridas"
      title="Suas corridas"
      subtitle="Aceite e acompanhe as viagens que as empresas atribuíram diretamente a você."
    />
  );
}
