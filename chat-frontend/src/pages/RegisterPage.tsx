import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../api/auth";

export default function RegisterPage() {
    const navigate = useNavigate()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [success, setSucess] = useState('')
    const [loading, setLoading] = useState(false)

    const passwordTooShort = password.length > 0 && password.length < 6

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (passwordTooShort) return
        setError('')
        setSucess('')
        setLoading(true)
        try {
            await register({username, password, email})
            setSucess('Registration successful, you will be redirected to the login page shortly...')
            setTimeout(() => navigate('/login'), 1500)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed, please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
            <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Register</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              style={styles.input}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="3-50 characters"
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Please enter your email address."
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={{
                ...styles.input,
                borderColor: passwordTooShort ? '#e53e3e' : '#ddd',
            }}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
            />
            {passwordTooShort && (
                <span style={styles.fieldError}>The password must be at least 6 characters long, currently {password.length} characters.</span>
            )}
          </div>
          {error && <p style={styles.error}>{error}</p>}
          {success && <p style={styles.success}>{success}</p>}
          <button 
          style={{
            ...styles.button,
            opacity: loading || passwordTooShort ? 0.6 : 1,
            cursor: loading || passwordTooShort ? 'not-allowed' : 'pointer',
        }}
         type="submit" disabled={loading || passwordTooShort}>
            {loading ? 'Registration in progress...' : 'Register'}
          </button>
        </form>
        <p style={styles.link}>
          Already have an account?<Link to="/login">Log in Now</Link>
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
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 14, color: '#555' },
  input: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: 6,
    fontSize: 14,
    outline: 'none',
  },
  fieldError: { fontSize: 12, color: '#e53e3e' },
  error: { color: '#e53e3e', fontSize: 13, margin: 0 },
  success: { color: '#38a169', fontSize: 13, margin: 0 },
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
  link: { textAlign: 'center', marginTop: 16, fontSize: 14 },
}