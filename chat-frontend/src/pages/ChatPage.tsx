import { useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import type { IMessage } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useAuthStore } from '../store/authStore'

interface ChatMessage {
  roomId: number
  content: string
  senderUsername: string
  type: string
}

const ROOM_ID = 1 // 测试阶段先写死一个房间

export default function ChatPage() {
  const token = useAuthStore((state) => state.token)
  const clientRef = useRef<Client | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true)
        client.subscribe(`/topic/room/${ROOM_ID}`, (frame: IMessage) => {
          const msg: ChatMessage = JSON.parse(frame.body)
          setMessages((prev) => [...prev, msg])
        })
        client.publish({
          destination: '/app/chat.join',
          body: JSON.stringify({ roomId: ROOM_ID }),
        })
      },
      onWebSocketClose: () => setConnected(false),
      onStompError: (frame) => console.error('STOMP 错误：', frame.headers['message']),
    })

    client.activate()
    clientRef.current = client

    return () => {
      client.deactivate()
    }
  }, [token])

  const handleSend = () => {
    const content = input.trim()
    if (!content || !connected) return
    clientRef.current?.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({ roomId: ROOM_ID, content }),
    })
    setInput('')
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h3>
        测试聊天室 #{ROOM_ID}{' '}
        <span style={{ fontSize: 13, color: connected ? '#38a169' : '#e53e3e' }}>
          {connected ? '● 已连接' : '○ 未连接'}
        </span>
      </h3>

      <div
        style={{
          height: 360,
          overflowY: 'auto',
          border: '1px solid #ddd',
          borderRadius: 8,
          padding: 12,
          background: '#fafafa',
        }}
      >
        {messages.map((m, i) =>
          m.type === 'JOIN' ? (
            <div key={i} style={{ textAlign: 'center', color: '#999', fontSize: 12, margin: '6px 0' }}>
              {m.content}
            </div>
          ) : (
            <div key={i} style={{ margin: '6px 0' }}>
              <b>{m.senderUsername}：</b>
              {m.content}
            </div>
          )
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input
          style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6 }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="输入消息，回车发送"
        />
        <button
          onClick={handleSend}
          disabled={!connected}
          style={{
            padding: '8px 20px',
            background: '#4f46e5',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            opacity: connected ? 1 : 0.5,
          }}
        >
          发送
        </button>
      </div>
    </div>
  )
}