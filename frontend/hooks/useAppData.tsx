import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo, useEffect } from 'react';
import { Role, User, Apartment, TaskType, Assignment, AssignmentStatus, CheckIn, WorkOrder, LogbookEntry, PostIt, PostItComment, WorkOrderStatus } from '../types';

interface AppData {
  users: User[];
  roles: Role[];
  apartments: Apartment[];
  taskTypes: TaskType[];
  assignments: Assignment[];
  checkIns: CheckIn[];
  workOrders: WorkOrder[];
  logbookEntries: LogbookEntry[];
  postIts: PostIt[];
  buildingName: string;
}

interface AppContextType extends AppData {
  currentUser: User | null;
  activeRole: Role | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  setActiveRole: (roleId: number) => void;
  
  updateBuildingName: (newName: string) => Promise<void>;
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (userId: number) => Promise<void>;
  addRole: (role: Omit<Role, 'id'>) => Promise<void>;
  updateRole: (role: Role) => Promise<void>;
  deleteRole: (roleId: number) => Promise<boolean>;
  addApartment: (apartment: Omit<Apartment, 'id'>) => Promise<void>;
  updateApartment: (apartment: Apartment) => Promise<void>;
  deleteApartment: (apartmentId: number) => Promise<void>;
  addTaskType: (taskType: Omit<TaskType, 'id'>) => Promise<void>;
  updateTaskType: (taskType: TaskType) => Promise<void>;
  deleteTaskType: (taskTypeId: number) => Promise<void>;
  addAssignment: (assignment: Omit<Assignment, 'id' | 'status' | 'completedTasks' | 'observations'>) => Promise<void>;
  updateAssignmentStatus: (assignmentId: number, status: AssignmentStatus) => Promise<void>;
  reassignTask: (assignmentId: number, employeeIds: number[]) => Promise<void>;
  completeAssignment: (assignmentId: number, taskIds: number[], observations: string) => Promise<void>;
  addCheckIn: (checkIn: Omit<CheckIn, 'id'>) => Promise<void>;
  updateCheckIn: (checkIn: CheckIn) => Promise<void>;
  deleteCheckIn: (checkInId: number) => Promise<void>;
  addWorkOrder: (workOrder: Omit<WorkOrder, 'id' | 'status'>) => Promise<void>;
  updateWorkOrderWorkDone: (workOrderId: number, completionDate: string, materialsUsed: string) => Promise<void>;
  updateWorkOrderApproval: (workOrderId: number, approvalName: string, approvalDate: string) => Promise<void>;
  deleteWorkOrder: (workOrderId: number) => Promise<void>;
  addLogbookEntry: (entry: Omit<LogbookEntry, 'id' | 'date' | 'createdBy'>) => Promise<void>;
  updateLogbookEntry: (entry: LogbookEntry) => Promise<void>;
  deleteLogbookEntry: (entryId: number) => Promise<void>;
  addPostIt: (postItData: Omit<PostIt, 'id' | 'createdAt' | 'createdBy' | 'comments'>) => Promise<void>;
  deletePostIt: (postItId: number) => Promise<void>;
  addCommentToPostIt: (postItId: number, commentData: Omit<PostItComment, 'id' | 'createdAt' | 'createdBy'>) => Promise<void>;

  isLoading: boolean;
  error: string | null;
  reloadData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const apiRequest = async (url: string, options: RequestInit = {}) => {
    try {
        const response = await fetch(`/api${url}`, {
            headers: { 'Content-Type': 'application/json', ...options.headers },
            ...options
        });
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorBody.message || 'API request failed');
        }
        if (response.status === 204) {
            return;
        }
        return response.json();
    } catch (err) {
        console.error(`API Error on ${options.method || 'GET'} ${url}:`, err);
        throw err;
    }
};

export const AppDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeRole, setActiveRoleState] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reloadData = useCallback(async () => {
      try {
          setIsLoading(true);
          const freshData = await apiRequest('/data');
          setData(freshData);
          setError(null);
      } catch (e) {
          setError(e instanceof Error ? e.message : 'Failed to fetch data');
      } finally {
          setIsLoading(false);
      }
  }, []);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  const setActiveRole = useCallback((roleId: number) => {
    const role = data?.roles.find(r => r.id === roleId);
    if (role && currentUser?.roleIds.includes(roleId)) {
        setActiveRoleState(role);
    }
  }, [data, currentUser]);


  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
        const user = await apiRequest('/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
        setCurrentUser(user);
        if (user.roleIds.length === 1 && data) {
            setActiveRole(user.roleIds[0]);
        } else {
            setActiveRoleState(null);
        }
        return true;
    } catch (e) {
        return false;
    }
  }, [data, setActiveRole]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setActiveRoleState(null);
  }, []);
  
  const createGenericHandler = <T extends { id: number }, U>(resource: keyof AppData, idField: keyof T = 'id') => ({
      add: async (item: U) => {
          await apiRequest(`/${resource}`, { method: 'POST', body: JSON.stringify(item) });
          await reloadData();
      },
      update: async (item: T) => {
          await apiRequest(`/${resource}/${item[idField]}`, { method: 'PUT', body: JSON.stringify(item) });
          await reloadData();
      },
      remove: async (id: number) => {
          await apiRequest(`/${resource}/${id}`, { method: 'DELETE' });
          await reloadData();
      },
  });

  const usersHandler = createGenericHandler<User, Omit<User, 'id'>>('users');
  const rolesHandler = createGenericHandler<Role, Omit<Role, 'id'>>('roles');
  const apartmentsHandler = createGenericHandler<Apartment, Omit<Apartment, 'id'>>('apartments');
  const taskTypesHandler = createGenericHandler<TaskType, Omit<TaskType, 'id'>>('taskTypes');
  const assignmentsHandler = createGenericHandler<Assignment, Omit<Assignment, 'id'>>('assignments');
  const checkInsHandler = createGenericHandler<CheckIn, Omit<CheckIn, 'id'>>('checkIns');
  const workOrdersHandler = createGenericHandler<WorkOrder, Omit<WorkOrder, 'id'>>('workOrders');
  const logbookHandler = createGenericHandler<LogbookEntry, Omit<LogbookEntry, 'id'>>('logbookEntries');
  const postItsHandler = createGenericHandler<PostIt, Omit<PostIt, 'id'>>('postIts');

  const updateBuildingName = async (name: string) => {
      await apiRequest('/buildingName', { method: 'PUT', body: JSON.stringify({ name }) });
      await reloadData();
  };
  
  const deleteRole = async (roleId: number) => {
    if (data?.users.some((u: User) => u.roleIds.includes(roleId))) {
      alert('No se puede eliminar el rol porque está asignado a uno o más usuarios.');
      return false;
    }
    await rolesHandler.remove(roleId);
    return true;
  };

  const deleteApartment = async (apartmentId: number) => {
    if (data?.assignments.some((a: Assignment) => a.apartmentId === apartmentId) || data?.checkIns.some((c: CheckIn) => c.apartmentId === apartmentId)) {
        alert('No se puede eliminar el apartamento porque tiene asignaciones o check-ins históricos.');
        return;
    }
    await apartmentsHandler.remove(apartmentId);
  };
  
  const addAssignment = async (assignment: Omit<Assignment, 'id'|'status'|'completedTasks'|'observations'>) => {
    await assignmentsHandler.add({ ...assignment, status: AssignmentStatus.PENDIENTE, completedTasks: [], observations: '' });
  };
  
  const updateAssignment = async (id: number, updates: Partial<Assignment>) => {
    const assignment = data?.assignments.find((a: Assignment) => a.id === id);
    if (assignment) {
        await assignmentsHandler.update({ ...assignment, ...updates });
    }
  };

  const addWorkOrder = async (workOrder: Omit<WorkOrder, 'id' | 'status'>) => {
    await workOrdersHandler.add({ ...workOrder, status: WorkOrderStatus.SOLICITADO });
  };
  
  const updateWorkOrder = async (id: number, updates: Partial<WorkOrder>) => {
      const workOrder = data?.workOrders.find((wo: WorkOrder) => wo.id === id);
      if(workOrder) {
          await workOrdersHandler.update({ ...workOrder, ...updates });
      }
  };
  
  const addLogbookEntry = async (entry: Omit<LogbookEntry, 'id' | 'date' | 'createdBy'>) => {
      if(currentUser) {
          await logbookHandler.add({ ...entry, date: new Date().toISOString(), createdBy: currentUser.id });
      }
  };

  const updateLogbookEntry = async (entry: LogbookEntry) => {
      await logbookHandler.update({ ...entry, date: new Date().toISOString() });
  };
  
  const addPostIt = async (postItData: Omit<PostIt, 'id' | 'createdAt' | 'createdBy' | 'comments'>) => {
      if(currentUser) {
          await postItsHandler.add({ ...postItData, createdAt: new Date().toISOString(), createdBy: currentUser.id, comments: [] });
      }
  };

  const addCommentToPostIt = async (postItId: number, commentData: Omit<PostItComment, 'id' | 'createdAt' | 'createdBy'>) => {
      if(currentUser) {
          await apiRequest(`/postIts/${postItId}/comments`, { method: 'POST', body: JSON.stringify({ ...commentData, createdBy: currentUser.id }) });
          await reloadData();
      }
  };


  const value = useMemo(() => ({
    ...(data || { users: [], roles: [], apartments: [], taskTypes: [], assignments: [], checkIns: [], workOrders: [], logbookEntries: [], postIts: [], buildingName: '' }),
    currentUser,
    activeRole,
    login,
    logout,
    setActiveRole,
    addUser: usersHandler.add,
    updateUser: usersHandler.update,
    deleteUser: usersHandler.remove,
    addRole: rolesHandler.add,
    updateRole: rolesHandler.update,
    deleteRole,
    addApartment: apartmentsHandler.add,
    updateApartment: apartmentsHandler.update,
    deleteApartment,
    addTaskType: taskTypesHandler.add,
    updateTaskType: taskTypesHandler.update,
    deleteTaskType: taskTypesHandler.remove,
    addAssignment,
    updateAssignmentStatus: (id: number, status: AssignmentStatus) => updateAssignment(id, { status }),
    reassignTask: (id: number, employeeIds: number[]) => updateAssignment(id, { employeeIds }),
    completeAssignment: (id: number, completedTasks: number[], observations: string) => updateAssignment(id, { status: AssignmentStatus.COMPLETADA, completedTasks, observations }),
    addCheckIn: checkInsHandler.add,
    updateCheckIn: checkInsHandler.update,
    deleteCheckIn: checkInsHandler.remove,
    addWorkOrder,
    updateWorkOrderWorkDone: (id: number, completionDate: string, materialsUsed: string) => updateWorkOrder(id, { status: WorkOrderStatus.REALIZADO, completionDate, materialsUsed }),
    updateWorkOrderApproval: (id: number, approvalName: string, approvalDate: string) => updateWorkOrder(id, { status: WorkOrderStatus.CONFORME, approvalName, approvalDate }),
    deleteWorkOrder: workOrdersHandler.remove,
    addLogbookEntry,
    updateLogbookEntry,
    deleteLogbookEntry: logbookHandler.remove,
    addPostIt,
    deletePostIt: postItsHandler.remove,
    addCommentToPostIt,
    updateBuildingName,
    isLoading,
    error,
    reloadData,
  }), [data, currentUser, activeRole, isLoading, error, login, logout, setActiveRole, reloadData]);

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
