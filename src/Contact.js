import React from "react";
import NavbarLocksense from "./component/Navbar";
import FooterLocksense from "./component/Footer";
import { FaEnvelope, FaInstagram } from "react-icons/fa";

const developers = [
  {
    name: "ANGGI LOLO BORUIDA BR SIREGAR",
    email: "anggilolosiregar@gmail.com",
    instagram: "anggisiregarrrrrr",
    photo: "./img/Developer.jpeg",
  },
];

const Contact = () => {
  return (
    <div>
      <NavbarLocksense />
      <div style={styles.container}>
        <h1 style={styles.heading}>Kontak Pengembangan</h1>
        <p style={styles.description}>
          Hubungi kami untuk pertanyaan atau kolaborasi:
        </p>

        <div style={styles.cardContainer}>
          {developers.map((dev, index) => (
            <div key={index} style={styles.card}>
              <img src={dev.photo} alt={dev.name} style={styles.photo} />
              <h3 style={styles.name}>{dev.name}</h3>
              <div style={styles.iconContainer}>
                <a
                  href={`mailto:${dev.email}`}
                  style={styles.iconLink}
                  title="Email"
                >
                  <FaEnvelope size={15} />
                  <span style={styles.iconText}>{dev.email}</span>
                </a>
                <a
                  href={`https://instagram.com/${dev.instagram}`}
                  style={styles.iconLink}
                  title="Instagram"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaInstagram size={15} />
                  <span style={styles.iconText}>@{dev.instagram}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
      <FooterLocksense />
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "800px",
    margin: "40px auto",
    padding: "30px 20px",
    borderRadius: "10px",
    background: "#ffffff",
    boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
    textAlign: "center",
  },
  heading: {
    fontSize: "28px",
    color: "#1a73e8",
    marginBottom: "10px",
  },
  description: {
    fontSize: "16px",
    color: "#444",
    marginBottom: "30px",
  },
  cardContainer: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "20px",
  },
  card: {
    width: "260px",
    padding: "20px",
    backgroundColor: "#f1f6fb",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
    textAlign: "center",
  },
  photo: {
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    objectFit: "cover",
    marginBottom: "12px",
    border: "3px solid #1a73e8",
  },
  name: {
    fontSize: "18px",
    fontWeight: "600",
    marginBottom: "12px",
    color: "#1a73e8",
  },
  iconContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    alignItems: "center",
  },
  iconLink: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#444",
    textDecoration: "none",
    transition: "color 0.2s",
  },
  iconText: {
    fontSize: "14px",
  },
};

export default Contact;
