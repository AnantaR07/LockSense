import React, { useState } from "react";
import { Link } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function NavbarLocksense() {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <>
      <nav className="navbar">
        <div className="logo">
          <img src="/img/logo.png" alt="Logo" className="logo-img" />
        </div>

        <ul className={`nav-links ${isOpen ? "open" : ""}`}>
          <li>
            <Link to="/" onClick={() => setIsOpen(false)}>
              Beranda
            </Link>
          </li>
          <li>
            <Link to="/about" onClick={() => setIsOpen(false)}>
              Tentang
            </Link>
          </li>
          <li>
            <Link to="/contact" onClick={() => setIsOpen(false)}>
              Kontak
            </Link>
          </li>
          <li>
            <Link to="/loginadmin" onClick={() => setIsOpen(false)}>
              <button className="admin-login-button">
                <i className="fas fa-sign-in-alt icon" />
                <span className="text">Login Admin</span>
              </button>
            </Link>
          </li>
        </ul>

        <div className="hamburger" onClick={toggleMenu}>
          <div className={`bar ${isOpen ? "change" : ""}`} />
          <div className={`bar ${isOpen ? "change" : ""}`} />
          <div className={`bar ${isOpen ? "change" : ""}`} />
        </div>
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
          position: relative;
          z-index: 10;
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

        .nav-links {
          list-style: none;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin: 0;
          padding: 0;
        }

        .nav-links li a {
          text-decoration: none;
          color: white;
          font-weight: 500;
          transition: color 0.3s ease;
        }

        .nav-links li a:hover {
          color: #ffdd57;
        }

        .admin-login-button {
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

        .admin-login-button:hover {
          background: #2575fc;
          color: white;
          transform: translateY(-2px);
        }

        .icon {
          font-size: 14px;
        }

        /* Hamburger menu */
        .hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          cursor: pointer;
        }

        .bar {
          width: 25px;
          height: 3px;
          background-color: white;
          transition: 0.4s;
          border-radius: 2px;
        }

        .bar.change:nth-child(1) {
          transform: rotate(-45deg) translate(-5px, 6px);
        }

        .bar.change:nth-child(2) {
          opacity: 0;
        }

        .bar.change:nth-child(3) {
          transform: rotate(45deg) translate(-5px, -6px);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .nav-links {
            position: fixed;
            top: 70px;
            right: 0;
            width: 220px;
            height: calc(100vh - 70px);
            flex-direction: column;
            background: #2575fc;
            padding: 2rem 1.5rem;
            transform: translateX(100%);
            transition: transform 0.3s ease-in-out;
            border-radius: 0 0 0 10px;
            box-shadow: -2px 0 10px rgba(0, 0, 0, 0.3);
          }

          .nav-links.open {
            transform: translateX(0);
          }

          .nav-links li {
            margin-bottom: 1rem;
          }

          .hamburger {
            display: flex;
          }
        }
      `}</style>
    </>
  );
}
