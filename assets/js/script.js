// Pega aquí TODO el JavaScript que ya tenemos
document.addEventListener('DOMContentLoaded', function() {
    // Configurar fecha actual en formularios
    const fechaInputs = document.querySelectorAll('input[type="date"]');
    fechaInputs.forEach(input => {
        input.value = new Date().toISOString().split('T')[0];
    });

    // Manejar envío de formularios CON BACKEND
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Obtener datos del formulario
            const formData = new FormData(this);
            const incidenteData = {
                tipo_incidente: formData.get('tipoIncidente') || 'No especificado',
                dispositivo: formData.get('dispositivo') || 'Bomba de infusión',
                modelo: formData.get('modelo') || 'No especificado',
                lote: formData.get('lote') || 'N/A',
                fecha_incidente: formData.get('fechaIncidente') || new Date().toISOString().split('T')[0],
                descripcion: formData.get('descripcion') || 'Sin descripción',
                severidad: formData.get('severidad') || 'media',
                reportero: formData.get('reportero') || 'Usuario anónimo'
            };
            
            // Guardar en backend
            const exito = await guardarIncidente(incidenteData);
            
            if (exito) {
                alert('✅ Incidente reportado exitosamente y guardado en base de datos');
                this.reset();
                
                // Actualizar dashboard si estamos en esa página
                if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
                    await cargarEstadisticasReales();
                }
            }
        });
    });

    // Funciones para botones
    window.mostrarFormulario = function() {
        alert('📋 Formulario de reporte de incidentes');
        // Redirigir al formulario si es necesario
        window.location.href = 'formulario.html';
    };

    window.mostrarDispositivos = function() {
        alert('📊 Lista de dispositivos médicos');
    };

    // Cargar estadísticas reales al iniciar el dashboard
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        cargarEstadisticasReales();
        actualizarListaIncidentes();
    }
});

// ============================================================================
// CONEXIÓN CON BACKEND - NUEVAS FUNCIONES
// ============================================================================

// ¿Estamos en internet o en la compu?
const ESTAMOS_EN_INTERNET = window.location.hostname.includes('github.io');

// Si estamos en internet, usa modo demo; si no, usa el programa real
const API_URL = ESTAMOS_EN_INTERNET 
    ? 'MODO_DEMO' 
    : 'http://localhost:3000/api';

// Función para guardar incidente en el backend
async function guardarIncidente(incidenteData) {
    try {
        console.log('Enviando incidente al backend:', incidenteData);
        
        const response = await fetch(`${API_URL}/incidentes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(incidenteData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Incidente guardado con ID:', result.id);
            return true;
        } else {
            console.error('❌ Error del servidor:', result.error);
            alert('❌ Error al reportar incidente: ' + result.error);
            return false;
        }
    } catch (error) {
        console.error('❌ Error de conexión:', error);
        
        // Fallback: guardar en localStorage si el backend no está disponible
        console.warn('⚠️ Backend no disponible, guardando en localStorage...');
        guardarEnLocalStorage(incidenteData);
        return true;
    }
}

// Función para cargar estadísticas desde el backend
async function cargarEstadisticasReales() {
    try {
        const response = await fetch(`${API_URL}/estadisticas`);
        
        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }
        
        const data = await response.json();
        console.log('📊 Datos cargados del backend:', data);
        
        // Actualizar el dashboard con datos reales
        actualizarDashboard(data);
        
    } catch (error) {
        console.error('❌ Error cargando estadísticas:', error);
        
        // Fallback: usar datos de localStorage
        console.warn('⚠️ Usando datos de localStorage como fallback');
        const datosLocales = obtenerEstadisticasLocales();
        actualizarDashboard(datosLocales);
    }
}

// Función para actualizar el dashboard con datos
function actualizarDashboard(data) {
    // Actualizar métricas principales
    const totalElement = document.getElementById('totalIncidentes');
    const semanaElement = document.getElementById('incidentesSemana');
    
    if (totalElement) totalElement.textContent = data.total || '0';
    if (semanaElement) semanaElement.textContent = data.ultimaSemana || '0';
    
    // Actualizar gráficos de severidad si existen
    actualizarGraficoSeveridad(data.porSeveridad);
    
    // Actualizar gráficos de dispositivos si existen
    actualizarGraficoDispositivos(data.porDispositivo);
}

// Función para actualizar gráfico de severidad
function actualizarGraficoSeveridad(datosSeveridad) {
    const contenedor = document.querySelector('.severidad-chart');
    if (!contenedor || !datosSeveridad) return;
    
    let html = '<h4>Distribución por Severidad</h4>';
    datosSeveridad.forEach(item => {
        const porcentaje = Math.round((item.count / datosSeveridad.reduce((sum, i) => sum + i.count, 0)) * 100);
        html += `
            <div class="severidad-item">
                <span class="severidad-label">${item.severidad || 'No especificado'}:</span>
                <span class="severidad-value">${item.count} (${porcentaje}%)</span>
            </div>
        `;
    });
    
    contenedor.innerHTML = html;
}

// Función para actualizar gráfico de dispositivos
function actualizarGraficoDispositivos(datosDispositivos) {
    const contenedor = document.querySelector('.dispositivos-chart');
    if (!contenedor || !datosDispositivos) return;
    
    let html = '<h4>Incidentes por Dispositivo</h4>';
    datosDispositivos.forEach(item => {
        html += `
            <div class="dispositivo-item">
                <span class="dispositivo-label">${item.dispositivo || 'No especificado'}:</span>
                <span class="dispositivo-value">${item.count}</span>
            </div>
        `;
    });
    
    contenedor.innerHTML = html;
}

// Función para actualizar lista de incidentes recientes
async function actualizarListaIncidentes() {
    try {
        const response = await fetch(`${API_URL}/incidentes`);
        
        if (response.ok) {
            const incidentes = await response.json();
            mostrarIncidentesRecientes(incidentes.slice(0, 5)); // Mostrar últimos 5
        }
    } catch (error) {
        console.error('Error cargando incidentes:', error);
        // Fallback a localStorage
        const incidentesLocales = obtenerIncidentesLocales();
        mostrarIncidentesRecientes(incidentesLocales.slice(0, 5));
    }
}

// Función para mostrar incidentes recientes en el dashboard
function mostrarIncidentesRecientes(incidentes) {
    const contenedor = document.querySelector('.recent-incidents');
    if (!contenedor) return;
    
    if (!incidentes || incidentes.length === 0) {
        contenedor.innerHTML = '<p>No hay incidentes reportados</p>';
        return;
    }
    
    let html = '<h4>Incidentes Recientes</h4>';
    incidentes.forEach(incidente => {
        const fecha = new Date(incidente.fecha_reporte).toLocaleDateString();
        html += `
            <div class="incidente-item">
                <strong>${incidente.dispositivo}</strong> - ${incidente.tipo_incidente}
                <br><small>Severidad: ${incidente.severidad} | ${fecha}</small>
            </div>
        `;
    });
    
    contenedor.innerHTML = html;
}

// ============================================================================
// FALLBACK PARA CUANDO EL BACKEND NO ESTÉ DISPONIBLE
// ============================================================================

function guardarEnLocalStorage(incidenteData) {
    try {
        const incidentes = JSON.parse(localStorage.getItem('incidentes_fallback') || '[]');
        incidenteData.id = Date.now(); // ID temporal
        incidenteData.fecha_reporte = new Date().toISOString();
        incidentes.push(incidenteData);
        localStorage.setItem('incidentes_fallback', JSON.stringify(incidentes));
        console.log('✅ Incidente guardado en localStorage con ID:', incidenteData.id);
    } catch (error) {
        console.error('Error guardando en localStorage:', error);
    }
}

function obtenerEstadisticasLocales() {
    try {
        const incidentes = JSON.parse(localStorage.getItem('incidentes_fallback') || '[]');
        
        // Calcular estadísticas
        const total = incidentes.length;
        const unaSemanaAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const ultimaSemana = incidentes.filter(inc => 
            new Date(inc.fecha_reporte) >= unaSemanaAtras
        ).length;
        
        // Agrupar por severidad
        const porSeveridad = Object.groupBy(incidentes, inc => inc.severidad || 'no especificado');
        const severidadData = Object.entries(porSeveridad).map(([key, values]) => ({
            severidad: key,
            count: values.length
        }));
        
        // Agrupar por dispositivo
        const porDispositivo = Object.groupBy(incidentes, inc => inc.dispositivo || 'no especificado');
        const dispositivoData = Object.entries(porDispositivo).map(([key, values]) => ({
            dispositivo: key,
            count: values.length
        }));
        
        return {
            total,
            ultimaSemana,
            porSeveridad: severidadData,
            porDispositivo: dispositivoData
        };
    } catch (error) {
        console.error('Error calculando estadísticas locales:', error);
        return { total: 0, ultimaSemana: 0, porSeveridad: [], porDispositivo: [] };
    }
}

function obtenerIncidentesLocales() {
    try {
        return JSON.parse(localStorage.getItem('incidentes_fallback') || '[]');
    } catch (error) {
        console.error('Error obteniendo incidentes locales:', error);
        return [];
    }
}

// ============================================================================
// FUNCIONES ADICIONALES PARA EL SISTEMA
// ============================================================================

// Función para exportar datos (para implementar luego)
window.exportarDatos = function() {
    alert('📤 Función de exportación de datos - Por implementar en Fase 3');
};

// Función para limpiar datos de prueba
window.limpiarDatos = function() {
    if (confirm('¿Estás seguro de que quieres limpiar todos los datos de prueba?')) {
        localStorage.removeItem('incidentes_fallback');
        alert('🧹 Datos de prueba eliminados');
        location.reload();
    }
};
