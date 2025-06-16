import React from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function NavbarLocksense() {
  const navigate = useNavigate();

  const handleLogout = () => {
    Swal.fire({
      title: "Yakin ingin logout?",
      text: "Kamu akan kembali ke halaman login.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2575fc",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, logout",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Logout berhasil!",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
        setTimeout(() => {
          navigate("/loginadmin"); // Ganti rute sesuai kebutuhan
        }, 1500);
      }
    });
  };
  return (
    <>
      <nav className="navbar">
        <div className="logo">
          <img src="/img/logo.png" alt="Logo" className="logo-img" />
        </div>

        <button className="logout-button" onClick={handleLogout}>
          <i className="fas fa-sign-out-alt" />
          <span className="text">Logout</span>
        </button>
      </nav>

      <style jsx>{`
        .navbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 2rem;
          height: 70px;
          background: linear-gradient(90deg, #6a11cb 0%, #2575fc 100%);
          color: white;
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        }

        .logo-img {
          height: 48px;
          width: 48px;
          border-radius: 50%;
          background-color: white;
          padding: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          object-fit: cover;
        }

        .logout-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          color: #2575fc;
          padding: 8px 14px;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .logout-button:hover {
          background: #2575fc;
          color: white;
          transform: translateY(-2px);
        }

        .logout-button i {
          font-size: 14px;
        }
      `}</style>
    </>
  );
}
