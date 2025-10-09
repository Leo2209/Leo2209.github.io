// Datos de ejemplo simulados
class FarmacovigilanciaData {
    constructor() {
        this.incidentes = this.generarDatos();
    }

    generarDatos() {
        const dispositivos = ['Monitor A', 'Bomba B', 'Sensor C', 'Equipo D', 'Monitor E'];
        const tipos = ['grave', 'moderado', 'leve'];
        const descripciones = [
            'Falla en monitoreo continuo',
            'Error de dosificación',
            'Interrupción de servicio',
            'Falla de sensor',
            'Alerta no registrada',
            'Sobre dosificación',
            'Sub dosificación'
        ];

        let incidentes = [];
        const hoy = new Date();
        
        for (let i = 0; i < 150; i++) {
            const diasAtras = Math.floor(Math.random() * 180);
            const fecha = new Date(hoy);
            fecha.setDate(fecha.getDate() - diasAtras);
            
            incidentes.push({
                id: i + 1,
                fecha: fecha.toISOString().split('T')[0],
                tipo: tipos[Math.floor(Math.random() * tipos.length)],
                dispositivo: dispositivos[Math.floor(Math.random() * dispositivos.length)],
                gravedad: Math.floor(Math.random() * 5) + 1,
                descripcion: descripciones[Math.floor(Math.random() * descripciones.length)]
            });
        }
        
        return incidentes;
    }

    filtrarDatos(filtros = {}) {
        return this.incidentes.filter(incidente => {
            if (filtros.tipo && filtros.tipo !== 'all' && incidente.tipo !== filtros.tipo) {
                return false;
            }
            // ✅ CORRECCIÓN: Cambiar includes por igualdad exacta
            if (filtros.dispositivo && filtros.dispositivo !== 'all' && incidente.dispositivo !== filtros.dispositivo) {
                return false;
            }
            if (filtros.fechaInicio && incidente.fecha < filtros.fechaInicio) {
                return false;
            }
            if (filtros.fechaFin && incidente.fecha > filtros.fechaFin) {
                return false;
            }
            return true;
        });
    }
}

// Funciones para el formulario de reporte
function guardarReporte() {
    const form = document.getElementById('reporteIncidenteForm');
    const formData = new FormData(form);
    
    // Convertir FormData a objeto
    const reporte = {};
    for (let [key, value] of formData.entries()) {
        reporte[key] = value;
    }
    
    // Validar campos requeridos
    if (!reporte.nombreProducto || !reporte.descripcionEvento || !reporte.fechaEvento) {
        alert('Por favor complete los campos requeridos: Nombre del producto, Descripción del evento y Fecha del evento');
        return;
    }
    
    // Generar ID único
    reporte.id = Date.now();
    reporte.fechaCreacion = new Date().toISOString();
    
    // Guardar en localStorage (simulación de base de datos)
    guardarReporteEnStorage(reporte);
    
    // Cerrar modal y limpiar formulario
    const modal = bootstrap.Modal.getInstance(document.getElementById('formularioReporte'));
    if (modal) {
        modal.hide();
    }
    form.reset();
    
    // Actualizar dashboard
    if (window.dashboardInstance) {
        window.dashboardInstance.actualizarDashboard();
    }
    
    alert('✅ Reporte guardado exitosamente');
}

function guardarReporteEnStorage(reporte) {
    let reportes = JSON.parse(localStorage.getItem('reportesFarmacovigilancia') || '[]');
    reportes.push(reporte);
    localStorage.setItem('reportesFarmacovigilancia', JSON.stringify(reportes));
}

function cargarReportesDelStorage() {
    return JSON.parse(localStorage.getItem('reportesFarmacovigilancia') || '[]');
}

// Sistema de visualización PRINCIPAL
class DashboardFarmacovigilancia {
    constructor() {
        this.dataManager = new FarmacovigilanciaData();
        this.charts = {};
        this.inicializarFechas();
        this.inicializarEventos();
        this.actualizarDashboard();
        
        // Guardar instancia globalmente
        window.dashboardInstance = this;
    }

    inicializarFechas() {
        const fechas = this.dataManager.incidentes.map(i => i.fecha);
        if (fechas.length === 0) return;
        
        const minFecha = fechas.reduce((a, b) => a < b ? a : b);
        const maxFecha = fechas.reduce((a, b) => a > b ? a : b);
        
        if (document.getElementById('fechaInicio')) {
            document.getElementById('fechaInicio').value = minFecha;
        }
        if (document.getElementById('fechaFin')) {
            document.getElementById('fechaFin').value = maxFecha;
        }
    }

    inicializarEventos() {
        const tipoSelect = document.getElementById('tipoIncidente');
        const dispositivoSelect = document.getElementById('dispositivo');
        const fechaInicio = document.getElementById('fechaInicio');
        const fechaFin = document.getElementById('fechaFin');

        if (tipoSelect) tipoSelect.addEventListener('change', () => this.actualizarDashboard());
        if (dispositivoSelect) dispositivoSelect.addEventListener('change', () => this.actualizarDashboard());
        if (fechaInicio) fechaInicio.addEventListener('change', () => this.actualizarDashboard());
        if (fechaFin) fechaFin.addEventListener('change', () => this.actualizarDashboard());
    }

    obtenerFiltros() {
        return {
            tipo: document.getElementById('tipoIncidente')?.value || 'all',
            dispositivo: document.getElementById('dispositivo')?.value || 'all',
            fechaInicio: document.getElementById('fechaInicio')?.value || '',
            fechaFin: document.getElementById('fechaFin')?.value || ''
        };
    }

    actualizarDashboard() {
        const filtros = this.obtenerFiltros();
        const datosFiltrados = this.dataManager.filtrarDatos(filtros);
        
        // Combinar con datos de reportes guardados
        const reportesGuardados = cargarReportesDelStorage();
        const todosLosDatos = [...datosFiltrados, ...this.convertirReportesADatos(reportesGuardados)];
        
        this.actualizarMetricas(todosLosDatos);
        this.actualizarGraficos(todosLosDatos);
        this.actualizarTabla(todosLosDatos);
    }

    convertirReportesADatos(reportes) {
        return reportes.map(reporte => ({
            id: reporte.id,
            fecha: reporte.fechaEvento,
            tipo: this.clasificarTipoIncidente(reporte.descripcionEvento),
            dispositivo: reporte.nombreProducto || 'Dispositivo reportado',
            gravedad: this.calcularGravedad(reporte.descripcionEvento),
            descripcion: reporte.descripcionEvento,
            fuente: 'reporte_usuario'
        }));
    }

    clasificarTipoIncidente(descripcion) {
        if (!descripcion) return 'leve';
        const descLower = descripcion.toLowerCase();
        if (descLower.includes('grave') || descLower.includes('muerte') || descLower.includes('amenaza')) {
            return 'grave';
        } else if (descLower.includes('moderado') || descLower.includes('error')) {
            return 'moderado';
        }
        return 'leve';
    }

    calcularGravedad(descripcion) {
        if (!descripcion) return 1;
        const descLower = descripcion.toLowerCase();
        if (descLower.includes('muerte') || descLower.includes('fatal')) return 5;
        if (descLower.includes('amenaza') || descLower.includes('grave')) return 4;
        if (descLower.includes('hospitalización') || descLower.includes('serio')) return 3;
        if (descLower.includes('moderado') || descLower.includes('error')) return 2;
        return 1;
    }

    actualizarMetricas(datos) {
        const totalElement = document.getElementById('totalIncidentes');
        const gravesElement = document.getElementById('incidentesGraves');
        const dispositivosElement = document.getElementById('dispositivosActivos');

        if (totalElement && gravesElement && dispositivosElement) {
            const total = datos.length;
            const graves = datos.filter(d => d.tipo === 'grave').length;
            const dispositivosUnicos = new Set(datos.map(d => d.dispositivo)).size;

            totalElement.textContent = total;
            gravesElement.textContent = graves;
            dispositivosElement.textContent = dispositivosUnicos;
        }
    }

    actualizarGraficos(datos) {
        this.actualizarChartTipo(datos);
        this.actualizarChartDispositivo(datos);
        this.actualizarChartTendencia(datos);
    }

    actualizarChartTipo(datos) {
        const ctx = document.getElementById('chartTipo');
        if (!ctx) return;

        const tipos = ['grave', 'moderado', 'leve'];
        const counts = tipos.map(tipo => 
            datos.filter(d => d.tipo === tipo).length
        );

        if (this.charts.tipo) {
            this.charts.tipo.destroy();
        }

        this.charts.tipo = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Graves', 'Moderados', 'Leves'],
                datasets: [{
                    data: counts,
                    backgroundColor: ['#ff6b6b', '#ffd93d', '#6bcf7f']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    actualizarChartDispositivo(datos) {
        const ctx = document.getElementById('chartDispositivo');
        if (!ctx) return;

        const dispositivos = [...new Set(datos.map(d => d.dispositivo))];
        const counts = dispositivos.map(disp => 
            datos.filter(d => d.dispositivo === disp).length
        );

        if (this.charts.dispositivo) {
            this.charts.dispositivo.destroy();
        }

        this.charts.dispositivo = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dispositivos,
                datasets: [{
                    label: 'Número de Incidentes',
                    data: counts,
                    backgroundColor: '#4facfe'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    actualizarChartTendencia(datos) {
        const ctx = document.getElementById('chartTendencia');
        if (!ctx) return;
        
        // Agrupar por mes
        const meses = {};
        datos.forEach(incidente => {
            const mes = incidente.fecha.substring(0, 7); // YYYY-MM
            if (!meses[mes]) meses[mes] = 0;
            meses[mes]++;
        });

        const labels = Object.keys(meses).sort();
        const values = labels.map(mes => meses[mes]);

        if (this.charts.tendencia) {
            this.charts.tendencia.destroy();
        }

        this.charts.tendencia = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Incidentes por Mes',
                    data: values,
                    borderColor: '#667eea',
                    tension: 0.1,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    actualizarTabla(datos) {
        const tablaBody = document.getElementById('tablaBody');
        if (!tablaBody) return;

        const datosRecientes = datos
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            .slice(0, 10);

        tablaBody.innerHTML = datosRecientes.map(incidente => `
            <tr>
                <td>${incidente.fecha}</td>
                <td><span class="badge ${this.getBadgeClass(incidente.tipo)}">${incidente.tipo}</span></td>
                <td>${incidente.dispositivo}</td>
                <td>${'⚠️'.repeat(incidente.gravedad)}</td>
                <td>${incidente.descripcion}</td>
            </tr>
        `).join('');
    }

    getBadgeClass(tipo) {
        const classes = {
            grave: 'bg-danger',
            moderado: 'bg-warning',
            leve: 'bg-success'
        };
        return classes[tipo] || 'bg-secondary';
    }
}

// Inicializar dashboard cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    new DashboardFarmacovigilancia();
});
