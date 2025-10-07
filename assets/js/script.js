// Pega aquí TODO el JavaScript que ya tenemos
document.addEventListener('DOMContentLoaded', function() {
    // Configurar fecha actual en formularios
    const fechaInputs = document.querySelectorAll('input[type="date"]');
    fechaInputs.forEach(input => {
        input.value = new Date().toISOString().split('T')[0];
    });

    // Manejar envío de formularios
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('✅ Incidente reportado exitosamente (simulado)');
            this.reset();
        });
    });

    // Funciones para botones
    window.mostrarFormulario = function() {
        alert('📋 Formulario de reporte de incidentes');
    };

    window.mostrarDispositivos = function() {
        alert('📊 Lista de dispositivos médicos');
    };
});
