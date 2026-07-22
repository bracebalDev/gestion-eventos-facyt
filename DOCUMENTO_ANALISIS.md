# Documento de Análisis - Sistema de Gestión de Eventos FaCyT (SI-Eventos)

**Integrantes del Equipo:**
- [Nombre y Apellido 1]
- [Nombre y Apellido 2]

**URL del Despliegue:** [https://gestion-eventos-facyt.onrender.com](https://gestion-eventos-facyt.onrender.com)

---

## 1. Problema Identificado
En la Facultad Experimental de Ciencias y Tecnología (FaCyT) se realizan constantemente talleres, jornadas, reuniones y defensas de tesis. Actualmente, el proceso de solicitud y aprobación de espacios físicos (laboratorios, auditorios) sufre de **falta de trazabilidad, información fragmentada e informalidad**. Esto ocasiona pérdida de solicitudes, solapamiento de horarios (dos eventos en el mismo laboratorio al mismo tiempo) y dificultades para que los Directores de Departamento lleven un control eficiente sobre quién y para qué se utilizan sus espacios.

## 2. Análisis Sistémico
La situación organizacional fue abordada bajo el enfoque de la Teoría General de Sistemas:

*   **Propósito del sistema:** Centralizar, validar y agilizar la solicitud, aprobación y seguimiento de los eventos académicos en FaCyT, previniendo conflictos.
*   **Actores involucrados:** 
    *   *Solicitantes* (Estudiantes, Profesores, Investigadores).
    *   *Directores de Departamento* (Computación, Química, Biología, Matemática, Física).
    *   *Decanato* (Áreas de uso general).
*   **Entradas:** Datos de identidad (carnet, correo institucional), detalles del evento (fecha, hora, aforo, propósito), selección de espacios.
*   **Procesos:** Autenticación protegida, validación de conflictos de horario (cruce de variables de tiempo y espacio), enrutamiento de la solicitud al departamento correspondiente, evaluación (cambio de estado).
*   **Salidas:** Calendario visual actualizado, tableros estadísticos (Dashboard) para toma de decisiones, reportes en PDF, rechazos fundamentados.
*   **Restricciones:** Un director solo puede gestionar los espacios atados a su propio departamento. Los solicitantes no pueden auto-aprobarse eventos.
*   **Datos Relevantes:** Histórico de ocupación de espacios y flujo de estados (solicitado ➔ revisión ➔ aprobado).

## 3. Proceso y Automatización (Alcance)
**Proceso Representado:** El flujo inicia cuando un Solicitante llena un formulario. El sistema, de forma automática, **enruta** esa solicitud al Director adecuado dependiendo de la "Propiedad del Espacio" (ej. Si se elige *Lab LCC-1*, el sistema lo ancla obligatoriamente al Departamento de *Computación*). Luego, el Director evalúa la información en el panel flotante y decide si aprobar, rechazar o sugerir cambios.

**¿Qué se automatizó?** 
1. La detección de conflictos (choque de horarios).
2. El enrutamiento de permisos por Roles y Departamentos (Smart Routing).
3. La exportación de datos y reportes a formato PDF.

**¿Qué quedó fuera del alcance?**
El envío automatizado de correos electrónicos reales a los involucrados y la gestión de recursos logísticos (sillas, proyectores portátiles).

## 4. Datos y Toma de Decisiones
Se diseñó un **Tablero de Control (Dashboard)** que procesa los datos registrados para apoyar a la gerencia institucional. Mostrar los *Espacios más utilizados* y la tasa de *Eventos Pendientes vs Aprobados* permite al Decanato y a los Directores decidir si es necesario habilitar más salones de un tipo o si un departamento está sobrecargado de actividades extracurriculares.

## 5. Consideraciones Éticas
*   **Privacidad de Datos:** Se exige obligatoriamente el correo institucional (`@uc.edu.ve`) para garantizar que la plataforma solo sea usada por la comunidad FaCyT. 
*   **Revisión Humana (Human in the loop):** El sistema automatiza flujos, pero está programado bajo la premisa de que la aprobación final y la validación de la factibilidad del evento recae estrictamente bajo el juicio profesional del Director del Departamento.
*   **Seguridad:** Se implementó un escudo de *Rate Limiting* para evitar ataques de denegación de servicio (DDoS) o fuerza bruta a nivel de inicio de sesión.

---

## 6. Bitácora de Uso de Inteligencia Artificial

Durante el ciclo de desarrollo del sistema, se hizo un uso intensivo y crítico de la Inteligencia Artificial como miembro consultor y Pair-Programmer del equipo.

*   **Herramienta Utilizada:** Agente de Codificación "Antigravity" (Modelo LLM Avanzado) para el análisis, diseño y desarrollo completo.
*   **Propósito de uso:** 
    1. Diseño de la arquitectura de software (Vite + React + Express).
    2. Codificación de lógica de roles compleja.
    3. Integración de interfaz de usuario de alta fidelidad (Tailwind CSS).
    4. Refactorización de código y generación de reportes PDF.

**Ejemplos de Prompts o Instrucciones Relevantes enviadas a la IA:**
> *"Quiero que le agreguemos que las solicitudes que sean pertenecientes al Laboratorio de Computacion sea el director de computacion quien la apruebe, edite, modifique o elimine, igualmente para Quimica."*

> *"Agreguemos la Vista de Calendario Visual: Una vista clásica mensual donde los directores y estudiantes puedan ver los eventos distribuidos de forma gráfica."*

**Respuestas, Decisiones Aceptadas y Aprendizajes:**
*   **Decisión Aceptada (Arquitectura sin dependencias pesadas):** Para el calendario, la IA propuso no usar librerías de terceros (como `react-big-calendar`) para mantener la aplicación ultraligera, y construyó la cuadrícula matemáticamente usando React puro. El equipo aceptó y verificó que los años bisiestos y días coincidieran.
*   **Errores Detectados y Corregidos con IA:** Durante el desarrollo, al crear el sistema de Login, el servidor comenzó a arrojar errores `Unexpected end of JSON input`. La IA asistió en la depuración (Debugging), descubriendo que el entorno de desarrollo (Vite) estaba reiniciando el servidor cada vez que se modificaba el archivo de la base de datos `db.json`, lo que corrompía la memoria caché de las sesiones temporales.

**Cómo se verificó que la solución funcionaba:**
Se realizaron pruebas de caja negra, simulando el inicio de sesión de un estudiante intentando aprobar un evento (verificando que los controles UI estuvieran bloqueados), luego iniciando sesión como Director y comprobando que el sistema solo permitiese accionar sobre los eventos de su laboratorio correspondiente. Finalmente, se desplegó exitosamente en Render.com para comprobar su estabilidad en un entorno Cloud.
