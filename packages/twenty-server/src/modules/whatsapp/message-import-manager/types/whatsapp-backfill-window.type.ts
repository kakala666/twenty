// A slice of chat history to fetch from WAHA's messages endpoint. Both bounds
// map directly onto `filter.timestamp.gte` / `filter.timestamp.lte`, which WAHA
// expects in unix SECONDS and treats as inclusive on both ends.
export type WhatsappBackfillWindow = {
  gteInSeconds: number;
  lteInSeconds: number;
};
