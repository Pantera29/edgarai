import { WorkshopSchedule, ServiceBay, ServiceType, BlockedTime } from '@/types/workshop';

export const mockSchedules: WorkshopSchedule[] = [
  { id: '1', dayOfWeek: 1, openTime: '09:00', closeTime: '18:00', isActive: true },
  { id: '2', dayOfWeek: 2, openTime: '09:00', closeTime: '18:00', isActive: true },
  { id: '3', dayOfWeek: 3, openTime: '09:00', closeTime: '18:00', isActive: true },
  { id: '4', dayOfWeek: 4, openTime: '09:00', closeTime: '18:00', isActive: true },
  { id: '5', dayOfWeek: 5, openTime: '09:00', closeTime: '18:00', isActive: true },
  { id: '6', dayOfWeek: 6, openTime: '09:00', closeTime: '14:00', isActive: true },
  { id: '7', dayOfWeek: 0, openTime: '00:00', closeTime: '00:00', isActive: false },
];

export const mockServiceBays: ServiceBay[] = [
  {
    id: '1',
    name: 'Bahía 1',
    type: 'General',
    serviceTypeIds: [],
    isActive: true
  },
  {
    id: '2',
    name: 'Bahía 2',
    type: 'Especializada',
    serviceTypeIds: [],
    isActive: true
  }
];

export const mockServiceTypes: ServiceType[] = [
  {
    id: '1',
    name: 'Cambio de Aceite',
    standardDuration: 60,
    requiredSpecialties: ['Mecánica General']
  },
  {
    id: '2',
    name: 'Diagnóstico Electrónico',
    standardDuration: 120,
    requiredSpecialties: ['Electrónica']
  }
];

export const mockAppointments = [
  {
    // ... otros campos
    estado: 'pendiente',
  },
  {
    // ... otros campos
    estado: 'en_proceso',
  },
  // ... otros appointments
]; 