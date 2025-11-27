import { NavLink } from 'react-router-dom';
import './Footer.css';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <nav className="footer-nav">
        <NavLink
          to="/"
          className={({ isActive }) => isActive ? 'footer-link active' : 'footer-link'}
        >
          Visa
        </NavLink>
        <NavLink
          to="/view"
          className={({ isActive }) => isActive ? 'footer-link active' : 'footer-link'}
        >
          Selaa
        </NavLink>
        <NavLink
          to="/locate"
          className={({ isActive }) => isActive ? 'footer-link active' : 'footer-link'}
        >
          Etsi
        </NavLink>
        <NavLink
          to="/about"
          className={({ isActive }) => isActive ? 'footer-link active' : 'footer-link'}
        >
          Tietoja
        </NavLink>
      </nav>
      <p>
        © {currentYear} <a href="https://www.anttituomola.fi/" target="_blank" rel="noopener noreferrer">Antti Tuomola</a>
      </p>
    </footer>
  );
}





