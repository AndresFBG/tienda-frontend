import { useState } from 'react';
import './NuevoProductoPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function NuevoProductoPage() {
  const [form, setForm] = useState({
    nombre: '',
    codigo: '',
    categoria: 'Ropa',
    stock: '',
    precioVenta: '',
    precioCompra: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const producto = {
      nombre: form.nombre.trim(),
      codigo: form.codigo.trim(),
      precio_venta: Number(form.precioVenta),
      precio_compra: Number(form.precioCompra),
      stock: Number(form.stock),
      categoria: form.categoria,
    };

    if (!producto.nombre || !producto.precio_venta || !producto.precio_compra || !producto.stock) {
      alert('Completa nombre, precio de venta, precio de compra y stock');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/productos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(producto),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar producto');
      }

      alert('Producto guardado correctamente');
      setForm({
        nombre: '',
        codigo: '',
        categoria: 'Ropa',
        stock: '',
        precioVenta: '',
        precioCompra: '',
      });
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <p className="eyebrow">Registro</p>
          <h1>Nuevo producto</h1>
        </div>
      </div>

      <form className="product-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="nombre">Nombre del producto</label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Ej: Camiseta de algodón"
            />
          </div>

          <div className="field">
            <label htmlFor="codigo">Código</label>
            <input
              id="codigo"
              name="codigo"
              type="text"
              value={form.codigo}
              onChange={handleChange}
              placeholder="Ej: PRD-1024"
            />
          </div>

          <div className="field">
            <label htmlFor="categoria">Categoría</label>
            <select id="categoria" name="categoria" value={form.categoria} onChange={handleChange}>
              <option>Abarrotes</option>
              <option>Bebidas</option>
              <option>Licores</option>
              <option>Helados</option>
              <option>Licor</option>
              <option>Papeleria</option>
              <option>Detergentes</option>
              <option>Mecato</option>
              <option>Medicamentos</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="stock">Stock inicial</label>
            <input
              id="stock"
              name="stock"
              type="number"
              value={form.stock}
              onChange={handleChange}
              placeholder="0"
            />
          </div>

          <div className="field">
            <label htmlFor="precioVenta">Precio de venta</label>
            <input
              id="precioVenta"
              name="precioVenta"
              type="number"
              value={form.precioVenta}
              onChange={handleChange}
              placeholder="$0"
            />
          </div>

          <div className="field">
            <label htmlFor="precioCompra">Precio de compra</label>
            <input
              id="precioCompra"
              name="precioCompra"
              type="number"
              value={form.precioCompra}
              onChange={handleChange}
              placeholder="$0"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="secondary-button">Cancelar</button>
          <button type="submit" className="primary-button">Guardar producto</button>
        </div>
      </form>
    </div>
  );
}

export default NuevoProductoPage;
