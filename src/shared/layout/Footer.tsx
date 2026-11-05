import { BRAND } from '../../config/brand';
import BrandLogo from '../ui/BrandLogo';

export default function Footer() {
  return (
    <footer className="app-footer py-4 mt-auto border-top" role="contentinfo">
      <div className="container-fluid">
        <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <BrandLogo variant="auto" height={26} alt={BRAND.name} />
            <span className="app-footer__text small">
              &copy; {new Date().getFullYear()} {BRAND.name}
            </span>
          </div>
          <div className="d-flex align-items-center gap-3 small">
            <span className="app-footer__muted">Todos los derechos reservados</span>
            <span className="app-footer__link">v1.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
