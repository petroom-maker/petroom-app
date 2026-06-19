import type { BidRecord, RequestRecord } from '@/lib/petroom-data';

const globalStore = globalThis as typeof globalThis & {
  petroomMemoryStore?: {
    requests: RequestRecord[];
    bids: BidRecord[];
  };
};

export const petroomMemoryStore =
  globalStore.petroomMemoryStore ??
  (globalStore.petroomMemoryStore = {
    requests: [],
    bids: [],
  });

export const addMemoryRequest = (request: RequestRecord) => {
  petroomMemoryStore.requests = [
    request,
    ...petroomMemoryStore.requests.filter((item) => item.request_id !== request.request_id),
  ];
};

export const addMemoryBid = (bid: BidRecord) => {
  petroomMemoryStore.bids = [
    bid,
    ...petroomMemoryStore.bids.filter((item) => item.bid_id !== bid.bid_id),
  ];
};

export const removeMemoryRequest = (requestId: string) => {
  petroomMemoryStore.requests = petroomMemoryStore.requests.filter(
    (item) => item.request_id !== requestId,
  );
  petroomMemoryStore.bids = petroomMemoryStore.bids.filter(
    (item) => item.request_id !== requestId,
  );
};
