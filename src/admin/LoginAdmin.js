import React, { useState } from "react";
import { getDatabase, ref, get } from "firebase/database";
import { initializeApp } from "firebase/app";
import { useNavigate } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_DOMAIN",
  databaseURL:
    "https://locksense-d9f0d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const snapshot = await get(ref(database, "admin"));
      const data = snapshot.val();

      if (data && data.username === username && data.password === password) {
        setSuccess("Login berhasil!");
        setError("");
        window.location.href = "/dashboardadmin";
      } else {
        setError("Username atau password salah.");
        setSuccess("");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Terjadi kesalahan saat mengakses server.");
      setSuccess("");
    }
  };

  const handleBack = () => {
    navigate("/"); // arahkan ke halaman beranda
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Login Admin</h2>

        <div className="input-group">
          <i className="fas fa-user" />
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <i className="fas fa-lock" />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className="error-msg">{error}</p>}
        {success && <p className="success-msg">{success}</p>}

        <button type="submit" className="login-btn">
          <i className="fas fa-sign-in-alt" style={{ marginRight: "8px" }} />
          Masuk
        </button>

        <button
          type="button"
          onClick={handleBack}
          className="back-btn-enhanced"
        >
          <i className="fas fa-arrow-left" />
          <span className="text">Kembali</span>
        </button>
      </form>

      <style jsx>{`
        .login-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(90deg, #6a11cb 0%, #2575fc 100%);
        }

        .login-form {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          width: 100%;
          max-width: 400px;
        }

        .input-group {
          display: flex;
          align-items: center;
          margin-bottom: 1rem;
          border: 1px solid #ccc;
          border-radius: 8px;
          padding: 0.5rem;
        }

        .input-group i {
          margin-right: 10px;
          color: #666;
        }

        .input-group input {
          border: none;
          outline: none;
          flex: 1;
          font-size: 1rem;
        }

        .login-btn {
          width: 100%;
          background: #2575fc;
          color: white;
          padding: 10px 0;
          font-size: 1rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .login-btn:hover {
          background: #1a5edc;
        }

        .error-msg {
          color: red;
          font-size: 0.9rem;
          margin-top: -8px;
          margin-bottom: 10px;
        }

        .success-msg {
          color: green;
          font-size: 0.9rem;
          margin-top: -8px;
          margin-bottom: 10px;
        }
        .back-btn-enhanced {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(90deg, #d3d3d3 0%, #f1f1f1 100%);
          color: #333;
          padding: 10px 18px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 15px;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          margin-top: 16px;
        }

        .back-btn-enhanced:hover {
          background: linear-gradient(90deg, #b4b4b4, #e0e0e0);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }

        .back-btn-enhanced i {
          transition: transform 0.3s ease;
        }

        .back-btn-enhanced:hover i {
          transform: translateX(-4px);
        }
      `}</style>
    </div>
  );
}
