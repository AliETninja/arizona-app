import type { Href } from "expo-router";

export const tripHref = (tripId: string) => ("/corrida/" + tripId) as Href;

export const negotiationHref = (opportunityId: string) =>
  ("/negociacao/" + opportunityId) as Href;
