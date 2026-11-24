import type { ChatMessage, Thread } from "@/api/negotiations";

export type NegotiationGroup = {
  id: string;
  latest: Thread;
  offers: Thread[];
};

export function groupNegotiations(threads: Thread[]): NegotiationGroup[] {
  const groups = new Map<string, NegotiationGroup>();
  for (const thread of threads) {
    const id =
      (thread.companyUserId ?? "legacy-" + thread.opportunityId) +
      ":" +
      thread.driverUserId;
    let group = groups.get(id);
    if (!group) {
      group = { id, latest: thread, offers: [] };
      groups.set(id, group);
    }
    group.offers.push(thread);
    if (
      new Date(thread.updatedAt).getTime() >
      new Date(group.latest.updatedAt).getTime()
    )
      group.latest = thread;
  }
  return [...groups.values()].sort(
    (a, b) =>
      new Date(b.latest.updatedAt).getTime() -
      new Date(a.latest.updatedAt).getTime(),
  );
}

export type NegotiationEntry =
  | { type: "offer"; id: string; at: Date; offer: Thread }
  | { type: "message"; id: string; at: Date; message: ChatMessage };

export function negotiationTimeline(
  offers: Thread[],
  messages: ChatMessage[],
): NegotiationEntry[] {
  const entries: NegotiationEntry[] = messages.map((message) => ({
    type: "message",
    id: message.id,
    at: new Date(message.createdAt),
    message,
  }));
  for (const offer of offers) {
    const first = messages
      .filter((m) => m.opportunityId === offer.opportunityId)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )[0];
    entries.push({
      type: "offer",
      id: "offer-" + offer.opportunityId,
      at: new Date(offer.startedAt || first?.createdAt || offer.updatedAt),
      offer,
    });
  }
  return entries.sort(
    (a, b) =>
      a.at.getTime() - b.at.getTime() ||
      (a.type !== b.type
        ? a.type === "offer"
          ? -1
          : 1
        : a.id.localeCompare(b.id)),
  );
}
