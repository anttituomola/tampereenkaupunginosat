import './Footer.css';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <p>
        © {currentYear} <a href="https://www.anttituomola.fi/" target="_blank" rel="noopener noreferrer">Antti Tuomola</a>
      </p>
    </footer>
  );
}



