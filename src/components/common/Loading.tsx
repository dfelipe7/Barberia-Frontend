export default function Loading() {
    return (
        <div className="d-flex justify-content-center align-items-center py-5">
            <div
                className="spinner-border"
                role="status"
            >
                <span className="visually-hidden">
                    Cargando...
                </span>
            </div>

            <span className="ms-3">
                Cargando...
            </span>
        </div>
    );
}