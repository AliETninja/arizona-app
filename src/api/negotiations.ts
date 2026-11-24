import { z } from "zod";
import { apiRequest } from "./client";

const thread = {
  opportunityId: z.guid(),
  driverUserId: z.number().int().positive().optional(),
};

const cursor = z.object({ createdAt: z.coerce.date(), id: z.guid() });

export const negotiationsSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("notifications") }),
  z.object({
    action: z.literal("read"),
    ids: z.array(z.guid()).min(1).max(200),
  }),
  z.object({
    action: z.literal("threads"),
    offset: z.number().int().min(0).optional(),
  }),
  z.object({
    action: z.literal("messages"),
    ...thread,
    group: z.boolean().optional(),
    before: cursor.optional(),
  }),
  z.object({
    action: z.literal("send"),
    ...thread,
    body: z.string().trim().min(1).max(2000),
  }),
]);

export type NegotiationNotice = {
  id: string;
  opportunityId: string;
  driverUserId: number;
  recipientUserId: number;
  senderUserId: number;
  senderName: string;
  reference: string;
  body: string;
  createdAt: Date;
  readAt: Date | null;
};

export type Thread = {
  opportunityId: string;
  driverUserId: number;
  driverName: string;
  reference: string;
  origin: string;
  destination: string;
  message: string;
  startedAt?: Date;
  updatedAt: Date;
  offerStatus: string;
  tripId: string | null;
  companyUserId?: number;
  companyName?: string;
  companyLogoUrl?: string;
  driverPhotoUrl?: string | null;
};

export type ChatMessage = {
  id: string;
  senderUserId: number;
  body: string;
  createdAt: Date;
  opportunityId?: string;
  reference?: string;
  origin?: string;
  destination?: string;
};

export type NegotiationsInput = z.input<typeof negotiationsSchema>;

export type NegotiationsOutput = {
  notifications?: NegotiationNotice[];
  unreadCount?: number;
  ok?: boolean;
  threads?: Thread[];
  messages?: ChatMessage[];
  hasMore?: boolean;
  company?: { userId: number; name: string; logoUrl: string };
};

export type MessageCursor = { createdAt: Date; id: string };

export const postNegotiations = (body: NegotiationsInput) =>
  apiRequest<NegotiationsOutput>({
    method: "POST",
    path: "negotiations",
    body: negotiationsSchema.parse(body),
    fallbackError: "Não foi possível acessar a conversa.",
  });

export const listThreads = async (offset?: number) =>
  (await postNegotiations({ action: "threads", offset })).threads ?? [];

export const listNotifications = async () => {
  const result = await postNegotiations({ action: "notifications" });
  return {
    notifications: result.notifications ?? [],
    unreadCount: result.unreadCount ?? 0,
  };
};

export const markNotificationsRead = (ids: string[]) =>
  postNegotiations({ action: "read", ids });

export const listMessages = (input: {
  opportunityId: string;
  driverUserId?: number;
  group?: boolean;
  before?: MessageCursor;
}) => postNegotiations({ action: "messages", ...input });

export const sendMessage = (input: {
  opportunityId: string;
  driverUserId?: number;
  body: string;
}) => postNegotiations({ action: "send", ...input });
