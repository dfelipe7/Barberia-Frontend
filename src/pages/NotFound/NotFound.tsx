import { Link } from 'react-router-dom';

export default function NotFound() {
    return (
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
            <h1 className="display-1 fw-bold text-secondary">404</h1>
            <h2 className="mb-3">Página no encontrada</h2>
            <p className="text-muted mb-4">
                La página que buscas no existe o fue movida.
            </p>
            <Link to="/" className="btn btn-primary">
                Volver al inicio
            </Link>
        </div>
    );
}
