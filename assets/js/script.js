// Detectar si estamos en GitHub Pages o local
const EN_GITHUB = window.location.hostname.includes('github.io');

document.addEventListener('DOMContentLoaded', function() {
    // Configurar fecha actual en formularios
    const fechaInputs = document.querySelectorAll('input[type="date"]');
    const hoy = new Date().toISOString().split('T')[0];
    fechaInputs.forEach(input => {
        if (!input.value) {
            input.value = hoy;
        }
    });

    // Manejar envío de formularios COMPLETOS
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Obtener TODOS los datos del formulario
            const formData = new FormData(this);
            const incidenteData = {
                // DATOS DEL REPORTANTE
                organizacion: formData.get('organizacion') || '',
                nombre_reportero: formData.get('nombre_reportero') || '',
                puesto: formData.get('puesto') || '',
                telefono: formData.get('telefono') || '',
                email: formData.get('email') || '',
                identificador_reporte: formData.get('identificador_reporte') || '',
                codigo_postal: formData.get('codigo_postal') || '',
                pais: formData.get('pais') || '',
                fecha_reporte: formData.get('fecha_reporte') || hoy,
                
                // DATOS DEL DISPOSITIVO
                nombre_producto: formData.get('nombre_producto') || '',
                codigo_catalogo: formData.get('codigo_catalogo') || '',
                numero_serie: formData.get('numero_serie') || '',
                numero_modelo: formData.get('numero_modelo') || '',
                numero_lote: formData.get('numero_lote') || '',
                fecha_vencimiento: formData.get('fecha_vencimiento') || '',
                version_software: formData.get('version_software') || '',
                udi: formData.get('udi') || '',
                nombre_fabricante: formData.get('nombre_fabricante') || '',
                direccion_fabricante: formData.get('direccion_fabricante') || '',
                dispositivo_sterilizado: formData.get('dispositivo_sterilizado') || '',
                
                // DATOS DEL EVENTO
                descripcion_procedimiento: formData.get('descripcion_procedimiento') || '',
                descripcion_evento: formData.get('descripcion_evento') || '',
                fecha_evento: formData.get('fecha_evento') || hoy,
                dispositivos_involucrados: parseInt(formData.get('dispositivos_involucrados')) || 1,
                pacientes_involucrados: parseInt(formData.get('pacientes_involucrados')) || 0,
                operador_evento: formData.get('operador_evento') || '',
                comentarios_solucion: formData.get('comentarios_solucion') || ''
            };
            
            console.log('📨 Enviando datos completos:', incidenteData);
            
            // SI ESTAMOS EN GITHUB (internet)
            if (EN_GITHUB) {
                alert('✅ Reporte guardado EXITOSAMENTE\n(Modo Demo - GitHub Pages)');
                guardarEnLocal(incidenteData);
            } 
            // SI ESTAMOS EN LOCAL (con backend)
            else {
                try {
                    const response = await fetch('http://localhost:3000/api/incidentes', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(incidenteData)
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        alert(`🎉 ¡EXCELENTE! 
✅ Reporte guardado en BASE DE DATOS
ID: ${result.id}
Total de reportes: ${result.total || '1'}`);
                    } else {
                        throw new Error('Error del servidor');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('✅ Reporte guardado (Modo Respaldo)\nEl backend no está disponible');
                    guardarEnLocal(incidenteData);
                }
            }
            
            this.reset();
            
            // Restablecer fechas después del reset
            setTimeout(() => {
                const fechaInputsAfterReset = this.querySelectorAll('input[type="date"]');
                fechaInputsAfterReset.forEach(input => {
                    if (!input.value) {
                        input.value = hoy;
                    }
                });
            }, 100);
        });
    });

    // Funciones para botones
    window.mostrarFormulario = function() {
        window.location.href = 'formulario.html';
    };

    window.mostrarDispositivos = function() {
        alert('📊 Lista de dispositivos médicos');
    };

    // Cargar estadísticas si estamos en el dashboard
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        actualizarEstadisticas();
    }
});

// Guardar en localStorage como respaldo
function guardarEnLocal(incidenteData) {
    try {
        const incidentes = JSON.parse(localStorage.getItem('incidentes_farmacovigilancia') || '[]');
        incidenteData.id = Date.now();
        incidenteData.fecha_registro = new Date().toISOString();
        incidenteData.modo = 'demo';
        incidentes.push(incidenteData);
        localStorage.setItem('incidentes_farmacovigilancia', JSON.stringify(incidentes));
        console.log('✅ Guardado en localStorage con ID:', incidenteData.id);
    } catch (error) {
        console.error('Error guardando en localStorage:', error);
    }
}

// Actualizar estadísticas del dashboard
function actualizarEstadisticas() {
    try {
        const incidentes = JSON.parse(localStorage.getItem('incidentes_farmacovigilancia') || '[]');
        
        // Actualizar métricas
        const totalElement = document.getElementById('totalIncidentes');
        const semanaElement = document.getElementById('incidentesSemana');
        
        if (totalElement) totalElement.textContent = incidentes.length;
        if (semanaElement) {
            const unaSemanaAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const ultimaSemana = incidentes.filter(inc => 
                new Date(inc.fecha_registro) >= unaSemanaAtras
            ).length;
            semanaElement.textContent = ultimaSemana;
        }
        
        console.log('📊 Estadísticas actualizadas:', incidentes.length, 'reportes');
    } catch (error) {
        console.error('Error actualizando estadísticas:', error);
    }
}

// Función para exportar datos
window.exportarDatos = function() {
    alert('📤 Función de exportación - Por implementar');
};

// Función para limpiar datos
window.limpiarDatos = function() {
    if (confirm('¿Estás seguro de que quieres limpiar todos los datos de demo?')) {
        localStorage.removeItem('incidentes_farmacovigilancia');
        alert('🧹 Datos de demo eliminados');
        location.reload();
    }
};
