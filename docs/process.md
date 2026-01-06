# Documentación del Proceso y Algoritmo

Este documento detalla la lógica utilizada para generar el cronograma de supervisores, cumpliendo con las reglas estrictas de la empresa minera.

## Glosario
- **S1, S2, S3**: Supervisores 1, 2 y 3.
- **N**: Días de Trabajo (Ciclo activo).
- **M**: Días de Descanso (Ciclo inactivo).
- **I**: Días de Inducción.
- **P**: Perforación.
- **S**: Subida.
- **B**: Bajada.
- **D**: Descanso.

## Reglas Fundamentales Implementadas
1. **Siempre 2 Supervisores Perforando**: El sistema garantiza que en todo momento (salvo el arranque inicial) haya exactamente 2 supervisores en estado 'P'.
2. **Ciclo S1 Fijo**: El Supervisor 1 sigue estrictamente su régimen de N días de trabajo y M días de descanso.
3. **Cobertura Flexible (S2/S3)**: S2 y S3 alternan sus ciclos para cubrir los huecos dejados por S1 y asegurar la regla de 2P.

## Lógica del Algoritmo

### 1. Generación del Ciclo Maestro (S1)
El Supervisor 1 es el "reloj" del sistema. Su ciclo se calcula de la siguiente manera:
- **Duración del Ciclo Total**: `N + M` días.
- **Fase Activa (Trabajo)**: Días `0` a `N`.
  - Día 0: **S** (Subida).
  - Días 1 a `I`: **I** (Inducción).
  - Días `I+1` a `N`: **P** (Perforación).
- **Fase Inactiva (Descanso)**: Días `N+1` a `N+M-1`.
  - Día `N+1`: **B** (Bajada).
  - Resto: **D** (Descanso).

### 2. Orquestación de S2 y S3
Para cumplir la regla de "Siempre 2 P", S2 y S3 actúan como soporte dinámico.
- **Estado Inicial**: S2 arranca en paralelo con S1 para cubrir la demanda inicial. S3 espera en reserva.
- **Máquina de Estados**:
  - El sistema escanea día a día el estado de S1.
  - Se identifican dos eventos críticos:
    
    a. **Inicio de Hueco (Gap Start)**: S1 termina su periodo de Perforación (P -> B).
       - En este momento, se requieren 2 supervisores de soporte (S2 y S3).
       - El supervisor que estaba en reserva (Idling) es "llamado" a subir.
       - Se insertan sus días de **S** e **I** retroactivamente para que empiece a perforar exactamente el día que S1 baja.
       
    b. **Fin de Hueco (Gap End)**: S1 regresa a Perforar (S -> P).
       - S1 se une a los 2 supervisores que estaban cubriendo el hueco.
       - Ahora hay 3 supervisores disponibles.
       - El supervisor "Activo" (el que lleva más tiempo trabajando) es enviado a Bajada (**B**).
       - Se realiza un relevo: El supervisor que entró recientemente se convierte en el "Activo", y el que baja pasa a la reserva ("Idling").

### 3. Manejo de Inducción
La inducción es configurable (1-5 días). Siempre que un supervisor es llamado a subir, el sistema planifica su llegada (`S`) con `I + 1` días de anticipación respecto al día que debe empezar a perforar (`P`), asegurando que cumpla con la capacitación obligatoria.

### 4. Validaciones
El sistema verifica al final de la generación:
- Que no existan días con 3 supervisores perforando.
- Que no haya días con solo 1 supervisor perforando (después de la fase de arranque).
- Se muestran alertas visuales en la tabla si se detectan anomalías.
