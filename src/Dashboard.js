import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getDatabase,
  ref,
  get,
  child,
  push,
  onValue,
  update,
  off,
} from "firebase/database";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { initializeApp } from "firebase/app";
import NavbarLocksense from "./component/Navbar";
import FooterLocksense from "./component/Footer";
import md5 from "blueimp-md5";

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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const dbRef = ref(db);

const ROOM_API_KEYS = {
  "Kamar 1": "L8fWqXcA93nPbRtYZ2oML7uEiWvH5kNs",
  "Kamar 2": "eDkYqZC91pRva0LnTuXgjNBKW74hXsMF",
  "Kamar 3": "xPNyRmBJqdVAOzT72LWKM5vg0rE9chFs",
};

export default function RSADashboard() {
  const [selectedRoom, setSelectedRoom] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [namaPenghuni, setNamaPenghuni] = useState("");
  const [noHpPenghuni, setNoHpPenghuni] = useState("");
  const [userRooms, setUserRooms] = useState({});
  const [currentRoomData, setCurrentRoomData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [room, setRoom] = useState("");
  const [roomData, setRoomData] = useState(null);
  const [rsaPrivateKey, setRsaPrivateKey] = useState("");
  const [rsaPublicKey, setRsaPublicKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const formatDateTime = () => {
    const now = new Date();
    const hari = now.toLocaleDateString("id-ID", { weekday: "long" });
    const tanggal = now.toLocaleDateString("id-ID");
    const waktu = now.toLocaleTimeString("id-ID");
    return `${hari}, ${tanggal} - ${waktu}`;
  };

  const logLoginActivity = async (roomPath) => {
    const logRef = ref(db, `users/${roomPath}/logs`);
    const newLog = { status: "Login berhasil", waktu: formatDateTime() };
    const newLogRef = await push(logRef, newLog);
    return { key: newLogRef.key, ...newLog };
  };

  const fetchRoomData = async (uid, room) => {
    try {
      const snapshot = await get(child(dbRef, `users/${uid}/rooms/${room}`));
      return snapshot.exists() ? snapshot.val() : null;
    } catch {
      return null;
    }
  };

  const fetchPenghuniData = async (uid, room) => {
    try {
      const penghuniSnapshot = await get(
        child(dbRef, `users/${uid}/rooms/${room}/penghuni`)
      );
      if (penghuniSnapshot.exists()) {
        const penghuniData = penghuniSnapshot.val();
        setNamaPenghuni(penghuniData.nama || "");
        setNoHpPenghuni(penghuniData.no_hp || "");
      } else {
        setNamaPenghuni("");
        setNoHpPenghuni("");
      }
    } catch (error) {
      console.error("Gagal mengambil data penghuni:", error);
      setNamaPenghuni("");
      setNoHpPenghuni("");
    }
  };

  const fetchRSAKeys = async (uid) => {
    try {
      const rsaSnapshot = await get(child(dbRef, `users/${uid}/rsaKeys`));
      if (rsaSnapshot.exists()) {
        const rsaData = rsaSnapshot.val();
        setRsaPrivateKey(rsaData.private || "");
        setRsaPublicKey(rsaData.public || "");
        console.log("RSA Key berhasil diambil:", rsaData);
      } else {
        console.warn("RSA Key tidak ditemukan di Firebase.");
      }
    } catch (err) {
      console.error("Gagal mengambil RSA key:", err);
    }
  };

  const handleLogin = async () => {
    setError("");
    setIsAuthenticated(false);
    setUserRooms({});
    setCurrentRoomData(null);

    if (!selectedRoom) {
      setError("Silakan pilih kamar terlebih dahulu.");
      setShowErrorModal(true);
      return;
    }

    setIsLoading(true);

    try {
      const snapshot = await get(child(dbRef, "users"));
      if (!snapshot.exists()) throw new Error("Tidak ada data pengguna.");
      const usersData = snapshot.val();

      const hashedPassword = md5(password); // Gunakan MD5 seperti yang kamu pakai

      const foundUserEntry = Object.entries(usersData).find(
        ([, userVal]) =>
          userVal.username === username &&
          userVal.password === hashedPassword &&
          userVal.rooms &&
          userVal.rooms[selectedRoom]
      );

      if (!foundUserEntry) {
        throw new Error("Username, password, atau kamar salah.");
      }

      const [userKey, userData] = foundUserEntry;

      await fetchPenghuniData(userKey, selectedRoom);
      await fetchRSAKeys(userKey);

      const newLog = await logLoginActivity(`${userKey}/rooms/${selectedRoom}`);
      const updatedRoomData = await fetchRoomData(userKey, selectedRoom);
      setRoomData(updatedRoomData);

      const updatedRooms = { ...userData.rooms };
      if (!updatedRooms[selectedRoom].logs)
        updatedRooms[selectedRoom].logs = {};
      updatedRooms[selectedRoom].logs[newLog.key] = {
        status: newLog.status,
        waktu: newLog.waktu,
      };

      setRoom(selectedRoom);
      setUserId(userKey);
      setUserRooms(updatedRooms);
      setCurrentRoomData(updatedRoomData);
      setIsAuthenticated(true);
      await update(ref(db, `users/${userKey}/rooms`), {
        status_pintu: "terbuka",
      });
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat login.");
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && userId && selectedRoom) {
      const logsRef = ref(db, `users/${userId}/rooms/${selectedRoom}/logs`);
      const listener = onValue(logsRef, (snapshot) => {
        const logsData = snapshot.val() || {};
        setUserRooms((prev) => {
          const updated = { ...prev };
          if (!updated[selectedRoom]) updated[selectedRoom] = {};
          updated[selectedRoom].logs = logsData;
          return updated;
        });
        setCurrentRoomData((prev) => ({ ...prev, logs: logsData }));
      });
      return () => off(logsRef, "value", listener);
    }
  }, [isAuthenticated, userId, selectedRoom]);

  const getLatestLogs = () => {
    if (!currentRoomData?.logs) return [];

    const parseIndoDate = (waktuString) => {
      // Contoh: "Jumat, 30/5/2025 - 05.29.50"
      const regex = /(\d{1,2})\/(\d{1,2})\/(\d{4}) - (\d{2})\.(\d{2})\.(\d{2})/;
      const match = waktuString.match(regex);
      if (!match) return new Date(0); // fallback jika gagal parsing

      const [, day, month, year, hour, minute, second] = match;
      // Format ke ISO: YYYY-MM-DDTHH:MM:SS
      const isoString = `${year}-${month.padStart(2, "0")}-${day.padStart(
        2,
        "0"
      )}T${hour}:${minute}:${second}`;
      return new Date(isoString);
    };

    return Object.entries(currentRoomData.logs)
      .map(([key, log]) => ({
        key,
        ...log,
        waktuDate: parseIndoDate(log.waktu),
      }))
      .sort((a, b) => b.waktuDate - a.waktuDate) // urutkan dari terbaru
      .slice(0, 6); // ambil 6 data terbaru
  };

  const handleClick = () => {
    console.log("Room yang akan dikirim:", selectedRoom);
    console.log("Data Room:", roomData);
  };

  const handleLogout = async () => {
    if (userId && selectedRoom) {
      try {
        await update(ref(db, `users/${userId}/rooms`), {
          status_pintu: "tertutup",
        });
      } catch (err) {
        console.error("Gagal mengubah status_pintu saat logout:", err);
      }
    }

    setIsAuthenticated(false);
    setUsername("");
    setPassword("");
    setSelectedRoom("");
    setError("");
    setNamaPenghuni("");
    setNoHpPenghuni("");
    setUserRooms({});
    setCurrentRoomData(null);
    setUserId(null);
    setRoom("");
    setRoomData(null);
  };

  return (
    <div className="dashboard-container">
      <NavbarLocksense />
      <main class="content">
        <header className="dashboard-header">
          <h1>RSA Security Dashboard</h1>
          <p>Pantau keamanan setiap kamar secara real-time.</p>

          <div className="dropdown-container">
            <div className="room-select-container">
              <select
                id="room-select"
                value={selectedRoom}
                onChange={(e) => {
                  setSelectedRoom(e.target.value);
                  // Reset state saat ganti kamar
                  setUsername("");
                  setPassword("");
                  setIsAuthenticated(false);
                  setError("");
                  setUserRooms({});
                  setCurrentRoomData(null);
                  setUserId(null);
                }}
              >
                <option value="">-- Pilih Kamar --</option>
                {Object.keys(ROOM_API_KEYS).map((room) => (
                  <option key={room} value={room}>
                    {room}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Form Login hanya tampil jika sudah memilih kamar dan belum authenticated */}
          {!isAuthenticated && selectedRoom && (
            <div className="login-container">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
              <div
                style={{
                  position: "relative",
                  width: "100%",
                }}
              >
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  style={{
                    width: "100%",
                    paddingRight: "40px",
                    padding: "8px",
                    boxSizing: "border-box",
                  }}
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                    color: "#555",
                  }}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              <button onClick={handleLogin} disabled={isLoading}>
                {isLoading ? "Memproses..." : "Login"}
              </button>
              {/* Error tampil di modal */}
              {/* Kalau tetap mau error inline bisa uncomment ini */}
              {/* {error && <div className="error">{error}</div>} */}
            </div>
          )}

          {/* Tampilkan data kamar jika sudah login */}
          {isAuthenticated && currentRoomData && (
            <div className="dashboard-content">
              <div className="penghuni-info">
                <h3>Informasi Penghuni</h3>
                <p>
                  <strong>Nama:</strong> {namaPenghuni || "Tidak tersedia"}
                </p>
                <p>
                  <strong>No HP:</strong> {noHpPenghuni || "Tidak tersedia"}
                </p>
              </div>
              <Link
                to="/edituserform"
                state={{
                  nama: namaPenghuni,
                  nohp: noHpPenghuni,
                  username,
                  userId,
                  room: selectedRoom,
                  roomData,
                }}
                className="room-info"
              >
                <button className="edit-button" onClick={handleClick}>
                  Edit Data
                </button>
              </Link>

              <button
                className="logout-button"
                onClick={handleLogout}
                style={{
                  marginTop: "10px",
                  padding: "10px",
                  borderRadius: "5px",
                }}
              >
                Logout
              </button>

              <section className="activity-log">
                <h4>Log Aktivitas Terbaru</h4>
                <ul>
                  {getLatestLogs().map(({ key, status, waktu }) => (
                    <li key={key}>
                      {status} - {waktu}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )}
        </header>

        {/* Modal error */}
        {showErrorModal && (
          <div
            className="modal-overlay"
            onClick={() => setShowErrorModal(false)}
          >
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <h3>Kesalahan</h3>
              <p>{error}</p>
              <button onClick={() => setShowErrorModal(false)}>Tutup</button>
            </div>
          </div>
        )}

        {/* Styles */}
        <style>{`
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f9f9f9;
          margin: 0;
          padding: 0;
          color: #333;
        }
          .dashboard-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.content {
  flex: 1; /* Ini memastikan konten utama mendorong footer ke bawah */
}
        .dashboard-header {
          background: linear-gradient(90deg, #6a11cb 0%, #2575fc 100%);
          color: white;
          padding: 2rem 1rem;
          text-align: center;
        }
        .dashboard-header h1 {
          margin-bottom: 0.5rem;
        }
        .dashboard-header p {
          font-size: 1.1rem;
          margin-top: 0;
        }
        .dropdown-container {
          margin: 1rem auto;
          max-width: 320px;
        }
        label {
          margin-right: 0.5rem;
          font-weight: bold;
        }
        select {
          padding: 0.4rem 0.8rem;
          font-size: 1rem;
          border-radius: 4px;
          border: 1px solid #ccc;
        }
        .login-container {
          margin-top: 1rem;
          max-width: 320px;
          margin-left: auto;
          margin-right: auto;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .login-container input {
          padding: 0.6rem 0.8rem;
          font-size: 1rem;
          border-radius: 4px;
          border: 1px solid #ccc;
        }
        .login-container button {
          background-color: #004a99;
          color: white;
          padding: 0.6rem;
          font-size: 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        .login-container button:hover {
          background-color: #003366;
        }
        .loading {
          text-align: center;
          margin: 2rem 0;
          font-weight: bold;
          font-size: 1.2rem;
        }
       .dashboard-content {
  max-width: 700px;
  margin: 2rem auto;
  background: #ffffff;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  color: #333333; /* Warna teks gelap */
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.welcome-text {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.room-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  margin-top:5%;

}
  .room-title {
  text-align: center;
  width: 100%;
  font-size: 0.9rem;
}

.activity-log {
  background: #f5f7fa;
  border-radius: 10px;
  padding: 1rem 1.2rem;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #333;
  width: 95%;
}

.activity-log h4 {
  font-size: 1.3rem;
  font-weight: 700;
  color: #222;
  margin-bottom: 1rem;
  border-bottom: 2px solid #4a90e2;
  padding-bottom: 0.3rem;
  letter-spacing: 0.02em;
}

.activity-log ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.activity-log li {
  background: #fff;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.6rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  display: flex;
  align-items: center;
  font-size: 0.95rem;
  transition: background-color 0.3s ease;
  cursor: default;
}

/* Icon circle before each log item */
.activity-log li::before {
  content: '';
  display: inline-block;
  width: 10px;
  height: 10px;
  margin-right: 12px;
  border-radius: 50%;
  background-color: #4a90e2;
  flex-shrink: 0;
}

/* Hover effect */
.activity-log li:hover {
  background-color: #e7f0fd;
}

/* Timestamp styling */
.activity-log li span.time {
  margin-left: auto;
  font-size: 0.8rem;
  color: #999;
  font-style: italic;
  white-space: nowrap;
}


.penghuni-info {
  position: relative;
  background-color: #f9f9f9;
  padding: 1rem 1.5rem 1rem 1rem; /* padding kiri normal, kanan agak lebih kecil */
  margin-top: 1rem;
  border-radius: 12px;
  border: 1px solid #ccc;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}


/* Gradient pojok kiri atas */
.penghuni-info::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 200px;
  height: 100px;
  background: linear-gradient(
    135deg,
    rgba(106, 17, 203, 0.3),
    rgba(37, 117, 252, 0.15) 50%,
    transparent 90%
  );
  border-top-left-radius: 50% 50%;
  pointer-events: none;
  filter: blur(10px);
  z-index: 0;
  transform: translate(-10px, -22px);
}

/* Gradient pojok kanan bawah */
.penghuni-info::after {
  content: "";
  position: absolute;
  bottom: 0;
  right: 0;
  width: 150px;
  height: 80px;
  background: linear-gradient(
    315deg,
    rgba(106, 17, 203, 0.3),
    rgba(37, 117, 252, 0.15) 50%,
    transparent 90%
  );
  border-bottom-right-radius: 50% 50%;
  pointer-events: none;
  filter: blur(10px);
  z-index: 0;
  transform: translate(10px, 10px);
}


/* Supaya isi di depan gradient */
.penghuni-info > * {
  position: relative;
  z-index: 1;
}
.logout-button {
  background-color:rgb(255, 255, 255);
  color: #6a11cb; /* ungu */
  border: 2px solid #6a11cb; /* garis ungu */
  padding: 12px 24px;
  margin-top: 16px;
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
  font-size: 16px;
  font-weight: 600;
  transition: background-color 0.3s ease, transform 0.2s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.logout-button:hover {
  background-color:rgb(255, 255, 255); /* merah muda lembut */
  transform: scale(1.02); /* sedikit membesar saat hover */
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.15);
}



        .status-card {
          margin-bottom: 2rem;
        }
        .status-card h2 {
          margin-bottom: 1rem;
          color: #004a99;
        }
        .status-card ul {
          list-style: none;
          padding-left: 0;
          font-size: 1.1rem;
        }
        .status-card ul li {
          margin-bottom: 0.5rem;
        }
        .status-safe {
          color: green;
          font-weight: bold;
        }
        .status-danger {
          color: red;
          font-weight: bold;
        }
.edit-button {
  position: relative;
  background: linear-gradient(90deg, #6a11cb 0%, #2575fc 100%);
  color: white; /* pastikan teks tetap putih */
  border: none;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  border-radius: 6px;
  cursor: pointer;
  overflow: hidden;
  width: 100%;
  z-index: 1; /* pastikan tombol di atas pseudo-elemen */
}

/* Pseudo element untuk hover background */
.edit-button::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #2575fc 0%, #6a11cb 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 6px;
  z-index: -1; /* taruh di bawah tombol */
}

/* Container label + select */
.room-select-container {
  display: flex;
  flex-direction: column;
  max-width: 320px;
  margin: 1rem auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* Label */
.room-select-container label {
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
  font-size: 1rem;
}

/* Select box */
.room-select-container select {
  padding: 0.6rem 1rem;
  border-radius: 8px;
  border: 2px solid #ccc;
  background-color: #f9f9f9;
  font-size: 1rem;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  appearance: none; /* Buat hilangkan default dropdown arrow */
  background-image: url("data:image/svg+xml,%3Csvg fill='gray' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1rem;
}

/* Hover dan fokus */
.room-select-container select:hover,
.room-select-container select:focus {
  border-color: #0056b3;
  box-shadow: 0 0 8px rgba(0, 86, 179, 0.3);
  outline: none;
  background-color: #fff;
}


/* Saat hover, overlay muncul */
.edit-button:hover::before {
  opacity: 1;
}
        .log-section h3 {
          margin-bottom: 1rem;
          color: #004a99;
          text-align: center;
        }
        .log-table {
          width: 100%;
          border-collapse: collapse;
        }
        .log-table th,
        .log-table td {
          padding: 0.8rem 1rem;
          border-bottom: 1px solid #ccc;
          text-align: left;
        }
        .log-table tbody tr:hover {
          background-color: #f0f8ff;
        }
        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.4);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
        }
        .modal-content {
          background: white;
          padding: 1.5rem 2rem;
          border-radius: 8px;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 2px 15px rgba(0, 0, 0, 0.3);
          text-align: center;
        }
        .modal-content h2 {
          margin-top: 0;
          color: #d32f2f;
        }
        .modal-content p {
          margin: 1rem 0 1.5rem;
        }
        .modal-content button {
          background-color: #d32f2f;
          color: white;
          border: none;
          padding: 0.6rem 1.2rem;
          font-size: 1rem;
          border-radius: 6px;
          cursor: pointer;
        }
        .modal-content button:hover {
          background-color: #b71c1c;
        }
      `}</style>
      </main>
      <FooterLocksense />
    </div>
  );
}
