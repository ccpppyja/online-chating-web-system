import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api/auth";
import { useAuthStore } from "../store/authStore";

export default function LoginPage() {
    const navigate = useNavigate()
    const setAuth = useAuthStore((state) => state.setAuth)
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const data = await login({username, password})
            setAuth(data.token, {id: data.id, username: data.username})
            navigate('/dashboard')
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed, please try again')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>Login</h2>
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.field}>
                        <label style={styles.label}>Username</label>
                        <input
                        style={styles.input}
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="enter your username"
                        required
                        />
                    </div>
                    <div style={styles.field}>
                        <label style={styles.label}>password</label>
                        <input
                        style={styles.input}
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="enter your password"
                        required
                        />
                    </div>
                    {error && <p style={styles.error}>{error}</p>}
                    <button style={styles.button} type="submit" disabled={loading}>
                        {loading ? 'Logging in...' : 'log in'}
                    </button>
                </form>
                <p style={styles.link}>
                    Don't have an account?<Link to="/register">Register Now</Link>
                </p>
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
    },
    title: {
        margin: '0 0 1.5rem',
        fontSize: 22,
        fontWeight: 500,
        textAlign: 'center',
    },
    form: {display: 'flex', flexDirection: 'column', gap: 16},
    field: {display: 'flex', flexDirection: 'column', gap: 6},
    label: {fontSize: 14, color: '#555'},
    input: {
        padding: '8px 12px',
        border: '1px solid #ddd',
        borderRadius: 6,
        fontSize: 14,
        outline: 'none',
    },
    error: {color: '#e53e3e', fontSize: 13, margin: 0},
    button: {
        padding: '10px',
        backgroundColor: '#4f46e5',
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        fontSize: 15,
        cursor: 'pointer',
        marginTop: 4,
    },
    link: { textAlign: 'center', marginTop: 16, fontSize: 14},
}