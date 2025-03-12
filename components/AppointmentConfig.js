"use client"

import { useState } from 'react';

const AppointmentConfig = ({ onSave }) => {
  const [appointmentDuration, setAppointmentDuration] = useState(30); // en minutos
  const [weekdaysStart, setWeekdaysStart] = useState('09:00');
  const [weekdaysEnd, setWeekdaysEnd] = useState('18:00');
  const [saturdayStart, setSaturdayStart] = useState('12:00');
  const [saturdayEnd, setSaturdayEnd] = useState('15:00');

  const handleSubmit = () => {
    onSave({
      appointmentDuration,
      weekdaysStart,
      weekdaysEnd,
      saturdayStart,
      saturdayEnd,
    });
  };

  return (
    <div>
      <h2>Configuración de Reservas</h2>
      <div>
        <label>Duración de la cita (minutos):</label>
        <input
          type="number"
          value={appointmentDuration}
          onChange={(e) => setAppointmentDuration(e.target.value)}
        />
      </div>
      <div>
        <label>Hora primera y última reserva (lunes a viernes):</label>
        <input
          type="time"
          value={weekdaysStart}
          onChange={(e) => setWeekdaysStart(e.target.value)}
        />
        <input
          type="time"
          value={weekdaysEnd}
          onChange={(e) => setWeekdaysEnd(e.target.value)}
        />
      </div>
      <div>
        <label>Hora primera y última reserva (sábado):</label>
        <input
          type="time"
          value={saturdayStart}
          onChange={(e) => setSaturdayStart(e.target.value)}
        />
        <input
          type="time"
          value={saturdayEnd}
          onChange={(e) => setSaturdayEnd(e.target.value)}
        />
      </div>
      <button onClick={handleSubmit}>Guardar Configuración</button>
    </div>
  );
};

export default AppointmentConfig;
