
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Base de datos SQLite (archivo simple)
const db = new sqlite3.Database('./database/incidentes.db');

// Crear tabla de incidentes
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS incidentes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo_incidente TEXT,
    dispositivo TEXT,
    modelo TEXT,
    lote TEXT,
    fecha_incidente DATE,
    descripcion TEXT,
    severidad TEXT,
    reportero TEXT,
    estado TEXT DEFAULT 'reportado',
    fecha_reporte DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// ENDPOINTS DE LA API

// 1. Guardar nuevo incidente
app.post('/api/incidentes', (req, res) => {
  const { tipo_incidente, dispositivo, modelo, lote, fecha_incidente, descripcion, severidad, reportero } = req.body;
  
  const sql = `INSERT INTO incidentes 
    (tipo_incidente, dispositivo, modelo, lote, fecha_incidente, descripcion, severidad, reportero) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [tipo_incidente, dispositivo, modelo, lote, fecha_incidente, descripcion, severidad, reportero], 
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ 
        id: this.lastID,
        message: 'Incidente reportado exitosamente',
        fecha: new Date().toISOString()
      });
    });
});

// 2. Obtener todos los incidentes
app.get('/api/incidentes', (req, res) => {
  db.all("SELECT * FROM incidentes ORDER BY fecha_reporte DESC", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// 3. Obtener estadísticas para el dashboard
app.get('/api/estadisticas', (req, res) => {
  const queries = {
    total: "SELECT COUNT(*) as total FROM incidentes",
    porSeveridad: "SELECT severidad, COUNT(*) as count FROM incidentes GROUP BY severidad",
    porDispositivo: "SELECT dispositivo, COUNT(*) as count FROM incidentes GROUP BY dispositivo",
    ultimaSemana: "SELECT COUNT(*) as count FROM incidentes WHERE fecha_reporte >= datetime('now', '-7 days')"
  };

  db.all(queries.total, [], (err, totalRows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    db.all(queries.porSeveridad, [], (err, severidadRows) => {
      if (err) return res.status(500).json({ error: err.message });
      
      db.all(queries.porDispositivo, [], (err, dispositivoRows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        db.all(queries.ultimaSemana, [], (err, semanaRows) => {
          if (err) return res.status(500).json({ error: err.message });
          
          res.json({
            total: totalRows[0].total,
            porSeveridad: severidadRows,
            porDispositivo: dispositivoRows,
            ultimaSemana: semanaRows[0].count
          });
        });
      });
    });
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend ejecutándose en http://localhost:${PORT}`);
  console.log(`📊 Endpoints disponibles:`);
  console.log(`   POST http://localhost:${PORT}/api/incidentes`);
  console.log(`   GET  http://localhost:${PORT}/api/incidentes`);
  console.log(`   GET  http://localhost:${PORT}/api/estadisticas`);
});
