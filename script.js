// IMPORTANTE:
// Reemplaza 'http://localhost:8000' y 'http://localhost:8081' con las IPs/URLs
// de tus microservicios a través de Kong, incluyendo el puerto 8000 de Kong.
// Asumiendo la IP externa de Kong es 34.27.77.137 y puerto 8000:

const KONG_IP_EXTERNA = '34.55.80.240'; // La IP externa de tu instancia de Kong
const KONG_PORT = '8000'; // Puerto proxy de Kong

// Actualiza estas URLs para apuntar a Kong con las rutas que definiste en kong.yaml
const JAVA_SERVICE_URL = `http://${KONG_IP_EXTERNA}:${KONG_PORT}/seguridad`;
const DJANGO_SERVICE_1_URL = `http://${KONG_IP_EXTERNA}:${KONG_PORT}/personal-medico/internal`; // Ruta configurada en Kong
const DJANGO_SERVICE_2_URL = `http://${KONG_IP_EXTERNA}:${KONG_PORT}/historia-clinica/api/report`; // Ruta configurada en Kong
// NOTA: Para el servicio 2 de Django, la URL que tenías era '/historia-clinica/api/report'.
// Si tu MS de Django tiene un endpoint de 'status', ajusta esta URL según tu kong.yaml
// o la ruta real en Kong. El ejemplo arriba asume la ruta /historia-clinica/api/report

async function callDjangoService(serviceName) {
    const statusDiv = document.getElementById('djangoStatus');
    statusDiv.textContent = `Llamando a ${serviceName}...`;
    statusDiv.className = 'status-message'; // Resetear clases

    let serviceUrl = '';
    if (serviceName === 'django-service-1') {
        serviceUrl = DJANGO_SERVICE_1_URL;
    } else if (serviceName === 'django-service-2') {
        serviceUrl = DJANGO_SERVICE_2_URL;
    } else {
        statusDiv.textContent = 'Servicio Django desconocido.';
        return;
    }

    try {
        const response = await fetch(serviceUrl);
        const data = await response.json();
        statusDiv.textContent = `Respuesta de ${serviceName}:\n${JSON.stringify(data, null, 2)}`;
        if (response.ok) {
            statusDiv.classList.add('success');
        } else {
            statusDiv.classList.add('alert');
        }
    } catch (error) {
        statusDiv.textContent = `Error al llamar a ${serviceName}: ${error.message}`;
        statusDiv.classList.add('alert');
        console.error(`Error al llamar a ${serviceName}:`, error);
    }
}

async function startJavaMonitoring() {
    const statusDiv = document.getElementById('javaStatus');
    statusDiv.textContent = 'Iniciando monitoreo de spoofing...';
    statusDiv.className = 'status-message';

    try {
        // Asumiendo que tu endpoint para iniciar es /seguridad/start
        const response = await fetch(`${JAVA_SERVICE_URL}/start`);
        const message = await response.text();
        statusDiv.textContent = `Monitoreo Java: ${message}`;
        if (response.ok) {
            statusDiv.classList.add('success');
        } else {
            statusDiv.classList.add('alert');
        }
        // Después de iniciar, podemos empezar a refrescar los resultados
        setTimeout(getJavaLatestResults, 1000); // Dar un segundo para la primera revisión
        setInterval(getJavaLatestResults, 5000); // Refrescar resultados cada 5 segundos
        setInterval(getJavaStatistics, 5000); // Refrescar estadísticas cada 5 segundos
    } catch (error) {
        statusDiv.textContent = `Error al iniciar monitoreo Java: ${error.message}`;
        statusDiv.classList.add('alert');
        console.error('Error al iniciar monitoreo Java:', error);
    }
}

async function stopJavaMonitoring() {
    const statusDiv = document.getElementById('javaStatus');
    statusDiv.textContent = 'Deteniendo monitoreo de spoofing...';
    statusDiv.className = 'status-message';

    try {
        // Asumiendo que tu endpoint para detener es /seguridad/stop
        const response = await fetch(`${JAVA_SERVICE_URL}/stop`);
        const message = await response.text();
        statusDiv.textContent = `Monitoreo Java: ${message}`;
        if (response.ok) {
            statusDiv.classList.add('success');
        } else {
            statusDiv.classList.add('alert');
        }
    } catch (error) {
        statusDiv.textContent = `Error al detener monitoreo Java: ${error.message}`;
        statusDiv.classList.add('alert');
        console.error('Error al detener monitoreo Java:', error);
    }
}

async function getJavaLatestResults() {
    const statusDiv = document.getElementById('javaStatus');
    try {
        // Asumiendo que tu endpoint para obtener resultados es /seguridad/latest-results
        const response = await fetch(`${JAVA_SERVICE_URL}/latest-results`);
        const results = await response.json();
        displayMonitoringResults(results);
    } catch (error) {
        statusDiv.textContent = `Error al obtener resultados de monitoreo Java: ${error.message}`;
        statusDiv.classList.add('alert');
        console.error('Error al obtener resultados de monitoreo Java:', error);
    }
}

function displayMonitoringResults(results) {
    const tableBody = document.querySelector('#monitoringResultsTable tbody');
    tableBody.innerHTML = ''; // Limpiar resultados anteriores

    if (results && results.length > 0) {
        results.forEach(result => {
            const row = tableBody.insertRow();
            const microserviceCell = row.insertCell();
            const timestampCell = row.insertCell();
            const spoofingDetectedCell = row.insertCell();
            const messageCell = row.insertCell();

            microserviceCell.textContent = result.microserviceName;
            timestampCell.textContent = new Date(result.timestamp).toLocaleString();
            spoofingDetectedCell.textContent = result.spoofingDetected ? 'Sí' : 'No';
            messageCell.textContent = result.message;

            if (result.spoofingDetected) {
                row.classList.add('spoofing-detected');
            }
        });
    } else {
        const row = tableBody.insertRow();
        const cell = row.insertCell(0);
        cell.colSpan = 4;
        cell.textContent = 'No hay resultados de monitoreo aún.';
        cell.style.textAlign = 'center';
    }
}

async function getJavaStatistics() {
    const statisticsDiv = document.getElementById('statisticsDisplay');
    statisticsDiv.className = 'status-message'; // Resetear clases
    try {
        // Asumiendo que tu endpoint para estadísticas es /seguridad/statistics
        const response = await fetch(`${JAVA_SERVICE_URL}/statistics`);
        const stats = await response.json();
        statisticsDiv.innerHTML = `
            <p><strong>Estadísticas de Detección de Spoofing:</strong></p>
            <p>Total de Chequeos Realizados: ${stats.totalChecks}</p>
            <p>Detecciones de Spoofing: ${stats.spoofingDetections}</p>
            <p>Tasa de Detección (eventos/chequeos): ${stats.detectionRatePercentage.toFixed(2)}%</p>
            <p>Eficacia del Detector de Seguridad: ${stats.detectorEfficiencyPercentage.toFixed(2)}%</p>
        `;
        statisticsDiv.classList.add('success');
    } catch (error) {
        statisticsDiv.textContent = `Error al obtener estadísticas de Java: ${error.message}`;
        statisticsDiv.classList.add('alert');
        console.error('Error al obtener estadísticas de Java:', error);
    }
}