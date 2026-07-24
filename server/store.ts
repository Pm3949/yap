// server/store.ts

export const state = {
  waitingQueue: [] as string[],
  textWaitingQueue: [] as string[],
  voiceWaitingQueue: [] as string[],
  activeRooms: new Map<string, { timer: NodeJS.Timeout | null; isActive: boolean }>(),
  userRooms: new Map<string, string>(),
  socketToUserId: new Map<string, string>(),
  mapAliases: new Map<string, string>(), // Maps socket.id to Dynamic Alias
  mapRooms: new Map<string, { creatorId: string; isPrivate: boolean }>(), // Maps roomId to creator and privacy settings
};

// Helper function used across multiple socket events
export const findSocketByUserId = (userId: string) => {
  return Array.from(state.socketToUserId.entries()).find(([_, id]) => id === userId)?.[0];
};