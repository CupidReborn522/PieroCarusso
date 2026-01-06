# Documentación del Código

El proyecto es una aplicación web React construida con Vite y TypeScript.

## Estructura de Archivos

### `/src/utils`
- `scheduleGenerator.ts`: Contiene el núcleo lógico de la aplicación.
  - **generateSchedule(params)**: Función principal que recibe la configuración (N, M, I) y devuelve un array de objetos `DayData` con el estado de cada supervisor por día. implementa la lógica de relevos detallada en `process.md`.

### `/src/components`
- `ConfigForm.tsx`: Componente de formulario.
  - Permite al usuario ingresar los parámetros del régimen (Días de trabajo, descanso, inducción).
  - Valida entradas numéricas.
- `ScheduleGrid.tsx`: Componente de visualización.
  - Renderiza la tabla cronológica.
  - Aplica clases CSS dinámicas según el estado (S, I, P, B, D).
  - Calcula y muestra el conteo de perforadores diarios.
  - Resalta errores (celdas rojas) si el conteo de perforadores no es 2.

### `/src`
- `App.tsx`: Componente raíz.
  - Gestiona el estado global de la configuración y el cronograma generado.
  - Integra el formulario y la grilla.
- `index.css`: Estilos globales y variables de color (Theme).
- `App.css`: Estilos de layout principal.

## Tecnologías
- **React 18**: Librería de UI.
- **TypeScript**: Tipado estático para asegurar la consistencia de los datos (Interfaces `DayStatus`, `DayData`).
- **CSS Modules / Vanilla CSS**: Estilizado modular y mantenible.
- **Vite**: Build tool y dev server.

## Comandos
- `npm run dev`: Inicia el servidor de desarrollo.
- `npm run build`: Compila la aplicación para producción.
