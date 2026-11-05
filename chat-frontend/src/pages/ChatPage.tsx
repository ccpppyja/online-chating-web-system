import { useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import type { IMessage, StompSubscription } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useAuthStore } from '../store/authStore'
import { createRoom, getHistory, getMyRooms, joinRoom } from '../api/rooms'
import type { ChatMessage, Room } from '../types/chat'

// 按 id 去重合并，并按 id 升序排列（同一房间内 id 递增 = 时间顺序）
function mergeMessages(prev: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const map = new Map<number, ChatMessage>()
  for (const m of prev) map.set(m.id, m)
  for (const m of incoming) map.set(m.id, m)
  return [...map.values()].sort((a, b) => a.id - b.id)
}

export default function ChatPage() {
  const token = useAuthStore((state) => state.token)

  const [rooms, setRooms] = useState<Room[]>([])
  const [currentRoomId, setCurrentRoomId] = useState<number | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [input, setInput] = useState('')
  const [newRoomName, setNewRoomName] = useState('')
  const [joinId, setJoinId] = useState('')
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState('')

  const clientRef = useRef<Client | null>(null)
  const nextPageRef = useRef(0)
  const activeRoomRef = useRef<number | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const showError = (err: any, fallback: string) =>
    setError(err?.response?.data?.message || fallback)

  const refreshRooms = async () => {
    try {
      setRooms(await getMyRooms())
    } catch (err) {
      showError(err, '加载房间列表失败')
    }
  }

  // 1. 进入页面：加载房间列表
  useEffect(() => {
    refreshRooms()
  }, [])

  // 2. 建立 WebSocket 连接（整个页面只连一次）
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => setConnected(true),
      onWebSocketClose: () => setConnected(false),
      onStompError: (frame) => console.error('STOMP 错误：', frame.headers['message']),
    })
    client.activate()
    clientRef.current = client
    return () => {
      client.deactivate()
    }
  }, [token])

  // 3. 连接就绪且选了房间：先订阅，再拉历史，两路数据按 id 合并
  useEffect(() => {
    const client = clientRef.current
    if (!connected || currentRoomId === null || !client) return

    let cancelled = false
    let sub: StompSubscription | null = null

    try {
      sub = client.subscribe(`/topic/room/${currentRoomId}`, (frame: IMessage) => {
        const msg: ChatMessage = JSON.parse(frame.body)
        setMessages((prev) => mergeMessages(prev, [msg]))
      })
    } catch (e) {
      console.error('订阅失败', e)
    }

    getHistory(currentRoomId, 0)
      .then((data) => {
        if (cancelled) return
        if (nextPageRef.current === 0) {
          nextPageRef.current = 1
          setHasMore(data.hasNext)
        }
        setMessages((prev) => mergeMessages(prev, data.content))
      })
      .catch((err) => !cancelled && showError(err, '加载历史消息失败'))

    return () => {
      cancelled = true
      try {
        sub?.unsubscribe()
      } catch {
        // 连接已断开时取消订阅会抛异常，忽略即可
      }
    }
  }, [connected, currentRoomId])

  // 4. 最新一条消息变化时滚动到底部（加载更早的消息不会触发）
  const lastId = messages.length > 0 ? messages[messages.length - 1].id : null
  useEffect(() => {
    bottomRef.current?.scrollIntoView()
  }, [lastId])

  const selectRoom = (roomId: number) => {
    if (roomId === currentRoomId) return
    activeRoomRef.current = roomId
    nextPageRef.current = 0
    setMessages([])
    setHasMore(false)
    setError('')
    setCurrentRoomId(roomId)
  }

  const loadMore = async () => {
    if (currentRoomId === null || !hasMore) return
    const roomId = currentRoomId
    try {
      const data = await getHistory(roomId, nextPageRef.current)
      if (activeRoomRef.current !== roomId) return // 加载期间切换了房间，丢弃结果
      nextPageRef.current += 1
      setHasMore(data.hasNext)
      setMessages((prev) => mergeMessages(prev, data.content))
    } catch (err) {
      showError(err, '加载更多失败')
    }
  }

  const handleCreate = async () => {
    const name = newRoomName.trim()
    if (!name) return
    try {
      const room = await createRoom(name)
      setNewRoomName('')
      await refreshRooms()
      selectRoom(room.id)
    } catch (err) {
      showError(err, '创建失败')
    }
  }

  const handleJoin = async () => {
    const id = Number(joinId)
    if (!Number.isInteger(id) || id <= 0) {
      setError('请输入正确的房间号')
      return
    }
    try {
      await joinRoom(id)
      setJoinId('')
      await refreshRooms()
      selectRoom(id)
    } catch (err) {
      showError(err, '加入失败')
    }
  }

  const handleSend = () => {
    const content = input.trim()
    if (!content || !connected || currentRoomId === null) return
    clientRef.current?.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({ roomId: currentRoomId, content }),
    })
    setInput('')
  }

  return (
    <div style={styles.page}>
      <div style={styles.sidebar}>
        <div style={styles.status}>
          <span style={{ color: connected ? '#38a169' : '#e53e3e' }}>
            {connected ? '● 已连接' : '○ 未连接'}
          </span>
        </div>

        <div style={styles.roomList}>
          {rooms.map((r) => (
            <div
              key={r.id}
              onClick={() => selectRoom(r.id)}
              style={{
                ...styles.roomItem,
                background: r.id === currentRoomId ? '#eef2ff' : 'transparent',
              }}
            >
              {r.name}
              <span style={styles.roomId}>#{r.id}</span>
            </div>
          ))}
          {rooms.length === 0 && <div style={styles.empty}>还没有房间</div>}
        </div>

        <div style={styles.box}>
          <input
            style={styles.input}
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            placeholder="新房间名称"
          />
          <button style={styles.smallBtn} onClick={handleCreate}>创建</button>
        </div>
        <div style={styles.box}>
          <input
            style={styles.input}
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
            placeholder="房间号"
          />
          <button style={styles.smallBtn} onClick={handleJoin}>加入</button>
        </div>
        {error && <div style={styles.error}>{error}</div>}
      </div>

      <div style={styles.main}>
        {currentRoomId === null ? (
          <div style={styles.placeholder}>请在左侧选择或创建一个聊天室</div>
        ) : (
          <>
            <div style={styles.messages}>
              {hasMore && (
                <div style={{ textAlign: 'center', marginBottom: 8 }}>
                  <button style={styles.linkBtn} onClick={loadMore}>加载更早的消息</button>
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} style={{ margin: '6px 0' }}>
                  <b>{m.senderUsername}</b>
                  <span style={styles.time}>{m.sentAt.slice(11, 16)}</span>
                  <div>{m.content}</div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div style={styles.sendBar}>
              <input
                style={{ ...styles.input, flex: 1 }}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="输入消息，回车发送"
              />
              <button
                style={{ ...styles.sendBtn, opacity: connected ? 1 : 0.5 }}
                onClick={handleSend}
                disabled={!connected}
              >
                发送
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: 'flex', height: '100vh', fontFamily: 'sans-serif' },
  sidebar: { width: 260, borderRight: '1px solid #e5e5e5', display: 'flex', flexDirection: 'column', padding: 12, gap: 8 },
  status: { fontSize: 13 },
  roomList: { flex: 1, overflowY: 'auto' },
  roomItem: { padding: '8px 10px', borderRadius: 6, cursor: 'pointer', display: 'flex', justifyContent: 'space-between' },
  roomId: { color: '#aaa', fontSize: 12 },
  empty: { color: '#aaa', fontSize: 13, padding: 8 },
  box: { display: 'flex', gap: 6 },
  input: { padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, minWidth: 0, flex: 1 },
  smallBtn: { padding: '0 12px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' },
  error: { color: '#e53e3e', fontSize: 13 },
  main: { flex: 1, display: 'flex', flexDirection: 'column' },
  placeholder: { margin: 'auto', color: '#aaa' },
  messages: { flex: 1, overflowY: 'auto', padding: 16, background: '#fafafa' },
  time: { color: '#aaa', fontSize: 12, marginLeft: 8 },
  sendBar: { display: 'flex', gap: 8, padding: 12, borderTop: '1px solid #e5e5e5' },
  sendBtn: { padding: '8px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' },
  linkBtn: { background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontSize: 13 },
}