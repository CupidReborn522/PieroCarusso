
export type DayStatus = 'S' | 'I' | 'P' | 'B' | 'D' | '-';

export interface ScheduleParams {
  workDays: number; // N
  restDays: number; // M
  inductionDays: number; // I
  totalDays: number;
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
  const { workDays, restDays, inductionDays, totalDays } = params;
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
  // Cycle Length = N + M
  // Active Phase (S+I+P) = N + 1 days (Indices 0..N)
  // Rest Phase (B+D) = M - 1 days (Indices N+1..N+M-1)

  const s1CycleLength = workDays + restDays;
  const s1ActiveLength = workDays + 1; // 0 to N
  // Break down Active: S(1) + I(I) + P(Rest)
  // P length = s1ActiveLength - 1 - inductionDays = N - inductionDays

  for (let i = 0; i < totalDays; i++) {
    const CycleDay = i % s1CycleLength;
    let status: DayStatus = '-';

    if (CycleDay < s1ActiveLength) {
      if (CycleDay === 0) status = 'S';
      else if (CycleDay <= inductionDays) status = 'I';
      else status = 'P';
    } else {
      // Rest Phase
      if (CycleDay === s1ActiveLength) status = 'B';
      else status = 'D';
    }
    setStatus('s1', i, status);
  }

  // --- S2 & S3 Orchestration ---
  // Strategy: 
  // 1. S2 mirrors S1's first active phase.
  // 2. Identify transitions where S1 P starts/stops.
  // 3. Alternate support role between S2 and S3.

  // Initialize S2 for the very first cycle of work (Mirror S1)
  // We manually fill S2 for the first "Work Phase" duration
  // Actually, we can just treat the "Start" as a "Gap End" event where S1 starts?
  // Let's handle day 0 specifically.

  // Fill S2 startup (S -> I -> P) matching S1
  // S1 has P from day (1+I).
  // S2 should be P from day (1+I).
  // Meaning S2 starts S at day 0 too.
  for (let d = 0; d < s1ActiveLength; d++) {
    setStatus('s2', d, schedule[d].s1);
  }
  // S3 is '-' initially (idling)



  // Refined Logic with loop
  let activeSup: 's2' | 's3' = 's2';
  let idleSup: 's2' | 's3' = 's3';

  // Track "P" status of supporters internally to decide transitions
  // But we can just read from schedule array if we fill it correctly?
  // We need to fill P FORWARD.

  // Let's do a simulation day by day.
  // For S2 and S3, we need to know:
  // - Current Status (S, I, P, B, D, -)
  // - Days remaining in status (e.g. I takes x days)

  // Actually, easier:
  // 1. Identify "Demand" intervals.
  //    Interval 1: D0..D5 (S1 Prep). Need 2 or 0? 
  //       Prompt: D0..D5 #P=0.
  //       So during S1 Prep, we don't enforce P.
  //       S2 mirrors S1. #P = 0.
  //       S3 -.
  //    Interval 2: S1 P (D6..D14). Need 1 Supporter.
  //       S2 is P. S3 -. Total 2 P. OK.
  //    Interval 3: S1 Rest (D15..D20?). Gap. Need 2 Supporters.
  //       S2 P. S3 P.
  //    Interval 4: S1 P (D21..). Need 1 Supporter.
  //       S2 Leaves. S3 P.

  // So:
  // If S1 P starts, and we have 2 Supporters -> Drop one.
  // If S1 P stops, and we have 1 Supporter -> Summon one.

  // Implementation:
  // Loop i = 0..Total.
  // S1 status known.
  // S2, S3 status needs to be determined.
  // BUT Summoning requires writing to PAST (i - I - 1).
  // This is fine. We iterate, and when we hit trigger, we overwrite past.

  for (let i = 0; i < totalDays; i++) {
    const s1IsP = schedule[i].s1 === 'P';
    const prevS1IsP = i > 0 ? schedule[i - 1].s1 === 'P' : false;

    // TRIGGER 1: GAP START (Falling Edge of S1 P) -> Summon Idle
    if (prevS1IsP && !s1IsP) {
      // Prepare Idling Supporter to be P by day i.
      const startP = i;
      const startS = startP - inductionDays - 1;

      // Write S and I
      if (startS >= 0) setStatus(idleSup, startS, 'S');
      for (let k = 1; k <= inductionDays; k++) {
        setStatus(idleSup, startS + k, 'I');
      }

      // From day i onwards, this supporter is P (handled by filler loop below)
    }

    // TRIGGER 2: GAP END (Rising Edge of S1 P) -> Dismiss Active
    if (i > 0 && !prevS1IsP && s1IsP) {
      // S1 is back.
      // Check if Idling Supporter is actually P (active).
      const idleName = idleSup;
      // Check if idle was P yesterday (or just scheduled to be P today)
      // Since we backfilled, status at i should be P (or ready to be P).
      // If backfilled, they are P.

      // If we have Support 2 (Idle) ready, we drop Support 1 (Active).
      // How to know if Idle is ready?
      // Check if we summoned them.
      // Look at schedule[i][idleName].
      // But we haven't written P for today yet.

      // We can check if schedule[i-1][idleName] was 'I' or 'P'.
      const idlePrev = schedule[i - 1][idleName];
      const idleReady = (idlePrev === 'P' || idlePrev === 'I');
      // Note: if I ends at i-1, i is P.

      if (idleReady) {
        // Dismiss Active
        setStatus(activeSup, i, 'B');

        // Swap roles
        // Swap roles
        [activeSup, idleSup] = [idleSup, activeSup];
      }
    }

    // FILLER: Maintain P for active/working supervisors
    if (schedule[i][activeSup] === '-') {
      schedule[i][activeSup] = 'P';
    }

    // Idling Supporter:
    const prevIdling = i > 0 ? schedule[i - 1][idleSup] : '-';
    const currIdling = schedule[i][idleSup];
    if (currIdling === '-' && (prevIdling === 'I' || prevIdling === 'P')) {
      schedule[i][idleSup] = 'P';
    }

    // Also handle Rest (D) after B
    ['s2', 's3'].forEach(sup => {
      const s = sup as 's2' | 's3';
      const prev = i > 0 ? schedule[i - 1][s] : '-';
      const curr = schedule[i][s];
      if (curr === '-' && (prev === 'B' || prev === 'D')) {
        schedule[i][s] = 'D';
      }
    });
  }

  return validateSchedule(schedule);
};

export const validateSchedule = (schedule: DayData[]): DayData[] => {
  const newSchedule = [...schedule];
  for (let i = 0; i < newSchedule.length; i++) {
    const day = newSchedule[i];
    // Reset errors and count for re-validation
    day.errors = [];

    const pCount = [day.s1, day.s2, day.s3].filter(s => s === 'P').length;
    day.drillCount = pCount;

    // Validation
    // Error 3P
    if (pCount === 3) day.errors.push('3 P activas');
    // Error 1P
    const s3Entered = newSchedule.slice(0, i + 1).some(d => d.s3 !== '-');
    if (pCount === 1 && s3Entered) day.errors.push('Solo 1 P');
  }
  return newSchedule;
};
