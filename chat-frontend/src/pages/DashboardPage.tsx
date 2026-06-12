import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function DashboardPage() {
    const navigate = useNavigate()
    const { user, logout } = useAuthStore()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Welcome back 👋</h2>
        <p style={styles.username}>{user?.username ?? 'user'}</p>
        <p style={styles.hint}>The chat feature is coming soon, stay tuned!。</p>
        <button style={styles.button} onClick={handleLogout}>
          Log out
        </button>
      </div>
    </div>
    )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  card: {
    background: '#fff',
    borderRadius: 8,
    padding: '2rem',
    width: 360,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  title: { margin: '0 0 8px', fontSize: 22, fontWeight: 500 },
  username: { fontSize: 18, color: '#4f46e5', margin: '0 0 12px' },
  hint: { fontSize: 14, color: '#888', margin: '0 0 24px' },
  button: {
    padding: '10px 24px',
    backgroundColor: '#e53e3e',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 14,
    cursor: 'pointer',
  },
}