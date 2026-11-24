const timeZone = "America/Sao_Paulo";

export const formatTripTime = (value: Date | string | null) =>
  value
    ? new Intl.DateTimeFormat("pt-BR", {
        timeZone,
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "Ainda não recebida";

export const formatCoordinate = (value: number | null) =>
  value == null ? "-" : value.toFixed(5);

export const formatDayMonthTime = (value: Date | string) =>
  new Date(value).toLocaleString("pt-BR", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export const formatDateTimeShort = (value: Date | string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));

export const formatDateTimeFull = (value: Date | string) =>
  new Date(value).toLocaleString("pt-BR", { timeZone });

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const formatFreight = (value: number | null, unit: string) =>
  value == null
    ? "A negociar"
    : brl.format(value) +
      (unit === "tonelada" ? "/t" : unit === "pallet" ? "/pallet" : "/viagem");

export const formatCep = (value: string | null | undefined) =>
  value ? value.slice(0, 5) + "-" + value.slice(5) : "Não informado";

export const formatSpeedKmh = (metersPerSecond: number | null) =>
  metersPerSecond == null ? "-" : Math.round(metersPerSecond * 3.6) + " km/h";

export const formatAccuracyMeters = (accuracy: number | null) =>
  "±" + Math.round(accuracy || 0) + " m";
