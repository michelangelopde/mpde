import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { Role, User, Apartment, TaskType, Assignment, CheckIn, WorkOrder, LogbookEntry, PostIt, ApartmentSize } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'db.json');

const getInitialData = () => ({
  roles: [
    { id: 1, name: 'Supervisor' },
    { id: 2, name: 'Encargado' },
    { id: 3, name: 'Mucama' },
    { id: 4, name: 'Recepción' },
    { id: 5, name: 'Mantenimiento' },
  ],
  users: [
    { id: 1, employeeId: '001', name: 'Admin Supervisor', roleIds: [1], username: 'super', password: 'super' },
    { id: 2, employeeId: '102', name: 'Juan Pérez', roleIds: [2], username: 'jperez', password: 'password123' },
    { id: 3, employeeId: '203', name: 'Ana Gómez', roleIds: [3, 4], username: 'agomez', password: 'password123', dailyMinutes: 480 },
    { id: 4, employeeId: '204', name: 'Luisa Martinez', roleIds: [3], username: 'lmartinez', password: 'password123', dailyMinutes: 360 },
    { id: 5, employeeId: '305', name: 'Carlos Rodriguez', roleIds: [4], username: 'crodriguez', password: 'password123' },
    { id: 6, employeeId: '206', name: 'Sofía López', roleIds: [3], username: 'slopez', password: 'password123', dailyMinutes: 480 },
    { id: 7, employeeId: '407', name: 'Mario Bross', roleIds: [5], username: 'mario', password: 'password123' },
  ],
  apartments: [
    { id: 101, name: '0101', size: ApartmentSize.CHICO, squareMeters: 50, bedrooms: 1, bathrooms: 1, cleaningTimeMinutes: 60, servicesSuspended: false },
    { id: 102, name: '0102', size: ApartmentSize.GRANDE, squareMeters: 90, bedrooms: 3, bathrooms: 2, cleaningTimeMinutes: 120, servicesSuspended: false },
    { id: 201, name: '0201', size: ApartmentSize.MEDIANO, squareMeters: 65, bedrooms: 2, bathrooms: 1, cleaningTimeMinutes: 75, servicesSuspended: true },
    { id: 202, name: '0202', size: ApartmentSize.CHICO, squareMeters: 55, bedrooms: 1, bathrooms: 1, cleaningTimeMinutes: 65, servicesSuspended: false },
  ],
  taskTypes: [
    { id: 1, code: 'SL', description: 'Salida y Limpieza' },
    { id: 2, code: 'SV', description: 'Servicio' },
    { id: 3, code: 'LG', description: 'Lavado General' },
  ],
  assignments: [] as Assignment[],
  checkIns: [
    { id: 1, apartmentId: 201, guestFirstName: 'Familia', guestLastName: 'García', guestDocument: '12345678A', checkInDate: '2023-10-20', checkOutDate: '2023-10-26', details: '2 adultos, 1 niño.' },
  ],
  workOrders: [] as WorkOrder[],
  logbookEntries: [] as LogbookEntry[],
  postIts: [] as PostIt[],
  buildingName: 'Edificio Michelangelo',
});

export type DbData = ReturnType<typeof getInitialData>;

export async function readDb(): Promise<DbData> {
  try {
    await fs.access(dbPath);
    const data = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.log("Database file not found, creating a new one with initial data.");
    const initialData = getInitialData();
    await writeDb(initialData);
    return initialData;
  }
}

export async function writeDb(data: DbData): Promise<void> {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}
