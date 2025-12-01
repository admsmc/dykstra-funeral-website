/**
 * Preparation Room Entity
 * Represents a physical preparation facility (embalming station)
 */

export type PrepRoomId = string & { readonly _brand: 'PrepRoomId' };

export function createPrepRoomId(id: string): PrepRoomId {
  if (!id || id.trim() === '') {
    throw new Error('PrepRoomId cannot be empty');
  }
  return id as PrepRoomId;
}

export type PrepRoomStatus = 'available' | 'maintenance' | 'closed';
export type PrepRoomCapacity = 1 | 2;

export interface PrepRoom {
  readonly id: PrepRoomId;
  readonly businessKey: string;
  readonly funeralHomeId: string;
  readonly roomNumber: string;
  readonly capacity: PrepRoomCapacity;
  readonly status: PrepRoomStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string;
}

export function createPrepRoom(
  funeralHomeId: string,
  roomNumber: string,
  capacity: PrepRoomCapacity,
  createdBy: string
): PrepRoom {
  const now = new Date();
  const businessKey = `${funeralHomeId}:${roomNumber}`;

  return {
    id: createPrepRoomId(`prep-room-${now.getTime()}-${Math.random()}`),
    businessKey,
    funeralHomeId,
    roomNumber,
    capacity,
    status: 'available',
    createdAt: now,
    updatedAt: now,
    createdBy,
  };
}

export function updatePrepRoomStatus(
  room: PrepRoom,
  newStatus: PrepRoomStatus
): PrepRoom {
  return {
    ...room,
    status: newStatus,
    updatedAt: new Date(),
  };
}

export function isPrepRoomAvailable(room: PrepRoom): boolean {
  return room.status === 'available';
}
