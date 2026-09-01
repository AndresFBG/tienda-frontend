import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import "./App.css";
import InventarioPage from "./pages/InventarioPage";
import NuevoProductoPage from "./pages/NuevoProductoPage";
import VentasPage from "./pages/VentasPage";
import ReportesPage from "./pages/ReportesPage";
import ConfiguracionPage from "./pages/ConfiguracionPage";

const Sidebar = () => {
  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>Tienda Adriana</h2>
        <ul>
          <li><Link to="/ventas">💰 Ventas</Link></li>
          <li><Link to="/nuevo-producto">📦 Nuevo producto</Link></li>
          <li><Link to="/movimientos">📄 Movimientos</Link></li>
          <li><Link to="/inventario">📋 Inventario</Link></li>
          <li><Link to="/reportes">📈 Reportes</Link></li>
          <li><Link to="/buscar">🔍 Buscar</Link></li>
          <li><Link to="/configuracion">⚙️ Configuración</Link></li>
        </ul>
      </aside>

      <main className="content">
        <Routes>
          <Route path="/" element={<VentasPage />} />
          <Route path="/ventas" element={<VentasPage />} />
          <Route path="/inventario" element={<InventarioPage />} />
          <Route path="/nuevo-producto" element={<NuevoProductoPage />} />
          <Route path="/movimientos" element={<h2>Movimientos</h2>} />
          <Route path="/reportes" element={<ReportesPage />} />
          <Route path="/buscar" element={<h2>Buscar</h2>} />
          <Route path="/configuracion" element={<ConfiguracionPage />} />
        </Routes>
      </main>
    </div>
  );
};

export default Sidebar;