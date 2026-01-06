
import React from 'react';
import type { ScheduleParams } from '../utils/scheduleGenerator';
import './ConfigForm.css';

interface ConfigFormProps {
    config: ScheduleParams;
    onConfigChange: (newConfig: ScheduleParams) => void;
    onGenerate: () => void;
}

export const ConfigForm: React.FC<ConfigFormProps> = ({ config, onConfigChange, onGenerate }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        onConfigChange({
            ...config,
            [name]: parseInt(value) || 0
        });
    };

    return (
        <div className="config-form">
            <h2>Configuración del Régimen</h2>
            <div className="form-group">
                <label>Días de Trabajo (N):</label>
                <input
                    type="number"
                    name="workDays"
                    value={config.workDays}
                    onChange={handleChange}
                    min="1"
                />
            </div>
            <div className="form-group">
                <label>Días de Descanso (M):</label>
                <input
                    type="number"
                    name="restDays"
                    value={config.restDays}
                    onChange={handleChange}
                    min="1"
                />
            </div>
            <div className="form-group">
                <label>Días de Inducción (I):</label>
                <input
                    type="number"
                    name="inductionDays"
                    value={config.inductionDays}
                    onChange={handleChange}
                    min="0"
                    max="5"
                />
            </div>
            <div className="form-group">
                <label>Total Días a Proyectar:</label>
                <input
                    type="number"
                    name="totalDays"
                    value={config.totalDays}
                    onChange={handleChange}
                    min="30"
                />
            </div>
            <button className="generate-btn" onClick={onGenerate}>
                Calcular Cronograma
            </button>
        </div>
    );
};
