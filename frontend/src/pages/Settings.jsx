import React from 'react';

function Settings() {
  return (
    <div className="card" style={{ padding: '30px', minHeight: '60vh' }}>
      <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '25px' }}>Ajustes del Sistema</h3>
      
      <div style={{ display: 'grid', gap: '20px', maxWidth: '600px' }}>
        <div className="form-group">
          <label>Nombre de Usuario</label>
          <input type="text" placeholder="Javier Herrera" />
        </div>
        <div className="form-group">
          <label>Correo Electrónico</label>
          <input type="email" placeholder="javier@gmail.com" />
        </div>
        <div className="form-group">
          <label>Tema de Interfaz</label>
          <select>
            <option>Modo Cristal (Beige/Verde)</option>
            <option>Modo Oscuro</option>
            <option>Modo Claro Clásico</option>
          </select>
        </div>
        
        <button className="submit-btn" style={{ maxWidth: '200px' }}>Guardar Cambios</button>
      </div>
    </div>
  );
}

export default Settings;
