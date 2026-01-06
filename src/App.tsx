
import { useState } from 'react';
import './App.css';
import { ConfigForm } from './components/ConfigForm';
import { ScheduleGrid } from './components/ScheduleGrid';
import { generateSchedule } from './utils/scheduleGenerator';
import type { DayData, ScheduleParams } from './utils/scheduleGenerator';

function App() {
  const [config, setConfig] = useState<ScheduleParams>({
    workDays: 14,
    restDays: 7,
    inductionDays: 5,
    totalDays: 30
  });

  const [schedule, setSchedule] = useState<DayData[]>([]);

  const handleGenerate = () => {
    const data = generateSchedule(config);
    setSchedule(data);
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

        <ScheduleGrid schedule={schedule} />
      </main>
    </div>
  );
}

export default App;
