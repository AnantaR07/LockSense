import "@fortawesome/fontawesome-free/css/all.min.css";
import React, { useEffect, useState } from "react";
import { getDatabase, ref, onValue, update, remove } from "firebase/database";
import NavbarLocksense from "../component/NavbarAdmin";
import FooterLocksense from "../component/Footer";
import { JSEncrypt } from "jsencrypt";

export default function DashboardAdmin() {
  const [users, setUsers] = useState({});
  const [notif, setNotif] = useState("");
  const db = getDatabase();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [publicKeyInput, setPublicKeyInput] = useState("");
  const [privateKeyInput, setPrivateKeyInput] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [uidInput, setUidInput] = useState("");
  const [rsaNotif, setRsaNotif] = useState("");

  useEffect(() => {
    const usersRef = ref(db, "users");
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      setUsers(data || {});
    });
  }, []);

  const handleTambahKamarBaru = async () => {
    const nextUserNumber = Object.keys(users).length + 1;
    const newUserKey = `user${nextUserNumber}`;

    const newUserData = {
      uid: `UID-${Date.now()}`,
      rsaKeys: { public: "" },
      rooms: {
        [`Kamar ${nextUserNumber}`]: {
          penghuni: {
            nama: "user",
            no_hp: "-",
          },
        },
        status_pintu: "tertutup",
      },
    };

    try {
      await update(ref(db), {
        [`users/${newUserKey}`]: newUserData,
      });

      setNotif(`Kamar baru berhasil ditambahkan sebagai ${newUserKey}`);
      setTimeout(() => setNotif(""), 4000);
    } catch (error) {
      console.error("Gagal menambahkan kamar:", error);
      setNotif("Gagal menambahkan kamar.");
      setTimeout(() => setNotif(""), 4000);
    }
  };

  const handleEditRSAKeys = (userId) => {
    const user = users[userId];
    setSelectedUserId(userId);
    setPublicKeyInput(user?.rsaKeys?.public || "");
    setPrivateKeyInput(user?.rsaKeys?.private || "");
    setUidInput(user?.uid || "");
    setShowEditModal(true);
  };

  const handleSaveRSAKeys = async () => {
    try {
      // Validasi RSA key format
      if (
        !publicKeyInput.startsWith("-----BEGIN PUBLIC KEY-----") ||
        !publicKeyInput.includes("-----END PUBLIC KEY-----") ||
        !privateKeyInput.startsWith("-----BEGIN RSA PRIVATE KEY-----") ||
        !privateKeyInput.includes("-----END RSA PRIVATE KEY-----")
      ) {
        setRsaNotif(
          "Public/private key tidak valid! Harus dalam format PEM RSA."
        );
        setTimeout(() => setRsaNotif(""), 4000); // Hilang setelah 4 detik
        return;
      }

      const userRef = ref(db, `users/${selectedUserId}`);
      const updates = {
        [`users/${selectedUserId}/rsaKeys/public`]: publicKeyInput,
        [`users/${selectedUserId}/rsaKeys/private`]: privateKeyInput,
        [`users/${selectedUserId}/uid`]: uidInput,
      };

      const userSnapshot = await onValueOnce(userRef);
      const userData = userSnapshot.val();

      // Kirim UID ke WhatsApp penghuni kamar pertama (jika ada)
      let phone = "-";
      let nama = "penghuni";
      if (userData?.rooms) {
        for (const [kamarKey, kamarValue] of Object.entries(userData.rooms)) {
          if (kamarKey === "status_pintu") continue;
          phone = kamarValue?.penghuni?.no_hp || "-";
          nama = kamarValue?.penghuni?.nama || "penghuni";
          break;
        }
      }

      await update(ref(db), updates);

      // Kirim pesan UID via WhatsApp
      if (phone !== "-" && phone.trim() !== "") {
        const message = `Halo ${nama}, ini adalah UID untuk akses pintu: *${uidInput}*. Jangan dibagikan ke orang lain.`;
        const encodedMsg = encodeURIComponent(message);
        let phoneNum = phone.replace(/\D/g, "");
        if (phoneNum.startsWith("0")) {
          phoneNum = "62" + phoneNum.slice(1); // ganti 0 jadi 62
        }
        window.open(`https://wa.me/${phoneNum}?text=${encodedMsg}`, "_blank");
      }

      setNotif(`UID dan RSA untuk ${selectedUserId} berhasil disimpan.`);
      setShowEditModal(false);
      setTimeout(() => setNotif(""), 4000);
    } catch (err) {
      console.error("Gagal menyimpan RSA & UID:", err);
      setNotif("Terjadi kesalahan saat menyimpan UID dan RSA.");
      setTimeout(() => setNotif(""), 4000);
    }
  };

  const handleHapusKamar = (userId) => {
    setUserToDelete(userId);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      const kamarRef = ref(db, `users/${userToDelete}`);
      await remove(kamarRef);

      setUsers((prevUsers) => {
        const updatedUsers = { ...prevUsers };
        delete updatedUsers[userToDelete];
        return updatedUsers;
      });

      setNotif(`User "${userToDelete}" berhasil dihapus.`);
    } catch (err) {
      console.error("Gagal menghapus user:", err);
      setNotif("Terjadi kesalahan saat menghapus user.");
    } finally {
      setUserToDelete(null);
      setShowConfirmModal(false);
      setTimeout(() => setNotif(""), 4000);
    }
  };

  const handleSetDefault = async (userId) => {
    const userRef = ref(db, `users/${userId}`);
    const userSnapshot = await onValueOnce(userRef);
    const userData = userSnapshot.val();
    if (!userData || !userData.rooms) return;

    const updates = {};
    Object.entries(userData.rooms).forEach(([kamarKey]) => {
      if (kamarKey === "status_pintu") return;
      updates[`users/${userId}/rooms/${kamarKey}/penghuni/nama`] = "user";
      updates[`users/${userId}/rooms/${kamarKey}/penghuni/no_hp`] = "-";
    });

    await update(ref(db), updates);

    setNotif("Data berhasil disetel ulang ke default!");
    setTimeout(() => setNotif(""), 4000);
  };

  const onValueOnce = (refTarget) => {
    return new Promise((resolve) => {
      onValue(refTarget, (snapshot) => resolve(snapshot), { onlyOnce: true });
    });
  };

  const generateKeys = () => {
    const crypt = new JSEncrypt({ default_key_size: 2048 });
    crypt.getKey();

    const publicKey = crypt.getPublicKey(); // ✅ Format PEM
    const privateKey = crypt.getPrivateKey(); // ✅ Format PEM

    setPublicKeyInput(publicKey); // langsung simpan ini
    setPrivateKeyInput(privateKey);
  };

  return (
    <>
      <NavbarLocksense />
      <div className="dashboard-container">
        <h2>Dashboard Admin</h2>

        {notif && (
          <div className="notif">
            <i className="fas fa-check-circle"></i> {notif}
            <span className="close" onClick={() => setNotif("")}>
              ×
            </span>
          </div>
        )}

        <div className="add-room-section">
          <button className="add-button" onClick={handleTambahKamarBaru}>
            + Tambah Kamar Baru
          </button>
        </div>

        <table>
          <thead>
            <tr>
              <th>No. User</th>
              <th>Kamar</th>
              <th>Nama Penghuni</th>
              <th>No HP</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(users).map(([userId, userData], userIndex) => {
              const rooms = userData.rooms || {};
              const kamarKeys = Object.keys(rooms).filter(
                (key) => key !== "status_pintu"
              );

              return kamarKeys.map((kamar, index) => {
                const penghuni = rooms[kamar]?.penghuni || {};
                return (
                  <tr key={`${userId}-${kamar}`}>
                    {index === 0 && (
                      <td rowSpan={kamarKeys.length}>{userIndex + 1}</td>
                    )}
                    <td>{kamar}</td>
                    <td>{penghuni.nama || "-"}</td>
                    <td>{penghuni.no_hp || "-"}</td>
                    <td>
                      <div className="button-group">
                        <button
                          className="default"
                          onClick={() => handleSetDefault(userId)}
                          style={{ marginBottom: "6px" }}
                        >
                          Set Ulang
                        </button>
                        <button
                          className="edit"
                          onClick={() => handleEditRSAKeys(userId)}
                          style={{ marginTop: "6px" }}
                        >
                          Edit Data
                        </button>
                        <button
                          className="delete"
                          onClick={() => handleHapusKamar(userId, kamar)}
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>
      <FooterLocksense />

      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <h3>Edit RSA Keys - {selectedUserId}</h3>
              <button onClick={generateKeys} className="edit random-btn">
                Generate RSA
              </button>
            </div>
            <label>
              UID:
              <input
                type="text"
                value={uidInput}
                onChange={(e) => setUidInput(e.target.value)}
                className="uid-input"
              />
            </label>

            <label>
              Public Key:
              <textarea
                value={publicKeyInput}
                onChange={(e) => setPublicKeyInput(e.target.value)}
                rows={4}
              />
            </label>

            <label>
              Private Key:
              <textarea
                value={privateKeyInput}
                onChange={(e) => setPrivateKeyInput(e.target.value)}
                rows={4}
              />
            </label>

            <div className="modal-buttons">
              <button onClick={handleSaveRSAKeys} className="default">
                Simpan
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="delete"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h3>Konfirmasi Penghapusan</h3>
            <p>
              Apakah kamu yakin ingin menghapus <strong>{userToDelete}</strong>?
            </p>
            <div className="modal-buttons">
              <button className="delete" onClick={confirmDelete}>
                Ya, Hapus
              </button>
              <button
                className="default"
                onClick={() => setShowConfirmModal(false)}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {rsaNotif && (
        <div className="toast-rsa-error">
          <i className="fas fa-exclamation-triangle"></i> {rsaNotif}
        </div>
      )}

      <style jsx>{`
        body {
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          background: #f2f4f7;
        }

        .dashboard-container {
          max-width: 1100px;
          margin: 80px auto;
          padding: 24px;
          background: linear-gradient(90deg, #6a11cb 0%, #2575fc 100%);
          border-radius: 16px;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
          color: white;
        }
        .button-group {
          display: flex;
          justify-content: center; /* <-- Ini yang penting */
          gap: 8px;
        }

        h2 {
          text-align: center;
          margin-bottom: 24px;
          font-size: 28px;
          font-weight: bold;
        }

        .notif {
          background-color: #e6f9f0;
          color: #1a7f4d;
          padding: 12px 16px;
          border-radius: 8px;
          border-left: 6px solid #1a7f4d;
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 600px;
          margin: 16px auto;
          font-weight: 500;
        }

        .close {
          cursor: pointer;
          font-weight: bold;
          color: #1a7f4d;
        }

        .add-room-section {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 15px;
        }

        .add-button {
          background-color: #ffffff;
          color: #2575fc;
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
          box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
          transition: background 0.3s;
        }

        .add-button:hover {
          background-color: #e3e3e3;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          color: #333;
          border-radius: 8px;
          overflow: hidden;
        }

        th,
        td {
          padding: 12px 14px;
          text-align: left;
          border-bottom: 1px solid #ddd;
          text-align: center;
        }

        th {
          background-color: #2575fc;
          color: white;
          text-transform: uppercase;
          font-size: 14px;
        }

        .default,
        .delete,
        .edit {
          padding: 8px 14px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: background-color 0.3s ease;
          margin-top: 6px;
          display: inline-block;
        }

        .default {
          background-color: #ffffff;
          color: #2575fc;
        }

        .default:hover {
          background-color: #e8f0fe;
        }

        .delete {
          background-color: #e53935;
          color: white;
        }

        .delete:hover {
          background-color: #c62828;
        }

        .edit {
          background-color: #ff9800;
          color: white;
        }

        .edit:hover {
          background-color: #fb8c00;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          padding: 24px;
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          color: #333;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
          animation: fadeIn 0.3s ease-out;
        }

        .modal-content h3 {
          margin-top: 0;
          color: #2575fc;
          margin-bottom: 16px;
        }

        .modal-content label {
          display: block;
          margin-bottom: 10px;
          font-weight: bold;
          color: #444;
        }

        .modal-content textarea {
          width: 100%;
          padding: 10px;
          resize: vertical;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-family: monospace;
          margin-bottom: 12px;
        }

        .modal-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 20px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .random-btn {
          padding: 6px 10px;
          background-color: #ffa500;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          transition: background-color 0.2s ease;
        }

        .random-btn:hover {
          background-color: #e69500;
        }

        .modal-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }

        .toast-rsa-error {
          position: fixed;
          top: 20px;
          right: 20px;
          background-color: #ff4d4f;
          color: white;
          padding: 12px 16px;
          border-radius: 6px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          z-index: 9999;
          font-weight: bold;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .toast-rsa-error i {
          font-size: 18px;
        }

        @keyframes fadeIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
