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
            if (filtros.dispositivo && filtros.dispositivo !== 'all' && !incidente.dispositivo.includes(filtros.dispositivo)) {
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

// Sistema de visualización
class DashboardFarmacovigilancia {
    constructor() {
        this.dataManager = new FarmacovigilanciaData();
        this.charts = {};
        this.inicializarFechas();
        this.inicializarEventos();
        this.actualizarDashboard();
    }

    inicializarFechas() {
        const fechas = this.dataManager.incidentes.map(i => i.fecha);
        const minFecha = fechas.reduce((a, b) => a < b ? a : b);
        const maxFecha = fechas.reduce((a, b) => a > b ? a : b);
        
        document.getElementById('fechaInicio').value = minFecha;
        document.getElementById('fechaFin').value = maxFecha;
    }

    inicializarEventos() {
        document.getElementById('tipoIncidente').addEventListener('change', () => this.actualizarDashboard());
        document.getElementById('dispositivo').addEventListener('change', () => this.actualizarDashboard());
        document.getElementById('fechaInicio').addEventListener('change', () => this.actualizarDashboard());
        document.getElementById('fechaFin').addEventListener('change', () => this.actualizarDashboard());
    }

    obtenerFiltros() {
        return {
            tipo: document.getElementById('tipoIncidente').value,
            dispositivo: document.getElementById('dispositivo').value,
            fechaInicio: document.getElementById('fechaInicio').value,
            fechaFin: document.getElementById('fechaFin').value
        };
    }

    actualizarDashboard() {
        const filtros = this.obtenerFiltros();
        const datosFiltrados = this.dataManager.filtrarDatos(filtros);
        
        this.actualizarMetricas(datosFiltrados);
        this.actualizarGraficos(datosFiltrados);
        this.actualizarTabla(datosFiltrados);
    }

    actualizarMetricas(datos) {
        const total = datos.length;
        const graves = datos.filter(d => d.tipo === 'grave').length;
        const dispositivosUnicos = new Set(datos.map(d => d.dispositivo)).size;

        document.getElementById('totalIncidentes').textContent = total;
        document.getElementById('incidentesGraves').textContent = graves;
        document.getElementById('dispositivosActivos').textContent = dispositivosUnicos;
    }

    actualizarGraficos(datos) {
        this.actualizarChartTipo(datos);
        this.actualizarChartDispositivo(datos);
        this.actualizarChartTendencia(datos);
    }

    actualizarChartTipo(datos) {
        const ctx = document.getElementById('chartTipo').getContext('2d');
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
        const ctx = document.getElementById('chartDispositivo').getContext('2d');
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
        const ctx = document.getElementById('chartTendencia').getContext('2d');
        
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
