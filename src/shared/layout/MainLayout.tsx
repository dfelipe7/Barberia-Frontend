import { Outlet } from 'react-router-dom';

import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { ToastProvider } from '../ui/ToastContext';
import { ToastContainer } from '../ui/ToastContainer';
import { SidebarProvider } from './SidebarContext';

export default function MainLayout() {
    return (
        <ToastProvider>
            <SidebarProvider>
                <div className="d-flex flex-column min-vh-100">
                    <Header />

                    {/* Contenedor global de toasts, posicionado sobre el header */}
                    <ToastContainer />

                    <div className="d-flex flex-grow-1 position-relative">
                        <Sidebar />

                        <main className="flex-grow-1 p-3 p-md-4 bg-light overflow-x-hidden">
                            <Outlet />
                        </main>
                    </div>

                    <Footer />
                </div>
            </SidebarProvider>
        </ToastProvider>
    );
}