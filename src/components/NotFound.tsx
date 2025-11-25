import { Link } from 'react-router-dom';
import './NotFound.css';

export function NotFound() {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <h1>404</h1>
        <h2>Sivua ei löydy</h2>
        <p>Hakemaasi sivua ei valitettavasti löydy.</p>
        <Link to="/" className="not-found-link">
          Palaa etusivulle
        </Link>
      </div>
    </div>
  );
}

