import { Outlet } from 'react-router-dom';

import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { ToastProvider } from '../ui/ToastContext';
import { ToastContainer } from '../ui/ToastContainer';

export default function MainLayout() {
    return (
        <ToastProvider>
            <div className="d-flex flex-column min-vh-100">
                <Header />

                {/* Contenedor global de toasts, posicionado sobre el header */}
                <ToastContainer />

                <div className="d-flex flex-grow-1">
                    <Sidebar />

                    <main className="flex-grow-1 p-4 bg-light">
                        <Outlet />
                    </main>
                </div>

                <Footer />
            </div>
        </ToastProvider>
    );
}