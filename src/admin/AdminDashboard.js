import "@fortawesome/fontawesome-free/css/all.min.css";
import React, { useEffect, useState } from "react";
import { getDatabase, ref, onValue, update } from "firebase/database";
import NavbarLocksense from "../component/NavbarAdmin";
import FooterLocksense from "../component/Footer";
import MD5 from "crypto-js/md5";

export default function DashboardAdmin() {
  const [users, setUsers] = useState({});
  const [notif, setNotif] = useState(""); // Notifikasi
  const db = getDatabase();

  useEffect(() => {
    const usersRef = ref(db, "users");
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      setUsers(data || {});
    });
  }, []);

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

    updates[`users/${userId}/username`] = "User";
    updates[`users/${userId}/password`] = MD5("User").toString();

    await update(ref(db), updates);

    // Tampilkan notifikasi UI
    setNotif("Data berhasil disetel ulang ke default!");
    setTimeout(() => setNotif(""), 4000); // Hilang otomatis
  };

  const onValueOnce = (refTarget) => {
    return new Promise((resolve) => {
      onValue(
        refTarget,
        (snapshot) => {
          resolve(snapshot);
        },
        { onlyOnce: true }
      );
    });
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
                    {index === 0 && (
                      <td rowSpan={kamarKeys.length}>
                        <button
                          className="default"
                          onClick={() => handleSetDefault(userId)}
                        >
                          Set Ulang User
                        </button>
                      </td>
                    )}
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>

      <FooterLocksense />

      <style jsx>{`
        .dashboard-container {
          max-width: 1000px;
          margin: 80px auto;
          padding: 20px;
          background: #ffffff;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border-radius: 12px;
        }

        h2 {
          text-align: center;
          color: #2575fc;
          margin-bottom: 20px;
        }

        .notif {
          margin: 10px auto;
          background-color: #e6f9f0;
          color: #1a7f4d;
          padding: 12px 16px;
          border-radius: 8px;
          font-weight: 500;
          border-left: 6px solid #1a7f4d;
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 600px;
          animation: fadeIn 0.3s ease-in-out;
        }

        .notif i {
          margin-right: 10px;
        }

        .close {
          margin-left: 10px;
          cursor: pointer;
          font-weight: bold;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }

        th,
        td {
          border: 1px solid #ddd;
          padding: 10px;
          text-align: left;
          vertical-align: top;
        }

        th {
          background: #2575fc;
          color: white;
        }

        button {
          padding: 6px 10px;
          margin: 2px 0;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
        }

        .default {
          background-color: #2575fc;
          color: white;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
