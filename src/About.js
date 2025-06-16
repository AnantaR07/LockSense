import React from "react";
import NavbarLocksense from "./component/Navbar";
import FooterLocksense from "./component/Footer";

const About = () => {
  return (
    <div>
      <NavbarLocksense />
      <div style={styles.container}>
        <h1 style={styles.heading}>Tentang Sistem Penguncian Kamar Otomatis</h1>
        <div style={styles.underline}></div>

        <p style={styles.paragraph}>
          Proyek ini mengembangkan sistem penguncian kamar otomatis berbasis{" "}
          <strong>Internet of Things (IoT)</strong> yang dilengkapi dengan
          keamanan <strong>RSA (Rivest–Shamir–Adleman) key</strong>. Sistem ini
          dirancang untuk memberikan{" "}
          <span style={styles.highlight}>keamanan tinggi</span> dengan teknologi
          kriptografi kunci publik RSA yang memungkinkan proses autentikasi
          antara pengguna dan perangkat pengunci tanpa risiko penyadapan data.
        </p>

        <p style={styles.paragraph}>
          Dengan sistem ini, pintu kamar hanya dapat dibuka menggunakan
          perangkat pengguna yang memiliki{" "}
          <span style={styles.highlight}>kunci privat RSA</span> yang sesuai.
          Data dikirim secara terenkripsi dari perangkat mobile atau web ke
          mikrokontroler (misalnya ESP32), yang kemudian memverifikasi dan
          mengaktifkan sistem penguncian secara otomatis.
        </p>

        <p style={styles.paragraph}>
          <strong>Fitur utama dari sistem ini meliputi:</strong>
          <ul style={styles.list}>
            <li style={styles.listItem}>Autentikasi dua arah dengan RSA Key</li>
            <li style={styles.listItem}>Koneksi real-time melalui Wi-Fi</li>
            <li style={styles.listItem}>
              Pemantauan status pintu melalui dashboard
            </li>
            <li style={styles.listItem}>Log aktivitas pengguna dan akses</li>
          </ul>
        </p>

        <p style={styles.paragraph}>
          Sistem ini cocok untuk digunakan di kamar hotel, kos, atau rumah
          pintar yang membutuhkan{" "}
          <span style={styles.highlight}>keamanan akses yang lebih tinggi</span>{" "}
          dan efisien. Pengembangan proyek ini juga mempertimbangkan
          skalabilitas dan efisiensi energi dari perangkat yang digunakan.
        </p>
      </div>
      <FooterLocksense />
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "900px",
    margin: "40px auto",
    padding: "40px 30px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    lineHeight: "1.75",
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.1)",
    color: "#333",
  },
  heading: {
    fontSize: "36px",
    fontWeight: "700",
    color: "#1a73e8",
    marginBottom: "8px",
    textAlign: "center",
  },
  underline: {
    width: "60px",
    height: "4px",
    backgroundColor: "#1a73e8",
    margin: "0 auto 30px auto",
    borderRadius: "2px",
  },
  paragraph: {
    fontSize: "18px",
    color: "#444",
    marginBottom: "28px",
  },
  highlight: {
    color: "#1a73e8",
    fontWeight: "600",
  },
  list: {
    marginTop: "12px",
    paddingLeft: "20px",
    listStyleType: "square",
    color: "#555",
  },
  listItem: {
    marginBottom: "10px",
    padding: "8px 12px",
    borderRadius: "6px",
    transition: "background-color 0.3s ease",
    cursor: "default",
  },
};

// Add hover effect to list items using React inline styles workaround
// (optional: can be enhanced with CSS or styled-components)

export default About;
