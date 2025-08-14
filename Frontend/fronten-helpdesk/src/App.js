import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './Componentes/ProtectedRoute'; 
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import CrearCasoUse from "./pages/CrearCasoUse";
import HomeAdmiPage from "./pages/HomeAdmiPage";
import HomeTecnicoPage from "./pages/HomeTecnicoPage";
import Tickets from "./pages/Tickets";
import CrearCasoAdmin from "./pages/CrearCasoAdmin";
import Estadisticas from "./pages/Estadisticas";
import Usuarios from "./pages/Usuarios";
import Entidades from "./pages/Entidades";
import Grupos from "./pages/Grupos";
import Categorias from "./pages/Categorias";
import SolucionTickets from "./pages/SolucionTickets";
import EncuestaSatisfaccion from "./pages/EncuestaSatisfaccion";
import TicketHistorial from "./pages/TicketHistorial";
import UserStatusChecker from "./pages/UserStatusChecker";

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <UserStatusChecker />
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/CrearCasoUse" element={<CrearCasoUse />} />
            <Route path="/HomeAdmiPage" element={<HomeAdmiPage />} />
            <Route path="/HomeTecnicoPage" element={<HomeTecnicoPage />} />
            <Route path="/Tickets" element={<Tickets />} />
            <Route path="/CrearCasoAdmin" element={<CrearCasoAdmin />} />
            <Route path="/Estadisticas" element={<Estadisticas />} />
            <Route path="/Usuarios" element={<Usuarios />} />
            <Route path="/Grupos" element={<Grupos />} />
            <Route path="/Entidades" element={<Entidades />} />
            <Route path="/Categorias" element={<Categorias />} />
            <Route path="/tickets/solucion/:id" element={<SolucionTickets />} />
            <Route path="/EncuestaSatisfaccion/:surveyId" element={<EncuestaSatisfaccion />} />
            <Route path="/tickets/:id/historial" element={<TicketHistorial />} />
            
            <Route path="/HomeAdmiPage" element={
              <ProtectedRoute allowedRoles={['administrador']}>
                <HomeAdmiPage />
              </ProtectedRoute>
            } />

            <Route path="/HomeTecnicoPage" element={
              <ProtectedRoute allowedRoles={['tecnico']}>
                <HomeTecnicoPage />
              </ProtectedRoute>
            } />

            <Route path="/home" element={
              <ProtectedRoute allowedRoles={['usuario']}>
                <HomePage />
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;