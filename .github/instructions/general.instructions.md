---
applyTo: '**'
---
El proyecto servirá para que una IA mande una partitura en anotación ABC y esta mcp genere un pdf con la partitura correspondiente.
El flujo general será el siguiente:
1. La IA genera una partitura en notación ABC.
2. La partitura en notación ABC se envía al proyecto mcp.
3. El proyecto mcp procesa la partitura en notación ABC y genera un archivo PDF con la partitura correspondiente.
4. El archivo PDF generado se envía de vuelta a la IA o al usuario final.
El proyecto mcp debe ser capaz de manejar diferentes estilos y formatos de partituras según las especificaciones proporcionadas por la IA. Además, debe incluir validaciones para asegurar que la notación ABC recibida sea correcta antes de generar el PDF.
Se recomienda utilizar bibliotecas existentes para la conversión de notación ABC a PDF, asegurando así la calidad y precisión de las partituras generadas.
El proyecto debe incluir documentación clara sobre cómo integrar la IA con el sistema de generación de partituras en PDF, así como ejemplos de uso y posibles configuraciones.
Finalmente, se debe considerar la escalabilidad del sistema para manejar múltiples solicitudes de generación de partituras simultáneamente, garantizando tiempos de respuesta adecuados para los usuarios finales.

# Detalles técnicos
- Lenguaje de programación: nodejs
- MCP: debes desarrollar dos tipos de mcps:
  - Stdio: para recibir la notación ABC a través de la entrada estándar y devolver el PDF a través de la salida estándar.
  - Streamable HTTP: para remote servers.
- Libreria para MCP: https://www.npmjs.com/package/@modelcontextprotocol/sdk
- Entrada y salida:
  - Entrada: notación ABC en texto plano.
  - Salida: archivo PDF con la partitura generada.
- Formato de entrada: Notación ABC en texto plano.
- Librería recomendada para manejo de notación ABC: abcjs
- Herramienta recomendada para generación de PDF: pdfkit o similar
- Validación de notación ABC: Implementar validaciones básicas para asegurar que la entrada cumple con el formato esperado antes de procesarla.
- Documentación: Incluir ejemplos de integración y uso
- Escalabilidad: Considerar el uso de colas de trabajo o servicios en la nube para manejar múltiples solicitudes simultáneamente.
- Pruebas: Implementar pruebas unitarias y de integración para asegurar la calidad del código y la funcionalidad del sistema.
- Seguridad: Asegurar que el sistema maneje adecuadamente la entrada del usuario para prevenir vulnerabilidades como inyección de código o ataques similares.
- Licencia: Asegurarse de que todas las bibliotecas y herramientas utilizadas sean compatibles con la licencia del proyecto.
- Mantenimiento: Planificar actualizaciones regulares para mantener la compatibilidad con nuevas versiones de las bibliotecas y herramientas utilizadas.
- Comunidad: Fomentar la participación de la comunidad para mejorar y expandir las funcionalidades del proyecto.
- Soporte: Proveer canales de soporte para usuarios que integren la IA con el sistema de generación de partituras en PDF.
- Optimización: Evaluar y optimizar el rendimiento del sistema para asegurar tiempos de respuesta rápidos.
- Monitoreo: Implementar herramientas de monitoreo para rastrear el rendimiento y la salud del sistema en producción.
- Backup: Establecer procedimientos de respaldo para asegurar la integridad de los datos y configuraciones del sistema.
- Actualizaciones: Mantener el sistema actualizado con las últimas versiones de las dependencias y bibliotecas utilizadas.
- Feedback: Crear mecanismos para recibir retroalimentación de los usuarios y mejorar continuamente el sistema.
- Escalabilidad futura: Diseñar la arquitectura del sistema pensando en futuras expansiones y nuevas funcionalidades.
- Integración continua: Configurar pipelines de integración continua para facilitar el desarrollo y despliegue del proyecto.
- Documentación técnica: Mantener una documentación técnica detallada para desarrolladores que trabajen en el proyecto.
- Ejemplos de uso: Proveer ejemplos prácticos de cómo utilizar el sistema para generar partituras en PDF a partir de notación ABC.
- Comunidad de usuarios: Crear una comunidad de usuarios para compartir experiencias, resolver dudas y colaborar en el desarrollo del proyecto.
- Soporte multilingüe: Considerar la posibilidad de soportar múltiples idiomas en la documentación y en la interfaz del sistema.
- Accesibilidad: Asegurar que el sistema sea accesible para usuarios con diferentes capacidades.
- Pruebas de carga: Realizar pruebas de carga para evaluar el rendimiento del sistema bajo diferentes condiciones de uso.
- Optimización de recursos: Evaluar y optimizar el uso de recursos del sistema para mejorar la eficiencia.

# Seguridad de datos: Implementar medidas para proteger los datos manejados por el sistema.
- Cumplimiento normativo: Asegurar que el sistema cumpla con las normativas aplicables en materia de protección de datos y privacidad.
- Actualizaciones de seguridad: Mantener el sistema actualizado con las últimas actualizaciones de seguridad.
- Auditorías de seguridad: Realizar auditorías periódicas para identificar y corregir posibles vulnerabilidades en el sistema.
- Capacitación: Proveer capacitación para el equipo de desarrollo sobre mejores prácticas de seguridad.
- Respuesta a incidentes: Establecer procedimientos para responder a incidentes de seguridad.
- Evaluación continua: Evaluar continuamente las medidas de seguridad implementadas y realizar mejoras según sea necesario.
- Colaboración con expertos: Colaborar con expertos en seguridad para asegurar la robustez del sistema.
- Comunicación transparente: Mantener una comunicación transparente con los usuarios sobre las medidas de seguridad implementadas.
- Revisión de código: Implementar revisiones de código para identificar y corregir posibles vulnerabilidades.
- Pruebas de penetración: Realizar pruebas de penetración para evaluar la seguridad del sistema.
- Gestión de vulnerabilidades: Establecer un proceso para gestionar y corregir vulnerabilidades identificadas.
- Seguridad en la nube: Asegurar que las configuraciones de seguridad en la nube sean adecuadas para proteger los datos y servicios del sistema.
- Protección contra ataques DDoS: Implementar medidas para proteger el sistema contra ataques de denegación de servicio distribuido (DDoS).
- Seguridad en la integración: Asegurar que las integraciones con otros sistemas sean seguras y no introduzcan vulnerabilidades.
- Monitoreo de seguridad: Implementar herramientas de monitoreo para detectar posibles amenazas de seguridad en tiempo real.
- Actualización de dependencias: Mantener las dependencias del proyecto actualizadas para evitar vulnerabilidades conocidas.
- Políticas de seguridad: Establecer políticas de seguridad claras para el equipo de desarrollo y los usuarios del sistema.
- Evaluación de riesgos: Realizar evaluaciones de riesgos periódicas para identificar y mitigar posibles amenazas.
- Seguridad física: Asegurar que los servidores y equipos utilizados para el sistema estén protegidos físicamente contra accesos no autorizados.

# Estructura del proyecto
- /src: Código fuente del proyecto
- /tests: Pruebas unitarias y de integración
- /docs: Documentación del proyecto
- /examples: Ejemplos de uso e integración
- /config: Archivos de configuración
- /scripts: Scripts de automatización y despliegue
- /assets: Recursos estáticos como imágenes y estilos
- /build: Archivos generados y compilados
- /logs: Archivos de registro del sistema
- /tools: Herramientas y utilidades para el desarrollo y mantenimiento del proyecto
- /ci: Configuraciones para integración continua y despliegue
- /lib: Librerías y dependencias externas utilizadas en el proyecto
- /bin: Ejecutables y scripts de línea de comandos
- /tests/integration: Pruebas de integración específicas
