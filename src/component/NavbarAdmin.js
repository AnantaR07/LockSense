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
          navigate("/loginadmin");
        }, 1500);
      }
    });
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-left">
          <img src="/img/logo.png" alt="Logo" className="logo-img" />
          <span className="navbar-title">Dashboard Admin</span>
        </div>

        <button className="logout-button" onClick={handleLogout}>
          <i className="fas fa-sign-out-alt" />
          <span>Logout</span>
        </button>
      </nav>

      <style jsx>{`
        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 70px;
          padding: 0 2rem;
          background: linear-gradient(90deg, #6a11cb 0%, #2575fc 100%);
          color: white;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        }

        .navbar-left {
          display: flex;
          align-items: center;
          gap: 16px;
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

        .navbar-title {
          font-size: 1.25rem;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .logout-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background-color: white;
          color: #2575fc;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }

        .logout-button:hover {
          background-color: #2575fc;
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
