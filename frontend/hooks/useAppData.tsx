import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo } from 'react';
import { Role, User, Apartment, TaskType, Assignment, AssignmentStatus, CheckIn, ApartmentSize, WorkOrder, WorkOrderStatus } from '../types';
import { getTodayDateString } from '../lib/utils';

// MOCK DATA
const initialRoles: Role[] = [
  { id: 1, name: 'Supervisor' },
  { id: 2, name: 'Encargado' },
  { id: 3, name: 'Mucama' },
  { id: 4, name: 'Recepción' },
  { id: 5, name: 'Mantenimiento' },
];

const initialUsers: User[] = [
  { id: 1, employeeId: '001', name: 'Admin Supervisor', roleIds: [1], username: 'super', password: 'super' },
  { id: 2, employeeId: '102', name: 'Juan Pérez', roleIds: [2], username: 'jperez', password: 'password123' },
  { id: 3, employeeId: '203', name: 'Ana Gómez', roleIds: [3, 4], username: 'agomez', password: 'password123', dailyMinutes: 480 },
  { id: 4, employeeId: '204', name: 'Luisa Martinez', roleIds: [3], username: 'lmartinez', password: 'password123', dailyMinutes: 360 },
  { id: 5, employeeId: '305', name: 'Carlos Rodriguez', roleIds: [4], username: 'crodriguez', password: 'password123' },
  { id: 6, employeeId: '206', name: 'Sofía López', roleIds: [3], username: 'slopez', password: 'password123', dailyMinutes: 480 },
  { id: 7, employeeId: '407', name: 'Mario Bross', roleIds: [5], username: 'mario', password: 'password123' },
];

const initialApartments: Apartment[] = [
  { id: 101, name: '0101', size: ApartmentSize.CHICO, squareMeters: 50, bedrooms: 1, bathrooms: 1, cleaningTimeMinutes: 60, servicesSuspended: false },
  { id: 102, name: '0102', size: ApartmentSize.GRANDE, squareMeters: 90, bedrooms: 3, bathrooms: 2, cleaningTimeMinutes: 120, servicesSuspended: false },
  { id: 201, name: '0201', size: ApartmentSize.MEDIANO, squareMeters: 65, bedrooms: 2, bathrooms: 1, cleaningTimeMinutes: 75, servicesSuspended: true },
  { id: 202, name: '0202', size: ApartmentSize.CHICO, squareMeters: 55, bedrooms: 1, bathrooms: 1, cleaningTimeMinutes: 65, servicesSuspended: false },
];

const initialTaskTypes: TaskType[] = [
  { id: 1, code: 'SL', description: 'Salida y Limpieza' },
  { id: 2, code: 'SV', description: 'Servicio' },
  { id: 3, code: 'LG', description: 'Lavado General' },
];

const initialAssignments: Assignment[] = [];

const initialCheckIns: CheckIn[] = [
  { id: 1, apartmentId: 201, guestFirstName: 'Familia', guestLastName: 'García', guestDocument: '12345678A', checkInDate: '2023-10-20', checkOutDate: '2023-10-26', details: '2 adultos, 1 niño.' },
];

const initialWorkOrders: WorkOrder[] = [];

const getInitialState = () => ({
  users: initialUsers,
  roles: initialRoles,
  apartments: initialApartments,
  taskTypes: initialTaskTypes,
  assignments: initialAssignments,
  checkIns: initialCheckIns,
  workOrders: initialWorkOrders,
  buildingName: 'Edificio Michelangelo',
});


interface AppContextType {
  currentUser: User | null;
  activeRole: Role | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  setActiveRole: (roleId: number) => void;
  users: User[];
  roles: Role[];
  apartments: Apartment[];
  taskTypes: TaskType[];
  assignments: Assignment[];
  checkIns: CheckIn[];
  workOrders: WorkOrder[];
  buildingName: string;
  updateBuildingName: (newName: string) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: number) => void;
  addRole: (role: Omit<Role, 'id'>) => void;
  updateRole: (role: Role) => void;
  deleteRole: (roleId: number) => boolean;
  addApartment: (apartment: Omit<Apartment, 'id'>) => void;
  updateApartment: (apartment: Apartment) => void;
  deleteApartment: (apartmentId: number) => void;
  addTaskType: (taskType: Omit<TaskType, 'id'>) => void;
  updateTaskType: (taskType: TaskType) => void;
  deleteTaskType: (taskTypeId: number) => void;
  addAssignment: (assignment: Omit<Assignment, 'id' | 'status' | 'completedTasks' | 'observations'>) => void;
  updateAssignmentStatus: (assignmentId: number, status: AssignmentStatus) => void;
  reassignTask: (assignmentId: number, employeeIds: number[]) => void;
  completeAssignment: (assignmentId: number, taskIds: number[], observations: string) => void;
  addCheckIn: (checkIn: Omit<CheckIn, 'id'>) => void;
  updateCheckIn: (checkIn: CheckIn) => void;
  deleteCheckIn: (checkInId: number) => void;
  addWorkOrder: (workOrder: Omit<WorkOrder, 'id' | 'status'>) => void;
  updateWorkOrderWorkDone: (workOrderId: number, completionDate: string, materialsUsed: string) => void;
  updateWorkOrderApproval: (workOrderId: number, approvalName: string, approvalDate: string) => void;
  deleteWorkOrder: (workOrderId: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState(getInitialState());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeRole, setActiveRoleState] = useState<Role | null>(null);
  
  const setActiveRole = useCallback((roleId: number) => {
    const role = data.roles.find(r => r.id === roleId);
    if (role && currentUser?.roleIds.includes(roleId)) {
        setActiveRoleState(role);
    }
  }, [data.roles, currentUser]);


  const login = useCallback((username: string, password: string): boolean => {
    const user = data.users.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      if (user.roleIds.length === 1) {
        setActiveRole(user.roleIds[0]);
      } else {
        setActiveRoleState(null); // Await role selection from UI
      }
      return true;
    }
    return false;
  }, [data.users, setActiveRole]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setActiveRoleState(null);
  }, []);

  const updateBuildingName = useCallback((newName: string) => {
    setData(prev => ({ ...prev, buildingName: newName }));
  }, []);

  const addUser = useCallback((user: Omit<User, 'id'>) => {
    if (data.users.some(u => u.employeeId === user.employeeId)) {
        alert('Error: El ID de Empleado ya existe.');
        return;
    }
    setData(prev => ({ ...prev, users: [...prev.users, { ...user, id: Date.now() }] }));
  }, [data.users]);
  
  const updateUser = useCallback((updatedUser: User) => {
    if (data.users.some(u => u.employeeId === updatedUser.employeeId && u.id !== updatedUser.id)) {
        alert('Error: El ID de Empleado ya existe.');
        return;
    }
    setData(prev => ({...prev, users: prev.users.map(u => u.id === updatedUser.id ? updatedUser : u)}));
  },[data.users]);

  const deleteUser = useCallback((userId: number) => {
    setData(prev => ({...prev, users: prev.users.filter(u => u.id !== userId)}));
  },[]);
  
  const addRole = useCallback((role: Omit<Role, 'id'>) => {
    setData(prev => ({...prev, roles: [...prev.roles, {...role, id: Date.now()}]}));
  }, []);

  const updateRole = useCallback((updatedRole: Role) => {
    setData(prev => ({...prev, roles: prev.roles.map(r => r.id === updatedRole.id ? updatedRole : r)}));
  }, []);

  const deleteRole = useCallback((roleId: number) => {
    const isRoleInUse = data.users.some(u => u.roleIds.includes(roleId));
    if (isRoleInUse) {
      alert('No se puede eliminar el rol porque está asignado a uno o más usuarios.');
      return false;
    }
    setData(prev => ({...prev, roles: prev.roles.filter(r => r.id !== roleId)}));
    return true;
  }, [data.users]);


  const addApartment = useCallback((apartment: Omit<Apartment, 'id'>) => {
    setData(prev => ({...prev, apartments: [...prev.apartments, { ...apartment, id: Date.now() }]}));
  },[]);
  
  const updateApartment = useCallback((updatedApartment: Apartment) => {
    setData(prev => ({...prev, apartments: prev.apartments.map(a => a.id === updatedApartment.id ? updatedApartment : a)}));
  },[]);
  
  const deleteApartment = useCallback((apartmentId: number) => {
     if (data.assignments.some(a => a.apartmentId === apartmentId) || data.checkIns.some(c => c.apartmentId === apartmentId)) {
        alert('No se puede eliminar el apartamento porque tiene asignaciones o check-ins históricos.');
        return;
    }
    setData(prev => ({...prev, apartments: prev.apartments.filter(a => a.id !== apartmentId)}));
  },[data.assignments, data.checkIns]);
  
  const addTaskType = useCallback((taskType: Omit<TaskType, 'id'>) => {
    setData(prev => ({...prev, taskTypes: [...prev.taskTypes, { ...taskType, id: Date.now() }]}));
  },[]);
  
  const updateTaskType = useCallback((updatedTaskType: TaskType) => {
    setData(prev => ({...prev, taskTypes: prev.taskTypes.map(t => t.id === updatedTaskType.id ? updatedTaskType : t)}));
  },[]);
  
  const deleteTaskType = useCallback((taskTypeId: number) => {
    setData(prev => ({...prev, taskTypes: prev.taskTypes.filter(t => t.id !== taskTypeId)}));
  },[]);

  const addAssignment = useCallback((assignment: Omit<Assignment, 'id' | 'status' | 'completedTasks' | 'observations'>) => {
    const newAssignment: Assignment = {
      ...assignment,
      id: Date.now(),
      status: AssignmentStatus.PENDIENTE,
      completedTasks: [],
      observations: '',
    };
    setData(prev => ({ ...prev, assignments: [...prev.assignments, newAssignment] }));
  }, []);

  const updateAssignmentStatus = useCallback((assignmentId: number, status: AssignmentStatus) => {
    setData(prev => ({
      ...prev,
      assignments: prev.assignments.map(a => a.id === assignmentId ? { ...a, status } : a)
    }));
  }, []);

  const reassignTask = useCallback((assignmentId: number, employeeIds: number[]) => {
    setData(prev => ({
      ...prev,
      assignments: prev.assignments.map(a => a.id === assignmentId ? { ...a, employeeIds } : a)
    }));
  }, []);
  
  const completeAssignment = useCallback((assignmentId: number, taskIds: number[], observations: string) => {
    setData(prev => ({
      ...prev,
      assignments: prev.assignments.map(a => a.id === assignmentId ? { ...a, status: AssignmentStatus.COMPLETADA, completedTasks: taskIds, observations } : a)
    }));
  }, []);

  const addCheckIn = useCallback((checkIn: Omit<CheckIn, 'id'>) => {
    const newCheckIn: CheckIn = { ...checkIn, id: Date.now() };
    setData(prev => ({ ...prev, checkIns: [...prev.checkIns, newCheckIn] }));
  }, []);

  const updateCheckIn = useCallback((updatedCheckIn: CheckIn) => {
    setData(prev => ({
        ...prev,
        checkIns: prev.checkIns.map(ci => ci.id === updatedCheckIn.id ? updatedCheckIn : ci)
    }));
  }, []);

  const deleteCheckIn = useCallback((checkInId: number) => {
    if (window.confirm('¿Está seguro que desea eliminar este registro de check-in? Esta acción es irreversible.')) {
        setData(prevData => ({
            ...prevData,
            checkIns: prevData.checkIns.filter(ci => ci.id !== checkInId)
        }));
    }
  }, []);

  const addWorkOrder = useCallback((workOrder: Omit<WorkOrder, 'id' | 'status'>) => {
    const newWorkOrder: WorkOrder = {
        ...workOrder,
        id: Date.now(),
        status: WorkOrderStatus.SOLICITADO,
    };
    setData(prev => ({ ...prev, workOrders: [...prev.workOrders, newWorkOrder] }));
  }, []);

  const updateWorkOrderWorkDone = useCallback((workOrderId: number, completionDate: string, materialsUsed: string) => {
      setData(prev => ({
          ...prev,
          workOrders: prev.workOrders.map(wo => 
              wo.id === workOrderId 
                  ? { ...wo, status: WorkOrderStatus.REALIZADO, completionDate, materialsUsed } 
                  : wo
          )
      }));
  }, []);

  const updateWorkOrderApproval = useCallback((workOrderId: number, approvalName: string, approvalDate: string) => {
      setData(prev => ({
          ...prev,
          workOrders: prev.workOrders.map(wo => 
              wo.id === workOrderId 
                  ? { ...wo, status: WorkOrderStatus.CONFORME, approvalName, approvalDate } 
                  : wo
          )
      }));
  }, []);

  const deleteWorkOrder = useCallback((workOrderId: number) => {
      if (window.confirm('¿Está seguro que desea eliminar esta orden de trabajo?')) {
          setData(prev => ({
              ...prev,
              workOrders: prev.workOrders.filter(wo => wo.id !== workOrderId)
          }));
      }
  }, []);
  
  const value = useMemo(() => ({
    ...data,
    currentUser,
    activeRole,
    login,
    logout,
    setActiveRole,
    addUser,
    updateUser,
    deleteUser,
    addRole,
    updateRole,
    deleteRole,
    addApartment,
    updateApartment,
    deleteApartment,
    addTaskType,
    updateTaskType,
    deleteTaskType,
    addAssignment,
    updateAssignmentStatus,
    reassignTask,
    completeAssignment,
    addCheckIn,
    updateCheckIn,
    deleteCheckIn,
    addWorkOrder,
    updateWorkOrderWorkDone,
    updateWorkOrderApproval,
    deleteWorkOrder,
    updateBuildingName,
  }), [data, currentUser, activeRole, login, logout, setActiveRole, addUser, updateUser, deleteUser, addRole, updateRole, deleteRole, addApartment, updateApartment, deleteApartment, addTaskType, updateTaskType, deleteTaskType, addAssignment, updateAssignmentStatus, reassignTask, completeAssignment, addCheckIn, updateCheckIn, deleteCheckIn, addWorkOrder, updateWorkOrderWorkDone, updateWorkOrderApproval, deleteWorkOrder, updateBuildingName]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppData = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};
