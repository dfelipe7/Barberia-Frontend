export default function Footer() {
    return (
        <footer className="bg-dark text-white text-center py-3 mt-auto shadow">
            <div className="container">
                <p className="mb-0 text-muted small">
                    &copy; {new Date().getFullYear()} Barbería. Todos los derechos reservados.
                </p>
            </div>
        </footer>
    );
}
