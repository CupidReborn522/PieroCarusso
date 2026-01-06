
import React from 'react';
import type { DayData, DayStatus } from '../utils/scheduleGenerator';
import './ScheduleGrid.css';

interface ScheduleGridProps {
    schedule: DayData[];
}

const getStatusColor = (status: DayStatus) => {
    switch (status) {
        case 'S': return 'var(--color-subida)';
        case 'I': return 'var(--color-induccion)';
        case 'P': return 'var(--color-perforacion)';
        case 'B': return 'var(--color-bajada)';
        case 'D': return 'var(--color-descanso)';
        default: return 'var(--color-empty)';
    }
};

const getStatusLabel = (status: DayStatus) => {
    if (status === '-') return '';
    return status;
};

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({ schedule }) => {
    if (schedule.length === 0) return null;

    return (
        <div className="schedule-grid-container">
            <h3>Cronograma Generado</h3>
            <div className="schedule-table-wrapper">
                <table className="schedule-table">
                    <thead>
                        <tr>
                            <th>Supervisor</th>
                            {schedule.map(d => (
                                <th key={d.dayIndex}>{d.dayIndex}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="fixed-col">S1</td>
                            {schedule.map(d => (
                                <td key={d.dayIndex} style={{ backgroundColor: getStatusColor(d.s1) }}>
                                    {getStatusLabel(d.s1)}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="fixed-col">S2</td>
                            {schedule.map(d => (
                                <td key={d.dayIndex} style={{ backgroundColor: getStatusColor(d.s2) }}>
                                    {getStatusLabel(d.s2)}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="fixed-col">S3</td>
                            {schedule.map(d => (
                                <td key={d.dayIndex} style={{ backgroundColor: getStatusColor(d.s3) }}>
                                    {getStatusLabel(d.s3)}
                                </td>
                            ))}
                        </tr>
                        <tr className="count-row">
                            <td className="fixed-col"># Drill</td>
                            {schedule.map(d => (
                                <td key={d.dayIndex} className={d.drillCount !== 2 && d.drillCount > 0 ? 'error-cell' : ''}>
                                    {d.drillCount}
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>
            <div className="legend">
                <div className="legend-item"><span style={{ background: 'var(--color-subida)' }}></span> Subida (S)</div>
                <div className="legend-item"><span style={{ background: 'var(--color-induccion)' }}></span> Inducción (I)</div>
                <div className="legend-item"><span style={{ background: 'var(--color-perforacion)' }}></span> Perforación (P)</div>
                <div className="legend-item"><span style={{ background: 'var(--color-bajada)' }}></span> Bajada (B)</div>
                <div className="legend-item"><span style={{ background: 'var(--color-descanso)' }}></span> Descanso (D)</div>
            </div>
        </div>
    );
};
