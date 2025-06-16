import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getDatabase, ref, get, update } from "firebase/database";
import { Link } from "react-router-dom";
import NavbarLocksense from "./component/Navbar";
import FooterLocksense from "./component/Footer";
import forge from "node-forge";
import MD5 from "crypto-js/md5";

export default function EditUserForm() {
  const location = useLocation();
  const { userId, room, roomData } = location.state || {};
  const [nama, setNama] = useState("");
  const [noHp, setNoHp] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [publicKeyPem, setPublicKeyPem] = useState(null);
  const [privateKeyPem, setPrivateKeyPem] = useState(null);

  const [notification, setNotification] = useState({ message: "", type: "" });
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    if (roomData?.penghuni) {
      setNama(roomData.penghuni.nama || "");
      setNoHp(roomData.penghuni.no_hp || "");
    }

    const db = getDatabase();
    const userRef = ref(db, `users/${userId}`);

    get(userRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const user = snapshot.val();
          setUsername(user.username || "");
          setPassword("");

          if (user.rsaKeys) {
            setPublicKeyPem(user.rsaKeys.public);
            setPrivateKeyPem(user.rsaKeys.private);
          }
        }
      })
      .catch((error) => {
        console.error("Gagal mengambil data user:", error);
      });
  }, [roomData, userId]);

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setShowNotif(true);
    setTimeout(() => setShowNotif(false), 3000);
  };

  const handleUpdate = async () => {
    try {
      if (!publicKeyPem || !privateKeyPem) {
        showNotification("RSA keys belum siap, coba lagi.", "error");
        return;
      }

      if (password.length > 0 && password.length < 8) {
        showNotification("Password minimal 8 karakter.", "error");
        return;
      }

      const db = getDatabase();

      // Update data penghuni (nama, no_hp)
      await update(ref(db, `users/${userId}/rooms/${room}/penghuni`), {
        nama,
        no_hp: noHp,
      });

      // Update username dan password jika diisi
      const updateData = { username };

      if (password.length >= 8) {
        const keypair = forge.pki.rsa.generateKeyPair({
          bits: 2048,
          e: 0x10001,
        });

        const publicPem = forge.pki.publicKeyToPem(keypair.publicKey);
        const privatePem = forge.pki.privateKeyToPem(keypair.privateKey);

        updateData.rsaKeys = {
          public: publicPem,
          private: privatePem,
        };

        // Hash password dengan MD5
        const hashedPassword = MD5(password).toString();
        updateData.password = hashedPassword;
      }

      await update(ref(db, `users/${userId}`), updateData);

      showNotification("Data berhasil diperbarui!", "success");
      setPassword("");
      setPublicKeyPem(
        updateData.rsaKeys ? updateData.rsaKeys.public : publicKeyPem
      );
      setPrivateKeyPem(
        updateData.rsaKeys ? updateData.rsaKeys.private : privateKeyPem
      );
    } catch (err) {
      console.error("Gagal update:", err);
      showNotification("Gagal update data!", "error");
    }
  };

  const handleSetDefault = async () => {
    try {
      const db = getDatabase();

      const defaultNama = "User";
      const defaultNoHp = "";
      const defaultUsername = "User";
      const defaultPassword = MD5("User").toString();

      await update(ref(db, `users/${userId}/rooms/${room}/penghuni`), {
        nama: defaultNama,
        no_hp: defaultNoHp,
      });

      await update(ref(db, `users/${userId}`), {
        username: defaultUsername,
        password: defaultPassword,
      });

      setNama(defaultNama);
      setNoHp(defaultNoHp);
      setUsername(defaultUsername);
      setPassword(""); // Clear input

      showNotification("Data di-set ke default!", "success");
    } catch (error) {
      console.error("Gagal set default:", error);
      showNotification("Gagal set default!", "error");
    }
  };

  return (
    <div>
      <NavbarLocksense />
      <div className="edit-form-container">
        <div className="edit-form-box">
          <h2 className="edit-form-title">Edit Data Pengguna</h2>

          <div className="form-group">
            <label>Nama:</label>
            <input
              type="text"
              value={nama}
              onChange={(e) => {
                let input = e.target.value;
                if (!/^[a-zA-Z\s]*$/.test(input)) return;
                input = input.replace(/\s+/g, " ").trimStart();
                const words = input === "" ? [] : input.trim().split(" ");
                if (words.length > 35) {
                  input = words.slice(0, 35).join(" ");
                }
                setNama(input);
              }}
              onBlur={() => {
                const wordCount =
                  nama.trim() === "" ? 0 : nama.trim().split(/\s+/).length;
                if (!/^[a-zA-Z\s]+$/.test(nama) || wordCount > 35) {
                  showNotification(
                    "Nama hanya huruf & maksimal 35 kata.",
                    "error"
                  );
                }
              }}
              placeholder="Masukkan nama lengkap"
            />
          </div>

          <div className="form-group">
            <label>Nomor HP:</label>
            <input
              type="text"
              value={noHp}
              onChange={(e) => {
                const input = e.target.value;
                if (/^\d*$/.test(input) && input.length <= 12) {
                  setNoHp(input);
                }
              }}
              onBlur={() => {
                if (!/^0\d{9,11}$/.test(noHp)) {
                  showNotification(
                    "No HP harus 10-12 digit & diawali 0.",
                    "error"
                  );
                }
              }}
              placeholder="Misal: 081234567890"
            />
          </div>

          <div className="form-group">
            <label>Username:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                const input = e.target.value;
                if (input.trim().split(/\s+/).length <= 16) {
                  setUsername(input);
                }
              }}
              onBlur={() => {
                if (username.trim().split(/\s+/).length > 16) {
                  showNotification(
                    "Username tidak boleh lebih dari 16 kata.",
                    "error"
                  );
                }
              }}
              placeholder="Masukkan username"
            />
          </div>

          <div className="form-group">
            <label>Password:</label>
            <div className="password-group">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  if (e.target.value.length <= 16) {
                    setPassword(e.target.value);
                  }
                }}
                placeholder="Masukkan password baru (kosongkan jika tidak ingin ganti)"
                autoComplete="new-password"
              />
              <span
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Sembunyikan" : "Tampilkan"}
              </span>
            </div>
            {password.length > 0 && password.length < 8 && (
              <p style={{ color: "red" }}>Password minimal 8 karakter</p>
            )}
          </div>

          <button className="submit-button" onClick={handleUpdate}>
            Simpan
          </button>
          <div style={{ marginTop: "10px" }}>
            <button className="submit-button" onClick={handleSetDefault}>
              Pengaturan Awal
            </button>
          </div>

          <Link to="/">
            <button className="back-button">Kembali</button>
          </Link>

          {showNotif && (
            <div className={`toast ${notification.type}`}>
              {notification.message}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .edit-form-container {
          min-height: 100vh;
          background: linear-gradient(
              to bottom right,
              rgba(233, 213, 255, 0.9),
              rgba(252, 231, 243, 0.8),
              rgba(219, 234, 254, 0.9)
            ),
            linear-gradient(90deg, #6a11cb 0%, #2575fc 100%);
          background-blend-mode: overlay;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 16px;
        }

        .edit-form-box {
          background-color: rgba(255, 255, 255, 0.9);
          border: 1px solid #c084fc;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          border-radius: 24px;
          width: 100%;
          max-width: 480px;
          padding: 32px;
        }

        .edit-form-title {
          font-size: 28px;
          font-weight: bold;
          color: #a855f7;
          text-align: center;
          margin-bottom: 28px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        label {
          display: block;
          font-weight: 600;
          margin-bottom: 8px;
          color: #7c3aed;
        }

        input[type="text"],
        input[type="password"] {
          width: 90%;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1.5px solid #d8b4fe;
          font-size: 16px;
          color: #5b21b6;
          background-color: #f5f3ff;
          outline: none;
          transition: border-color 0.3s ease;
        }

        input[type="text"]:focus,
        input[type="password"]:focus {
          border-color: #a78bfa;
        }

        .password-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .password-toggle {
          cursor: pointer;
          color: #7c3aed;
          font-weight: 600;
          user-select: none;
          transition: color 0.2s ease;
        }

        .password-toggle:hover {
          color: #a855f7;
        }

        .submit-button {
          background-color: #a855f7;
          color: white;
          font-weight: 700;
          border: none;
          padding: 14px 24px;
          border-radius: 12px;
          width: 100%;
          cursor: pointer;
          font-size: 18px;
          transition: background-color 0.3s ease;
        }

        .submit-button:hover {
          background-color: #7c3aed;
        }

        .toast {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          padding: 14px 28px;
          border-radius: 24px;
          font-weight: 600;
          color: white;
          z-index: 9999;
          user-select: none;
          animation: fadein 0.3s ease forwards, fadeout 0.3s ease 2.7s forwards;
        }

        .toast.success {
          background-color: #22c55e;
        }

        .toast.error {
          background-color: #ef4444;
        }
        .back-button {
          background-color: #ffffff; /* putih */
          color: #6a11cb; /* ungu */
          border: 2px solid #6a11cb; /* garis ungu */
          border-radius: 10px;
          padding: 10px 20px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 10px;
          width: 100%;
        }

        .back-button:hover {
          background-color: #6a11cb; /* latar berubah jadi ungu */
          color: #ffffff; /* teks jadi putih */
        }

        @keyframes fadein {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        @keyframes fadeout {
          from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
          to {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
        }
      `}</style>
      <FooterLocksense />
    </div>
  );
}
