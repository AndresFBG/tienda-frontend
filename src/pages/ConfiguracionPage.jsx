import { useEffect, useState } from 'react';
import StatusMessage from '../components/StatusMessage';

const STORAGE_KEY = 'tienda-password';

function ConfiguracionPage() {
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || '';
    setPassword(saved);
  }, []);

  const guardarPassword = (e) => {
    e.preventDefault();

    const limpia = password.trim();

    if (!limpia) {
      setMensaje('La contraseña no puede quedar vacía.');
      return;
    }

    localStorage.setItem(STORAGE_KEY, limpia);
    setMensaje('Contraseña guardada correctamente.');
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <p className="eyebrow">Sistema</p>
          <h1>Configuración</h1>
        </div>
      </div>

      <div className="panel" style={{ maxWidth: '520px' }}>
        <h2>Contraseña de seguridad</h2>
        <form onSubmit={guardarPassword}>
          <label>
            Contraseña para eliminar productos
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Escribe una contraseña"
            />
          </label>

          <button type="submit" className="primary-button full" style={{ marginTop: '16px' }}>
            Guardar contraseña
          </button>
        </form>

        {mensaje && <StatusMessage type="success">{mensaje}</StatusMessage>}
      </div>
    </div>
  );
}

export default ConfiguracionPage;
