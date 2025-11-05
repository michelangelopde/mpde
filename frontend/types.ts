export enum ApartmentSize {
  CHICO = "Chico",
  MEDIANO = "Mediano",
  GRANDE = "Grande",
  PH = "PH",
}

export interface Role {
  id: number;
  name: string;
}

export interface User {
  id: number;
  employeeId: string;
  name: string;
  username: string;
  password: string;
  roleIds: number[];
  dailyMinutes?: number;
}

export interface Apartment {
  id: number;
  name: string;
  size: ApartmentSize;
  squareMeters: number;
  bedrooms: number;
  bathrooms: number;
  cleaningTimeMinutes: number;
  servicesSuspended: boolean;
}

export interface TaskType {
  id: number;
  code: string;
  description: string;
}

export enum AssignmentStatus {
  PENDIENTE = "Pendiente",
  COMPLETADA = "Completada",
  VERIFICADA = "Verificada",
}

export interface Assignment {
  id: number;
  apartmentId: number;
  employeeIds: number[];
  date: string; // YYYY-MM-DD
  notes: string;
  status: AssignmentStatus;
  shared: boolean;
  completedTasks: number[];
  observations: string;
}

export interface CheckIn {
  id: number;
  apartmentId: number;
  guestFirstName: string;
  guestLastName: string;
  guestDocument: string;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  details: string;
  vehicleRegistration?: string;
}

export enum RequestMedium {
  TELEFONO = "Teléfono",
  CORREO = "Correo",
  PRESENCIAL = "Presencial",
}

export enum WorkOrderStatus {
  SOLICITADO = "Solicitado",
  REALIZADO = "Realizado",
  CONFORME = "Conforme",
}

export interface WorkOrder {
  id: number;
  apartmentId: number;
  requestDate: string; // YYYY-MM-DD
  requesterName: string;
  requestDetails: string;
  requestMedium: RequestMedium;
  status: WorkOrderStatus;
  completionDate?: string; // YYYY-MM-DD
  materialsUsed?: string;
  approvalName?: string;
  approvalDate?: string; // YYYY-MM-DD
}