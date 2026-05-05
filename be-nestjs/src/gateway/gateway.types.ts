export const WS_EVENTS = {
  // Client → Server
  LOCATION_UPDATE: 'location:update',
  CHAT_SEND: 'chat:send',
  JOIN_REQUEST: 'join:request',
  PING: 'ping',

  // Server → Client
  REQUEST_STATUS_CHANGED: 'request:status_changed',
  REQUEST_STAFF_ASSIGNED: 'request:staff_assigned',
  REQUEST_REQUOTE: 'request:requote',
  TRACKING_LOCATION: 'tracking:location',
  CHAT_MESSAGE: 'chat:message',
  POOL_NEW_REQUEST: 'pool:new_request',
  JOB_ASSIGNED: 'job:assigned',
  JOB_CANCELLED: 'job:cancelled',
  STAFF_POOL_UPDATED: 'staff:pool_updated',
  ERROR: 'error',
  PONG: 'pong',
} as const;

export function requestRoom(requestId: string) {
  return `request:${requestId}`;
}

export function trackingRoom(requestId: string) {
  return `tracking:${requestId}`;
}

export function chatRoom(requestId: string, channel: string) {
  return `chat:${requestId}:${channel}`;
}

export function tenantPoolRoom(tenantId: string) {
  return `tenant:${tenantId}:pool`;
}

export function staffRoom(userId: string) {
  return `staff:${userId}`;
}

export function customerRoom(userId: string) {
  return `customer:${userId}`;
}
