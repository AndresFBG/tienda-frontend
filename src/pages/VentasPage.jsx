import { useEffect, useMemo, useRef, useState } from 'react';
import './VentasPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function formatMoney(value) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value);
}

function VentasPage() {
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [codigo, setCodigo] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [efectivo, setEfectivo] = useState('');
  const [carrito, setCarrito] = useState([]);
  const [toast, setToast] = useState(null);

  const cantidadInputRef = useRef(null);

  const cargarProductos = async () => {
    try {
      const response = await fetch(`${API_URL}/api/productos`);
      const data = await response.json();
      setProductosDisponibles(data.map((producto) => ({
        codigo: String(producto.codigo || 'SIN-CODIGO'),
        nombre: producto.nombre,
        precio: Number(producto.precio_venta ?? producto.precio ?? 0),
        stock: Number(producto.stock ?? 0),
      })));
    } catch (error) {
      console.error('Error al cargar productos para ventas:', error);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  useEffect(() => {
    if (!toast) return undefined;

    const timer = setTimeout(() => {
      setToast(null);
    }, 2600);

    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const productoEncontrado = useMemo(() => {
    const texto = codigo.trim().toLowerCase();

    if (!texto) {
      return null;
    }

    return productosDisponibles.find((item) => {
      return (
        item.codigo.toLowerCase() === texto ||
        item.nombre.toLowerCase().includes(texto)
      );
    });
  }, [codigo, productosDisponibles]);

  const sugerencias = useMemo(() => {
    const texto = codigo.trim().toLowerCase();

    if (!texto) {
      return [];
    }

    return productosDisponibles.filter((item) => {
      return (
        item.codigo.toLowerCase().includes(texto) ||
        item.nombre.toLowerCase().includes(texto)
      );
    }).slice(0, 5);
  }, [codigo, productosDisponibles]);

  const total = useMemo(() => {
    return carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  }, [carrito]);

  const totalProductos = useMemo(() => {
    return carrito.reduce((sum, item) => sum + item.cantidad, 0);
  }, [carrito]);

  const efectivoRecibido = Number(efectivo || 0);
  const cambio = Math.max(efectivoRecibido - total, 0);

  const agregarProducto = () => {
    if (!productoEncontrado) {
      showToast('Selecciona un producto válido', 'error');
      return;
    }

    const cantidadNumerica = Number(cantidad);

    if (!Number.isFinite(cantidadNumerica) || cantidadNumerica <= 0) {
      showToast('La cantidad debe ser mayor a 0', 'error');
      return;
    }

    const yaEnCarrito = carrito.find((item) => item.codigo === productoEncontrado.codigo);
    const totalEnCarrito = Number(yaEnCarrito?.cantidad ?? 0) + cantidadNumerica;

    if (totalEnCarrito > Number(productoEncontrado.stock)) {
      showToast(`Solo quedan ${productoEncontrado.stock} unidades de ${productoEncontrado.nombre}`, 'error');
      return;
    }

    setCarrito((prev) => {
      const existente = prev.find((item) => item.codigo === productoEncontrado.codigo);

      if (existente) {
        return prev.map((item) =>
          item.codigo === productoEncontrado.codigo
            ? { ...item, cantidad: item.cantidad + cantidadNumerica }
            : item
        );
      }

      return [
        ...prev,
        {
          codigo: productoEncontrado.codigo,
          nombre: productoEncontrado.nombre,
          precio: productoEncontrado.precio,
          cantidad: cantidadNumerica,
        },
      ];
    });

    setCodigo('');
    setCantidad('');
    showToast(`Producto agregado: ${productoEncontrado.nombre}`, 'success');
  };

  const seleccionarSugerencia = (producto) => {
    setCodigo(producto.codigo);
    setCantidad('');
    requestAnimationFrame(() => {
      cantidadInputRef.current?.focus();
      cantidadInputRef.current?.select();
    });
  };

  const manejarEnterEnCodigo = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (productoEncontrado) {
        requestAnimationFrame(() => {
          cantidadInputRef.current?.focus();
          cantidadInputRef.current?.select();
        });
      }
    }
  };

  const manejarEnterEnCantidad = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      agregarProducto();
    }
  };

  const eliminarProducto = (codigoItem) => {
    setCarrito((prev) => prev.filter((item) => item.codigo !== codigoItem));
  };

  const finalizarVenta = async () => {
    if (carrito.length === 0) {
      showToast('No hay productos en la venta', 'error');
      return;
    }

    if (efectivoRecibido < total) {
      showToast(`Falta dinero para completar la venta. Debe pagar al menos ${formatMoney(total)}`, 'error');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/ventas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productos: carrito.map((item) => ({
            codigo: item.codigo,
            nombre: item.nombre,
            cantidad: item.cantidad,
            precio: item.precio,
          })),
          efectivo: efectivoRecibido,
        }),
      });

      const text = await response.text();
      let data = {};

      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(`El backend no respondió en JSON. Verifica que el servidor esté corriendo en ${API_URL}`);
        }
      }

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar la venta');
      }

      showToast(`Venta realizada. Total: ${formatMoney(total)}. Cambio: ${formatMoney(cambio)}`, 'success');
      setCarrito([]);
      setEfectivo('');
      setCodigo('');
      setCantidad('');
      await cargarProductos();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  return (
    <div className="page-content ventas-page">
      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
          {toast.message}
        </div>
      )}

      <div className="page-header">
        <div>
          <p className="eyebrow">Caja</p>
          <h1>Ventas</h1>
        </div>
      </div>

      <div className="ventas-grid">
        <section className="panel sales-panel">
          <h2>Agregar producto</h2>

          <div className="input-row">
            <label>
              Código o nombre del producto
              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                onKeyDown={manejarEnterEnCodigo}
                placeholder="Ej: P001 o Camiseta básica"
              />
              {sugerencias.length > 0 && (
                <div className="suggestions-box">
                  {sugerencias.map((item) => (
                    <button
                      key={item.codigo}
                      type="button"
                      className="suggestion-item"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        seleccionarSugerencia(item);
                      }}
                      onClick={() => seleccionarSugerencia(item)}
                    >
                      <span>{item.nombre}</span>
                      <small>{item.codigo}</small>
                    </button>
                  ))}
                </div>
              )}
            </label>

            <label>
              Cantidad
              <input
                ref={cantidadInputRef}
                type="number"
                min="1"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                onKeyDown={manejarEnterEnCantidad}
                placeholder="0"
              />
            </label>
          </div>

          <button className="primary-button full" onClick={agregarProducto}>
            Agregar al carrito
          </button>

          {productoEncontrado && (
            <div className="product-preview">
              <div>
                <span className="label">Producto</span>
                <strong>{productoEncontrado.nombre}</strong>
              </div>
              <div>
                <span className="label">Precio</span>
                <strong>{formatMoney(productoEncontrado.precio)}</strong>
              </div>
              <div>
                <span className="label">Stock</span>
                <strong>{productoEncontrado.stock}</strong>
              </div>
            </div>
          )}
        </section>

        <aside className="panel summary-panel">
          <h2>Resumen</h2>

          <div className="summary-box">
            <span>Total productos</span>
            <strong>{totalProductos}</strong>
          </div>

          <div className="summary-box total-box">
            <span>Total</span>
            <strong>{formatMoney(total)}</strong>
          </div>

          <label className="money-input">
            Efectivo recibido
            <input
              type="number"
              min="0"
              value={efectivo}
              onChange={(e) => setEfectivo(e.target.value)}
              placeholder="0"
            />
          </label>

          <div className="summary-box">
            <span>Cambio a devolver</span>
            <strong>{formatMoney(cambio)}</strong>
          </div>

          <button className="primary-button full success" onClick={finalizarVenta}>
            Finalizar venta
          </button>
        </aside>
      </div>

      <section className="panel cart-panel">
        <div className="cart-header">
          <h2>Productos agregados</h2>
          <span>{carrito.length} item(s)</span>
        </div>

        <div className="cart-table-wrap">
          <table className="cart-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Precio</th>
                <th>Cant.</th>
                <th>Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {carrito.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state">No hay productos agregados</td>
                </tr>
              ) : (
                carrito.map((item) => (
                  <tr key={item.codigo}>
                    <td>{item.codigo}</td>
                    <td>{item.nombre}</td>
                    <td>{formatMoney(item.precio)}</td>
                    <td>{item.cantidad}</td>
                    <td>{formatMoney(item.precio * item.cantidad)}</td>
                    <td>
                      <button className="delete-btn" onClick={() => eliminarProducto(item.codigo)}>
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
    </div>
  );
}

export default VentasPage;
