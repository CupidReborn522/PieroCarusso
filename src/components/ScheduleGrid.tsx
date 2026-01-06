
import React from 'react';
import type { DayData, DayStatus } from '../utils/scheduleGenerator';
import './ScheduleGrid.css';

interface ScheduleGridProps {
    schedule: DayData[];
    onCellEdit?: (dayIndex: number, supervisor: 's1' | 's2' | 's3', newStatus: DayStatus) => void;
    isEditMode: boolean;
    onToggleEditMode: () => void;
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

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({
    schedule,
    onCellEdit,
    isEditMode,
    onToggleEditMode
}) => {
    if (schedule.length === 0) return null;

    const supervisors: ('s1' | 's2' | 's3')[] = ['s1', 's2', 's3'];
    const statuses: DayStatus[] = ['S', 'I', 'P', 'B', 'D', '-'];

    const handleStatusChange = (dayIndex: number, sup: 's1' | 's2' | 's3', val: string) => {
        if (onCellEdit) {
            onCellEdit(dayIndex, sup, val as DayStatus);
        }
    };

    return (
        <div className="schedule-grid-container">
            <div className="grid-header">
                <h3>Cronograma Generado</h3>
                <button
                    onClick={onToggleEditMode}
                    className={`edit-toggle-btn mb-4 ${isEditMode ? 'active' : ''}`}
                    title="Activar/Desactivar edición manual"
                >
                    {isEditMode ? '🔓 Modo Edición Activo' : '🔒 Modo Lectura'}
                </button>
                <br />
            </div>

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
                        {supervisors.map(sup => (
                            <tr key={sup}>
                                <td className="fixed-col">{sup.toUpperCase()}</td>
                                {schedule.map(d => (
                                    <td key={d.dayIndex} style={{ backgroundColor: isEditMode ? 'transparent' : getStatusColor(d[sup] as DayStatus) }}>
                                        {isEditMode ? (
                                            <select
                                                value={d[sup] as string}
                                                onChange={(e) => handleStatusChange(d.dayIndex, sup, e.target.value)}
                                                className="status-select"
                                                style={{ backgroundColor: getStatusColor(d[sup] as DayStatus) }}
                                            >
                                                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        ) : (
                                            getStatusLabel(d[sup] as DayStatus)
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
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
