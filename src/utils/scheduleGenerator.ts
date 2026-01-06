
export type DayStatus = 'S' | 'I' | 'P' | 'B' | 'D' | '-';

export interface ScheduleParams {
  workDays: number; // N
  restDays: number; // M
  inductionDays: number; // I
  totalDays: number;
  minRestDaysS2S3?: number; // Minimum rest days for S2/S3 before they can return (default: 2)
}

export interface DayData {
  dayIndex: number;
  s1: DayStatus;
  s2: DayStatus;
  s3: DayStatus;
  drillCount: number;
  errors: string[];
}

export const generateSchedule = (params: ScheduleParams): DayData[] => {
  const { workDays, restDays, inductionDays, totalDays, minRestDaysS2S3 = 2 } = params;
  const schedule: DayData[] = [];

  // Initialize schedule with empty days
  for (let i = 0; i < totalDays; i++) {
    schedule.push({
      dayIndex: i,
      s1: '-',
      s2: '-',
      s3: '-',
      drillCount: 0,
      errors: []
    });
  }

  // Helper to set status safely
  const setStatus = (supervisor: 's1' | 's2' | 's3', day: number, status: DayStatus) => {
    if (day >= 0 && day < totalDays) {
      schedule[day][supervisor] = status;
    }
  };

  // --- S1 Generation (Fixed Cycle) ---
  const s1CycleLength = workDays + restDays;
  const s1ActiveLength = workDays + 1;

  for (let i = 0; i < totalDays; i++) {
    const CycleDay = i % s1CycleLength;
    let status: DayStatus = '-';
    const cycleCount = Math.floor(i / s1CycleLength);

    if (CycleDay < s1ActiveLength) {
      if (CycleDay === 0) status = 'S';
      else if (cycleCount === 0 && CycleDay <= inductionDays) {
        status = 'I';
      }
      else {
        status = 'P';
      }
    } else {
      if (CycleDay === s1ActiveLength) status = 'B';
      else status = 'D';
    }
    setStatus('s1', i, status);
  }

  // --- S2 & S3 Orchestration (Adaptive & Equitable) ---
  for (let d = 0; d < totalDays; d++) {
    schedule[d].s2 = '-';
    schedule[d].s3 = '-';
  }

  let activeSup: 's2' | 's3' = 's2';
  let idleSup: 's2' | 's3' = 's3';

  const hasDoneInduction = (sup: 's2' | 's3', currentDay: number): boolean => {
    for (let k = 0; k < currentDay; k++) {
      if (schedule[k][sup] === 'I') return true;
    }
    return false;
  };

  const hasWorkedBefore = (sup: 's2' | 's3', currentDay: number): boolean => {
    for (let k = 0; k < currentDay; k++) {
      if (schedule[k][sup] === 'B') return true;
    }
    return false;
  };

  const getRestDaysSinceB = (sup: 's2' | 's3', currentDay: number): number => {
    let count = 0;
    for (let k = currentDay - 1; k >= 0; k--) {
      const status = schedule[k][sup];
      if (status === 'D') count++;
      else if (status === 'B') break;
      else break;
    }
    return count;
  };

  const getDaysWorked = (dayIndex: number, sup: 's2' | 's3'): number => {
    let count = 0;
    for (let k = dayIndex; k >= 0; k--) {
      const s = schedule[k][sup];
      if (s === 'S' || s === 'I' || s === 'P') {
        count++;
      } else {
        break;
      }
    }
    return count;
  };

  // Calculate total P days worked by a supervisor up to currentDay
  const getTotalPDaysWorked = (sup: 's2' | 's3', currentDay: number): number => {
    let count = 0;
    for (let k = 0; k < currentDay; k++) {
      if (schedule[k][sup] === 'P') count++;
    }
    return count;
  };

  const fillWorkBlock = (sup: 's2' | 's3', startDay: number) => {
    if (startDay >= totalDays) return;

    setStatus(sup, startDay, 'S');

    const doneInduction = hasDoneInduction(sup, startDay);
    const currentInductionDays = doneInduction ? 0 : inductionDays;

    for (let k = 1; k <= currentInductionDays; k++) {
      if (startDay + k < totalDays) {
        setStatus(sup, startDay + k, 'I');
      }
    }

    const firstPDay = startDay + 1 + currentInductionDays;
    if (firstPDay < totalDays) {
      setStatus(sup, firstPDay, 'P');
    }
  };

  fillWorkBlock('s2', 0);

  for (let i = 0; i < totalDays; i++) {
    const idleStatus = schedule[i][idleSup];
    const idleIsP = idleStatus === 'P';

    if (idleIsP) {
      const s1P = schedule[i].s1 === 'P';
      if (s1P) {
        if (schedule[i][activeSup] !== 'B') {
          setStatus(activeSup, i, 'B');
          [activeSup, idleSup] = [idleSup, activeSup];
        }
      }
    }

    const needsInduction = !hasDoneInduction(idleSup, i);
    const dynamicInductionDays = needsInduction ? inductionDays : 0;
    const prepTime = dynamicInductionDays + 1;
    const deadline = i + prepTime;

    if (deadline < totalDays) {
      const s1FutureP = schedule[deadline].s1 === 'P';
      const activeDaysAtDeadline = getDaysWorked(i, activeSup) + prepTime;
      const activeValid = activeDaysAtDeadline < workDays;

      const gapComing = !s1FutureP;
      const limitComing = !activeValid;

      // PRIORIDAD: Siempre intentar tener 2P
      // Si no es posible por restricciones, aceptar 1P temporalmente
      const willNeedIdle = gapComing || limitComing;

      // EQUIDAD: Preferir al supervisor que ha trabajado menos días P
      const s2TotalP = getTotalPDaysWorked('s2', i);
      const s3TotalP = getTotalPDaysWorked('s3', i);
      const shouldPreferS2 = s2TotalP <= s3TotalP;
      const preferredSup: 's2' | 's3' = shouldPreferS2 ? 's2' : 's3';

      // Si el idle actual NO es el preferido, considerar intercambio
      if (idleSup !== preferredSup && !willNeedIdle) {
        // Solo intercambiar si el preferido está disponible
        const preferredStatus = schedule[i][preferredSup];
        const preferredIsAvailable = preferredStatus === 'D' || preferredStatus === '-';
        const preferredHasRest = !hasWorkedBefore(preferredSup, i) || getRestDaysSinceB(preferredSup, i) >= minRestDaysS2S3;

        if (preferredIsAvailable && preferredHasRest) {
          // Intercambiar roles para dar prioridad al menos trabajado
          [activeSup, idleSup] = [idleSup, activeSup];
        }
      }

      // VALIDACIÓN: ¿Podemos convocar al Idle?
      // 1. No debe estar trabajando actualmente
      const idleIsBusy = ['S', 'I', 'P'].includes(schedule[i][idleSup]);

      // 2. No puede estar en medio de un ciclo activo
      let isInActiveCycle = false;
      if (i > 0) {
        for (let k = i - 1; k >= 0; k--) {
          const status = schedule[k][idleSup];
          if (status === 'B' || status === 'D') break;
          if (status === 'S' || status === 'I' || status === 'P') {
            isInActiveCycle = true;
            break;
          }
        }
      }

      // 3. No debe tener S programada próximamente
      let hasUpcomingS = false;
      for (let k = i; k < Math.min(i + prepTime + 5, totalDays); k++) {
        if (schedule[k][idleSup] === 'S') {
          hasUpcomingS = true;
          break;
        }
      }

      // 4. Si trabajó antes, debe tener descanso suficiente
      const workedBefore = hasWorkedBefore(idleSup, i);
      const isProjectStart = i === 0;

      let canSummon = !idleIsBusy && !hasUpcomingS && !isInActiveCycle;

      if (!isProjectStart && workedBefore) {
        const restDays = getRestDaysSinceB(idleSup, i);
        const hasEnoughRest = restDays >= minRestDaysS2S3;
        canSummon = canSummon && hasEnoughRest;
      }

      // 5. Debe estar en estado de descanso apropiado
      if (canSummon) {
        const currentIdleStatus = schedule[i][idleSup];
        const canStartFromCurrentState = currentIdleStatus === '-' || currentIdleStatus === 'D';
        canSummon = canSummon && canStartFromCurrentState;
      }

      // ESTRATEGIA PROACTIVA: Maximizar tiempo con 2P
      // Contar cuántos supervisores están perforando AHORA
      const currentPCount = [schedule[i].s1, schedule[i].s2, schedule[i].s3].filter(s => s === 'P').length;

      // Verificar si el supervisor activo está por terminar su ciclo
      const activeDaysWorked = getDaysWorked(i, activeSup);
      const activeWillEndSoon = activeDaysWorked >= workDays - prepTime - 2;

      // DECISIÓN PROACTIVA: Convocar en múltiples escenarios
      const needsIdleForCoverage = willNeedIdle; // Gap o límite detectado
      const needsIdleFor2P = currentPCount < 2; // No tenemos 2P ahora
      const needsIdlePreventive = activeWillEndSoon && currentPCount === 2; // Prevenir caída a 1P

      const shouldSummon = canSummon && (
        needsIdleForCoverage ||
        needsIdleFor2P ||
        needsIdlePreventive
      );

      // VALIDACIÓN CRÍTICA: NO convocar si resultará en 3P
      let wouldCause3P = false;
      if (shouldSummon && deadline < totalDays) {
        // Proyectar cuántos supervisores estarán perforando en el deadline
        const s1AtDeadline = schedule[deadline].s1;
        const activeAtDeadline = activeDaysWorked + prepTime < workDays ? 'P' : 'B';
        const idleAtDeadline = 'P'; // El idle empezará a perforar

        const projectedPCount = [s1AtDeadline, activeAtDeadline, idleAtDeadline].filter(s => s === 'P').length;
        wouldCause3P = projectedPCount >= 3;
      }

      if (shouldSummon && !wouldCause3P) {
        fillWorkBlock(idleSup, i);
      }
    }

    // Continuar perforación si estaba en I o P el día anterior
    if (schedule[i][activeSup] === '-') {
      const prev = i > 0 ? schedule[i - 1][activeSup] : '-';
      if (prev === 'I' || prev === 'P') {
        setStatus(activeSup, i, 'P');
      }
    }

    if (schedule[i][idleSup] === '-') {
      const prev = i > 0 ? schedule[i - 1][idleSup] : '-';
      if (prev === 'I' || prev === 'P') {
        setStatus(idleSup, i, 'P');
      }
    }

    /* 
       LÍMITE ESTRICTO DE TRABAJO PARA S2 Y S3:
       Cuando cualquier supervisor alcanza su límite, DEBE salir.
       Aceptamos 1P temporalmente en lugar de extender turnos.
    */
    ['s2', 's3'].forEach(sup => {
      const supervisor = sup as 's2' | 's3';
      const daysWorked = getDaysWorked(i, supervisor);

      if (daysWorked >= workDays) {
        const currentStatus = schedule[i][supervisor];
        if (currentStatus === 'S' || currentStatus === 'I' || currentStatus === 'P') {
          setStatus(supervisor, i, 'B');

          if (supervisor === activeSup) {
            const otherP = schedule[i][idleSup] === 'P';
            if (otherP) {
              [activeSup, idleSup] = [idleSup, activeSup];
            }
          }
        }
      }
    });

    // Marcar días de descanso
    ['s2', 's3'].forEach(s => {
      const sup = s as 's2' | 's3';
      if (schedule[i][sup] === '-') {
        const prev = i > 0 ? schedule[i - 1][sup] : '-';
        if (prev === 'B' || prev === 'D') schedule[i][sup] = 'D';
      }
    });
  }

  return validateSchedule(schedule);
};

export const validateSchedule = (schedule: DayData[]): DayData[] => {
  const newSchedule = [...schedule];
  for (let i = 0; i < newSchedule.length; i++) {
    const day = newSchedule[i];
    day.errors = [];

    const pCount = [day.s1, day.s2, day.s3].filter(s => s === 'P').length;
    day.drillCount = pCount;

    if (pCount === 3) day.errors.push('3 P activas');
    const s3Entered = newSchedule.slice(0, i + 1).some(d => d.s3 !== '-');
    if (pCount === 1 && s3Entered) day.errors.push('Solo 1 P');
  }
  return newSchedule;
};
