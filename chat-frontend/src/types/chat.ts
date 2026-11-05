export interface Room {
  id: number
  name: string
  type: string
}

export interface ChatMessage {
  id: number
  roomId: number
  content: string
  senderUsername: string
  type: string
  sentAt: string
}

export interface MessagePage {
  content: ChatMessage[]
  hasNext: boolean
}