"use client"
import { useState, useEffect } from 'react';

// Citas de ejemplo
const appointments = [
  {
    "id": "748bf434-d7c8-47bb-9cc3-081f8fa27c33",
    "created_at": "2025-03-04 12:42:47+00",
    "phone_number": "011111123123",
    "dealership_id": "6b58f82d-baa6-44ce-9941-1a61975d20b5",
    "appointment_date": "03/04/2025, 15:00",
    "is_booked": true
  },
  {
    "id": "748bf434-d7c8-47bb-9cc3-081f8fa27c34",
    "created_at": "2025-03-04 12:42:47+00",
    "phone_number": "011111123123",
    "dealership_id": "6b58f82d-baa6-44ce-9941-1a61975d20b5",
    "appointment_date": "03/05/2025, 13:00",
    "is_booked": true
  },
  {
    "id": "748bf434-d7c8-47bb-9cc3-081f8fa27c35",
    "created_at": "2025-03-04 12:42:47+00",
    "phone_number": "011111123123",
    "dealership_id": "6b58f82d-baa6-44ce-9941-1a61975d20b5",
    "appointment_date": "03/08/2025, 11:00",
    "is_booked": true
  }
];

// Configuración de horarios
const calendarConfig = {
  weekdaysStart: "09:00",
  weekdaysEnd: "18:00",
  saturdayStart: "12:00",
  saturdayEnd: "15:00",
};

const CalendarView = () => {
  const [calendarData, setCalendarData] = useState([]);

  // Generar las horas de la semana
  const generateCalendar = () => {
    const daysOfWeek = ['03/03', '03/04', '03/05', '03/06', '03/07', '03/08', '03/09'];
    const times = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

    // Creación de un objeto para cada día y hora
    const calendar = daysOfWeek.map(day => {
      const dayAppointments = appointments.filter(
        appt => appt.appointment_date.startsWith(day) && appt.is_booked
      );

      const hours = times.map(time => {
        // Verificar si la hora ya está reservada
        const isBooked = dayAppointments.some(
          appt => appt.appointment_date === `${day}, ${time}`
        );
        return { time, isBooked };
      });

      return { day, hours };
    });

    setCalendarData(calendar);
  };

  useEffect(() => {
    generateCalendar();
  }, []);

  return (
    <div>
      <h2>Calendario de Reservas</h2>
      <table border="1" style={{ textAlign: 'center', width: '100%' }}>
        <thead>
          <tr>
            <th>Hora</th>
            <th>03/03</th>
            <th>03/04</th>
            <th>03/05</th>
            <th>03/06</th>
            <th>03/07</th>
            <th>03/08</th>
            <th>03/09</th>
          </tr>
        </thead>
        <tbody>
          {calendarData.map((dayData) => (
            dayData.hours.map((hourData) => (
              <tr key={`${dayData.day}-${hourData.time}`}>
                {hourData.time === '09:00' && <td>{hourData.time}</td>}
                <td style={{ backgroundColor: hourData.isBooked ? 'lightblue' : 'lightgreen' }}>
                  {hourData.isBooked ? 'Ocupado' : 'Libre'}
                </td>
              </tr>
            ))
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CalendarView;
