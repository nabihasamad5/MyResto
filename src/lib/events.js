import { EventEmitter } from "events";

export const complaintEvents = new EventEmitter();
complaintEvents.setMaxListeners(0);

export function emitRestaurantUpdate(payload) {
  complaintEvents.emit("update", payload);
}

export const ordersEvents = new EventEmitter();
ordersEvents.setMaxListeners(0);

export function emitOrderUpdate(payload) {
  ordersEvents.emit("update", payload);
}

export function emitOrderCreated(payload) {
  ordersEvents.emit("created", payload);
}
