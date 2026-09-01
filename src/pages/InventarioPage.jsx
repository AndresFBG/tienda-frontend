import { useEffect, useState } from 'react';
import './InventarioPage.css';

const STORAGE_KEY = 'tienda-password';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function formatMoney(value) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value);
}

function InventarioPage() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [dialog, setDialog] = useState(null);
  const [dialogValue, setDialogValue] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const cargarProductos = async () => {
    try {
      const response = await fetch(`${API_URL}/api/productos`);
      const data = await response.json();
      setProductos(data);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const totalProductos = productos.length;
  const bajoStock = productos.filter((producto) => Number(producto.stock) <= 5).length;
  const productosFiltrados = productos.filter((producto) => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) return true;

    const nombre = String(producto.nombre || '').toLowerCase();
    const codigo = String(producto.codigo || '').toLowerCase();

    return nombre.includes(texto) || codigo.includes(texto);
  });

  const abrirDialogoEliminar = (producto) => {
    setDialog({
      type: 'password',
      title: 'Eliminar producto',
      label: 'Ingresa la contraseña',
      confirmText: 'Eliminar',
      producto,
    });
    setDialogValue('');
  };

  const abrirDialogoAbastecer = (producto) => {
    setDialog({
      type: 'quantity',
      title: 'Abastecer stock',
      label: 'Cantidad a agregar',
      confirmText: 'Guardar',
      producto,
    });
    setDialogValue('5');
  };

  const cerrarDialogo = () => {
    setDialog(null);
    setDialogValue('');
  };

  const confirmarDialogo = async () => {
    if (!dialog) return;

    if (dialog.type === 'password') {
      const passwordActual = localStorage.getItem(STORAGE_KEY) || '';

      if (dialogValue !== passwordActual) {
        setMensaje('Contraseña incorrecta. No se eliminó el producto.');
        cerrarDialogo();
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/productos/${dialog.producto.id}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'No se pudo eliminar el producto');
        }

        setMensaje(`Producto eliminado: ${dialog.producto.nombre}`);
        await cargarProductos();
      } catch (error) {
        setMensaje(error.message || 'Error al eliminar el producto');
      }

      cerrarDialogo();
      return;
    }

    const cantidad = Number(dialogValue);

    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      setMensaje('La cantidad debe ser mayor a 0.');
      cerrarDialogo();
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/productos/${dialog.producto.id}/abastecer`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cantidad }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo abastecer el producto');
      }

      setMensaje(`Se agregaron ${cantidad} unidades a ${dialog.producto.nombre}`);
      await cargarProductos();
    } catch (error) {
      setMensaje(error.message || 'Error al abastecer el producto');
    }

    cerrarDialogo();
  };

  return (
    <div className="page-content">
      {dialog && (
        <div className="modal-backdrop" onClick={cerrarDialogo}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{dialog.title}</h3>
              <button type="button" className="modal-close" onClick={cerrarDialogo} aria-label="Cerrar">×</button>
            </div>

            <div className="modal-body">
              <label className="modal-label">
                {dialog.label}
                <input
                  type={dialog.type === 'password' ? 'password' : 'number'}
                  min="1"
                  value={dialogValue}
                  onChange={(e) => setDialogValue(e.target.value)}
                  autoFocus
                />
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={cerrarDialogo}>Cancelar</button>
              <button type="button" className="primary-button" onClick={confirmarDialogo}>{dialog.confirmText}</button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <p className="eyebrow">Control</p>
          <h1>Inventario</h1>
        </div>
      </div>

      {mensaje && <div className="inventory-toast">{mensaje}</div>}

      <div className="inventory-toolbar">
        <input
          type="text"
          className="search-input"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o código"
        />
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Total productos</span>
          <strong>{totalProductos}</strong>
        </div>
        <div className="stat-card">
          <span>Bajo stock</span>
          <strong>{bajoStock}</strong>
        </div>
      </div>

      <div className="table-wrap">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Stock</th>
              <th>Costo</th>
              <th>Venta</th>
              <th>Ganancia</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="empty-state">Cargando productos...</td>
              </tr>
            ) : productosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-state">No se encontraron productos</td>
              </tr>
            ) : (
              productosFiltrados.map((producto) => {
                const precioCompra = Number(producto.precio_compra ?? producto.precio ?? 0);
                const precioVenta = Number(producto.precio_venta ?? producto.precio ?? 0);
                const ganancia = precioVenta - precioCompra;
                const stockBajo = Number(producto.stock) <= 2;

                return (
                  <tr key={producto.id} className={stockBajo ? 'low-stock-row' : ''}>
                    <td>{producto.codigo || 'Sin código'}</td>
                    <td>{producto.nombre}</td>
                    <td>{producto.categoria || 'Sin categoría'}</td>
                    <td>{producto.stock}</td>
                    <td>{formatMoney(precioCompra)}</td>
                    <td>{formatMoney(precioVenta)}</td>
                    <td>{formatMoney(ganancia)}</td>
                    <td>
                      <div className="inventory-actions">
                        <button className="secondary-button" onClick={() => abrirDialogoAbastecer(producto)}>
                          Abastecer
                        </button>
                        <button className="delete-button" onClick={() => abrirDialogoEliminar(producto)}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default InventarioPage;
