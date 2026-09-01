import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'tienda-password';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function formatMoney(value) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return 'Sin fecha';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ReportesPage() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState(null);
  const [password, setPassword] = useState('');

  const cargarReportes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/reportes`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudieron cargar los reportes');
      }

      setVentas(data.ventas || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarReportes();
  }, []);

  const eliminarFactura = async () => {
    if (!dialog || !dialog.venta) return;

    const passwordActual = localStorage.getItem(STORAGE_KEY) || '';

    if (password !== passwordActual) {
      setError('Contraseña incorrecta. No se eliminó la factura.');
      setDialog(null);
      setPassword('');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/ventas/${dialog.venta.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo eliminar la factura');
      }

      setError('');
      setDialog(null);
      setPassword('');
      await cargarReportes();
    } catch (err) {
      setError(err.message || 'Error al eliminar la factura');
      setDialog(null);
      setPassword('');
    }
  };

  const resumen = useMemo(() => {
    const totalVentas = ventas.length;
    const totalRecaudado = ventas.reduce((sum, venta) => sum + Number(venta.total || 0), 0);
    const totalProductosVendidos = ventas.reduce((sum, venta) => {
      return sum + (Array.isArray(venta.detalles) ? venta.detalles.reduce((subtotal, item) => subtotal + Number(item.cantidad || 0), 0) : 0);
    }, 0);

    return {
      totalVentas,
      totalRecaudado,
      totalProductosVendidos,
    };
  }, [ventas]);

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <p className="eyebrow">Estadísticas</p>
          <h1>Reportes</h1>
        </div>
      </div>

      {dialog && (
        <div className="modal-backdrop" onClick={() => setDialog(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Eliminar factura</h3>
              <button type="button" className="modal-close" onClick={() => setDialog(null)} aria-label="Cerrar">×</button>
            </div>

            <div className="modal-body">
              <p style={{ marginBottom: '12px' }}>
                La factura #{dialog.venta.id} se eliminará permanentemente.
              </p>
              <label className="modal-label">
                Contraseña
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setDialog(null)}>Cancelar</button>
              <button type="button" className="primary-button" onClick={eliminarFactura}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p>Cargando reportes...</p>
      ) : error ? (
        <p style={{ color: '#b91c1c' }}>{error}</p>
      ) : (
        <>
          <div className="ventas-grid">
            <section className="panel">
              <h2>Resumen</h2>
              <div className="summary-box">
                <span>Total de ventas</span>
                <strong>{resumen.totalVentas}</strong>
              </div>
              <div className="summary-box total-box">
                <span>Recaudado</span>
                <strong>{formatMoney(resumen.totalRecaudado)}</strong>
              </div>
              <div className="summary-box">
                <span>Productos vendidos</span>
                <strong>{resumen.totalProductosVendidos}</strong>
              </div>
            </section>
          </div>

          <section className="panel cart-panel">
            <div className="cart-header">
              <h2>Ventas realizadas</h2>
              <span>{ventas.length} registro(s)</span>
            </div>

            <div className="cart-table-wrap">
              <table className="cart-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Fecha</th>
                    <th>Productos</th>
                    <th>Total</th>
                    <th>Efectivo</th>
                    <th>Cambio</th>
                  </tr>
                </thead>
                <tbody>
                  {ventas.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-state">Aún no hay ventas registradas</td>
                    </tr>
                  ) : (
                    ventas.map((venta) => (
                      <tr key={venta.id}>
                        <td>#{venta.id}</td>
                        <td>{formatDate(venta.created_at)}</td>
                        <td>
                          {Array.isArray(venta.detalles) && venta.detalles.length > 0 ? (
                            <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
                              {venta.detalles.map((detalle) => (
                                <li key={`${venta.id}-${detalle.id || detalle.producto_id || detalle.nombre}`}>
                                  {detalle.nombre} x {detalle.cantidad}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            'Sin detalle'
                          )}
                        </td>
                        <td>{formatMoney(venta.total)}</td>
                        <td>{formatMoney(venta.efectivo)}</td>
                        <td>{formatMoney(venta.cambio)}</td>
                        <td>
                          <button
                            type="button"
                            className="delete-button"
                            onClick={() => setDialog({ venta })}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default ReportesPage;
