import { useState } from 'react';
import './App.css';
import { ConfigForm } from './components/ConfigForm';
import { ScheduleGrid } from './components/ScheduleGrid';
import { generateSchedule, validateSchedule } from './utils/scheduleGenerator';
import type { DayData, DayStatus, ScheduleParams } from './utils/scheduleGenerator';

function App() {
  const [config, setConfig] = useState<ScheduleParams>({
    workDays: 14,
    restDays: 7,
    inductionDays: 5,
    totalDays: 30
  });

  const [schedule, setSchedule] = useState<DayData[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);

  const handleGenerate = () => {
    const data = generateSchedule(config);
    setSchedule(data);
    setIsEditMode(false);
  };

  const handleCellEdit = (dayIndex: number, supervisor: 's1' | 's2' | 's3', newStatus: DayStatus) => {
    const newSchedule = [...schedule];
    if (newSchedule[dayIndex]) {
      newSchedule[dayIndex] = {
        ...newSchedule[dayIndex],
        [supervisor]: newStatus
      };
      // Re-validate to update errors/counts
      const validated = validateSchedule(newSchedule);
      setSchedule(validated);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Planificador de Turnos de Supervisores</h1>
        <p>Algoritmo de optimización para cobertura continua (2 Perforadores)</p>
      </header>

      <main>
        <ConfigForm
          config={config}
          onConfigChange={setConfig}
          onGenerate={handleGenerate}
        />

        <ScheduleGrid
          schedule={schedule}
          isEditMode={isEditMode}
          onToggleEditMode={() => setIsEditMode(!isEditMode)}
          onCellEdit={handleCellEdit}
        />
      </main>
    </div>
  );
}

export default App;
