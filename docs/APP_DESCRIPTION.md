# TicketIS - Portal de Gestión de Soporte Técnico

## 1. Visión General
TicketIS es una plataforma integral diseñada para centralizar y optimizar la gestión de incidencias técnicas en entornos operativos (bodegas y centros de distribución). Permite a los usuarios reportar problemas de forma pública y a los administradores gestionar, analizar y resolver dichos casos eficientemente.

## 2. Arquitectura Tecnológica (Stack)
*   **Frontend:** Next.js 15 (App Router) con React 19.
*   **Interfaz de Usuario:** ShadCN UI y Tailwind CSS (Diseño responsivo y moderno).
*   **Backend & Autenticación:** Firebase (Firestore para base de datos, Firebase Auth para seguridad).
*   **Gráficos & Análisis:** Recharts (Visualización de datos en tiempo real).
*   **Exportación:** XLSX para reportes en Excel/CSV.

## 3. Roles de Usuario
*   **Usuario Público / Reportante:** Puede crear tickets desde la página principal sin necesidad de login.
*   **Usuario Administrativo:**
    *   Visualización de métricas y tendencias.
    *   Gestión de ciclo de vida de tickets (Asignación, Cambio de estado, Cierre).
    *   Configuración de recursos maestros (Bodegas, Cuentas, Sistemas).
    *   Gestión de usuarios y causas raíz.

## 4. Funcionalidades Principales

### A. Reporte de Incidencias
*   Formulario inteligente que filtra Cuentas y Sistemas basados en la Bodega seleccionada.
*   Captura de datos críticos: Quién reporta, ubicación (Bodega/Cuenta), sistema afectado y descripción del problema.

### B. Panel Administrativo (Dashboard)
*   **Métricas en Tiempo Real:** Total de tickets, abiertos, en progreso, cerrados y tiempo promedio de resolución.
*   **Gráficos de Tendencia:** Análisis visual de tickets creados vs. cerrados y productividad por usuario.
*   **Análisis de Causa Raíz:** Gráfico de Treemap para identificar los problemas más recurrentes.

### C. Gestión de Tickets
*   **Tabla Avanzada:** Filtrado por columnas, búsqueda global y paginación.
*   **Flujo de Resolución:** Proceso formal de cierre que requiere registrar una "Causa Raíz" y un comentario técnico de solución.
*   **Asignación:** Capacidad de auto-asignarse tickets o delegarlos a otros administradores.

### D. Administración del Sistema
*   **Módulos Maestros:** Creación y edición de Bodegas, Cuentas asociadas y Sistemas (SAP, WMS, etc.).
*   **Exportación de Datos:** Generación de reportes personalizados en Excel para auditorías o reuniones de KPI.
*   **Seguridad:** Panel de cambio de contraseña y creación de nuevos perfiles administrativos.

## 5. Flujo de Trabajo Ideal
1.  **Detección:** Un operario detecta una falla en el sistema.
2.  **Reporte:** Accede al portal público y crea el ticket.
3.  **Gestión:** Un administrador recibe el ticket, lo marca "En Progreso" y se lo asigna.
4.  **Resolución:** Una vez solucionado, el admin cierra el ticket categorizando la falla (ej: Error de Usuario, Falla de Red).
5.  **Análisis:** Al final del mes, la gerencia revisa los gráficos para tomar decisiones preventivas.

---
*Documento generado para la presentación del proyecto TicketIS.*
