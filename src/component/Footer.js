export default function FooterLocksense() {
  return (
    <>
      <footer className="footer">
        <div className="footer-content">
          <div className="logo">
            <img src="/img/logo.png" alt="Logo" className="logo-img-footer" />
          </div>
          <p className="description">
            LockSense adalah sistem keamanan pintu kosan berbasis IoT yang
            menggunakan pengunci otomatis. Pintu hanya dapat dibuka menggunakan
            akun terverifikasi melalui username dan password.
          </p>
          <div className="copyright">
            &copy; {new Date().getFullYear()} LockSense. All rights reserved.
          </div>
        </div>
      </footer>

      <style jsx>{`
        .footer {
          background: linear-gradient(90deg, #2575fc 0%, #6a11cb 100%);
          color: white;
          padding: 2rem 1.5rem;
          text-align: center;
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.2);
        }

        .footer-content {
          max-width: 1000px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .logo-img-footer {
          height: 30px;
          width: 30px;
          border-radius: 50%;
          background-color: white;
          padding: 6px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          object-fit: cover;
          margin-bottom: 1rem;
        }

        .description {
          font-size: 0.8rem;
          line-height: 1.6;
          max-width: 700px;
          margin: 0 auto 1.2rem auto;
        }

        .copyright {
          font-size: 0.6rem;
          color: #e0e0e0;
        }

        @media (max-width: 600px) {
          .description {
            font-size: 0.95rem;
            padding: 0 1rem;
          }

          .logo-img {
            height: 50px;
            width: 50px;
          }
        }
      `}</style>
    </>
  );
}
