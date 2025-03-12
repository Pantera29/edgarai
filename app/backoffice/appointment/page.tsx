"use client"

import { useState } from 'react';
import AppointmentConfig from '../../../components/AppointmentConfig';
import CalendarView from '../../../components/CalendarView';

export default function Home() {
  const appointmentConfig = {
    appointmentDuration: 30, // Duración de la cita en minutos
    weekdaysStart: '09:00',  // Hora de inicio de lunes a viernes
    weekdaysEnd: '18:00',    // Hora de fin de lunes a viernes
    saturdayStart: '12:00',  // Hora de inicio para los sábados
    saturdayEnd: '15:00',    // Hora de fin para los sábados
  };
  

  const [config, setConfig] = useState(appointmentConfig);

    const handleConfigSave = () => {
        setConfig(appointmentConfig);
    };

  return (
    <div>
      <h1>Configuración de Reservas</h1>
      {!config ? (
        <AppointmentConfig onSave={handleConfigSave} />
      ) : (
        <>
          <h2>Calendario</h2>
          <CalendarView config={config} />
        </>
      )}
    </div>
  );
}
