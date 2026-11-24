import { z } from "zod";
import { apiRequest } from "./client";

export const driverOffersSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("list") }),
  z.object({
    action: z.literal("interest"),
    id: z.guid(),
    message: z.string().trim().min(2, "Escreva uma mensagem.").max(800),
  }),
]);

export type DriverOfferRecord = {
  isFeatured?: boolean;
  featuredAt?: Date | null;
  id: string;
  companyName?: string;
  companyLogoUrl?: string;
  pickupCep?: string | null;
  deliveryCep?: string | null;
  reference: string;
  client: string;
  origin: string;
  destination: string;
  vehicle: string;
  cargo: string;
  weightTons: number | null;
  freightValue: number | null;
  freightUnit: string;
  notes: string;
  createdAt: Date;
  interested: boolean;
  interestMessage: string;
};

export type DriverOffersInput = z.infer<typeof driverOffersSchema>;

export type DriverOffersOutput = { offers: DriverOfferRecord[] };

export const postDriverOffers = (body: DriverOffersInput) =>
  apiRequest<DriverOffersOutput>({
    method: "POST",
    path: "driver_offers",
    body: driverOffersSchema.parse(body),
    fallbackError: "Não foi possível acessar as viagens disponíveis.",
  });

export const listDriverOffers = async () =>
  (await postDriverOffers({ action: "list" })).offers;

export const sendOfferInterest = (id: string, message: string) =>
  postDriverOffers({ action: "interest", id, message });
