import api from './axios'
import type { Room, MessagePage } from '../types/chat'

export const getMyRooms = async (): Promise<Room[]> =>
  (await api.get<Room[]>('/rooms')).data

export const createRoom = async (name: string): Promise<Room> =>
  (await api.post<Room>('/rooms', { name })).data

export const joinRoom = async (roomId: number): Promise<void> => {
  await api.post(`/rooms/${roomId}/join`)
}

export const getHistory = async (
  roomId: number,
  page: number,
  size = 20
): Promise<MessagePage> =>
  (await api.get<MessagePage>(`/rooms/${roomId}/messages`, { params: { page, size } })).data