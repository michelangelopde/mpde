import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAppData } from '../../hooks/useAppData';
import { TabButton } from '../common/TabButton';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Role, User, TaskType, Apartment, ApartmentSize } from '../../types';
import { UserGroupIcon, Cog6ToothIcon, PencilIcon, TrashIcon, PlusIcon, BuildingOfficeIcon } from '../icons';
import { formatMinutesToHoursAndMinutes } from '../../lib/utils';

type SupervisorTab = 'employees' | 'apartments' | 'config';

export const SupervisorDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<SupervisorTab>('employees');

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                 <h1 className="text-3xl font-bold text-stone-800">Panel del Supervisor</h1>
                 <div className="border-b md:border-b-0 border-stone-200 mt-4 md:mt-0">
                    <div className="flex space-x-4">
                        <TabButton isActive={activeTab === 'employees'} onClick={() => setActiveTab('employees')}>
                            <UserGroupIcon className="w-5 h-5"/>
                            Empleados
                        </TabButton>
                        <TabButton isActive={activeTab === 'apartments'} onClick={() => setActiveTab('apartments')}>
                            <BuildingOfficeIcon className="w-5 h-5"/>
                            Apartamentos
                        </TabButton>
                        <TabButton isActive={activeTab === 'config'} onClick={() => setActiveTab('config')}>
                            <Cog6ToothIcon className="w-5 h-5"/>
                            Configuración
                        </TabButton>
                    </div>
                </div>
            </div>
            
            <div>
                {activeTab === 'employees' && <EmployeesTab />}
                {activeTab === 'apartments' && <ApartmentsTab />}
                {activeTab === 'config' && <ConfigTab />}
            </div>
        </div>
    );
};

const EmployeesTab: React.FC = () => {
    const { users, roles } = useAppData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const managedUsers = useMemo(() => {
        const supervisorRole = roles.find(r => r.name === 'Supervisor');
        return users.filter(u => supervisorRole && !u.roleIds.includes(supervisorRole.id));
    }, [users, roles]);

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };
    
    return (
        <>
        <Card title="Gestionar Empleados">
            <div className="flex justify-end mb-4">
                <Button onClick={handleAddNew}><PlusIcon className="w-5 h-5"/>Añadir Empleado</Button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Empleado</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roles</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Minutos Diarios</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {managedUsers.map(user => {
                            const userRoles = roles.filter(r => user.roleIds.includes(r.id)).map(r => r.name).join(', ');
                            return(
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.employeeId}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.username}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{userRoles || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                     {user.dailyMinutes ? formatMinutesToHoursAndMinutes(user.dailyMinutes) : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <Button variant="secondary" size="sm" onClick={() => handleEdit(user)}><PencilIcon className="w-4 h-4"/></Button>
                                </td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>
        </Card>
        {isModalOpen && <UserFormModal user={editingUser} onClose={() => setIsModalOpen(false)} />}
        </>
    );
};

const UserFormModal: React.FC<{ user: User | null; onClose: () => void; }> = ({ user, onClose }) => {
    const { addUser, updateUser, users, roles, deleteUser } = useAppData();
    const [name, setName] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [roleIds, setRoleIds] = useState<number[]>([]);
    const [dailyMinutes, setDailyMinutes] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const mucamaRoleId = useMemo(() => roles.find(r => r.name === 'Mucama')?.id, [roles]);
    const isMucama = useMemo(() => mucamaRoleId !== undefined && roleIds.includes(mucamaRoleId), [roleIds, mucamaRoleId]);

    useEffect(() => {
        if(user){
            setName(user.name);
            setEmployeeId(user.employeeId);
            setUsername(user.username);
            setRoleIds(user.roleIds);
            setDailyMinutes(String(user.dailyMinutes || ''));
            setPassword(''); // Don't pre-fill password
        } else {
            // Reset form for new user
            setName('');
            setEmployeeId('');
            setUsername('');
            setRoleIds(mucamaRoleId ? [mucamaRoleId] : []);
            setDailyMinutes('');
            setPassword('');
        }
    }, [user, roles, mucamaRoleId]);

    const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const options = e.target.options;
        const value: number[] = [];
        for (let i = 0, l = options.length; i < l; i++) {
            if (options[i].selected) {
                value.push(Number(options[i].value));
            }
        }
        setRoleIds(value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!/^\d+$/.test(employeeId)) {
            setError('El ID de Empleado debe ser un valor numérico.');
            return;
        }

        const isUsernameTaken = users.some(u => u.username === username && u.id !== user?.id);
        if (isUsernameTaken) {
            setError('Este nombre de usuario ya está en uso.');
            return;
        }

        if (!user && !password) {
            setError('La clave es obligatoria para nuevos usuarios.');
            return;
        }
        
        if (roleIds.length === 0) {
            setError('Debe seleccionar al menos un rol.');
            return;
        }

        const dailyMinutesValue = isMucama && dailyMinutes ? parseInt(dailyMinutes, 10) : undefined;
        if (isMucama && dailyMinutes && (isNaN(dailyMinutesValue as number) || (dailyMinutesValue as number) < 0)) {
            setError('Los minutos diarios deben ser un número válido.');
            return;
        }
        
        setIsSubmitting(true);
        if(user) {
            const updatedUserData: User = { 
                ...user, 
                employeeId,
                name, 
                username, 
                roleIds,
                password: password ? password : user.password,
                dailyMinutes: dailyMinutesValue
            };
            await updateUser(updatedUserData);
        } else {
            await addUser({ employeeId, name, username, password, roleIds, dailyMinutes: dailyMinutesValue });
        }
        setIsSubmitting(false);
        onClose();
    };
    
    const handleDelete = useCallback(async () => {
        if (user && window.confirm('¿Está seguro de que desea eliminar este usuario? Esta acción es irreversible.')) {
            setIsSubmitting(true);
            await deleteUser(user.id);
            setIsSubmitting(false);
            onClose();
        }
    }, [user, deleteUser, onClose]);

    const inputStyles = "mt-1 block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm bg-amber-50 text-black placeholder-stone-500";
    const supervisorRole = useMemo(() => roles.find(r => r.name === 'Supervisor'), [roles]);

    return (
        <Modal isOpen={true} onClose={onClose} title={user ? 'Editar Empleado' : 'Añadir Empleado'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="text-sm text-red-600 bg-red-100 p-2 rounded-md">{error}</p>}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-700">ID Empleado</label>
                        <input type="text" value={employeeId} onChange={e => setEmployeeId(e.target.value)} required pattern="\d+" title="Ingrese solo números" className={inputStyles} />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-stone-700">Nombre Completo</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required className={inputStyles} />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-700">Nombre de Usuario</label>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className={inputStyles} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700">Clave</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={user ? 'Dejar en blanco para no cambiar' : ''} required={!user} className={inputStyles} />
                    </div>
                </div>

                 <div>
                    <label className="block text-sm font-medium text-stone-700">Roles</label>
                    <select multiple value={roleIds.map(String)} onChange={handleRoleChange} required className={`${inputStyles} h-24`}>
                        {roles.filter(r => r.id !== supervisorRole?.id).map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                    </select>
                </div>

                {isMucama && (
                     <div>
                        <label className="block text-sm font-medium text-stone-700">Minutos Diarios de Dedicación</label>
                        <input type="number" value={dailyMinutes} onChange={e => setDailyMinutes(e.target.value)} placeholder="Ej: 480 (para 8hs)" className={inputStyles} />
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                    {user && (
                        <Button type="button" variant="danger" onClick={handleDelete} className="mr-auto" disabled={isSubmitting}>
                            <TrashIcon className="w-5 h-5"/>
                            <span className="ml-2">Eliminar</span>
                        </Button>
                    )}
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando..." : (user ? 'Guardar Cambios' : 'Crear Usuario')}</Button>
                </div>
            </form>
        </Modal>
    )
}

const GeneralSettings: React.FC = () => {
    const { buildingName, updateBuildingName } = useAppData();
    const [name, setName] = useState(buildingName);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            setIsSubmitting(true);
            await updateBuildingName(name.trim());
            setIsSubmitting(false);
            alert('Nombre del edificio actualizado.');
        } else {
            alert('El nombre no puede estar vacío.');
        }
    };

    return (
        <Card title="Configuración General">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="buildingName" className="block text-sm font-medium text-stone-700">Nombre del Edificio</label>
                    <input
                        id="buildingName"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm bg-amber-50 text-black placeholder-stone-500"
                        required
                    />
                </div>
                <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando..." : "Guardar Cambios"}</Button>
                </div>
            </form>
        </Card>
    );
};


const ConfigTab: React.FC = () => {
    return (
        <div className="space-y-6">
            <GeneralSettings />
            <TaskTypeManager />
            <RoleManager />
        </div>
    )
};

const TaskTypeManager: React.FC = () => {
    const { taskTypes, deleteTaskType } = useAppData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTaskType, setEditingTaskType] = useState<TaskType | null>(null);

    const handleEdit = (tt: TaskType) => {
        setEditingTaskType(tt);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingTaskType(null);
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        if(window.confirm('¿Seguro que quieres eliminar este tipo de tarea?')) {
            deleteTaskType(id);
        }
    };

    return (
        <>
            <Card title="Gestionar Tipos de Tarea">
                <div className="flex justify-end mb-4">
                    <Button onClick={handleAddNew}><PlusIcon className="w-5 h-5"/>Añadir Tipo de Tarea</Button>
                </div>
                <ul className="space-y-2">
                    {taskTypes.map(tt => (
                        <li key={tt.id} className="flex justify-between items-center p-2 border rounded-md bg-stone-50">
                            <div>
                                <span className="font-bold text-amber-700">{tt.code}</span> - <span>{tt.description}</span>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="secondary" onClick={() => handleEdit(tt)}><PencilIcon className="w-4 h-4"/></Button>
                                <Button size="sm" variant="danger" onClick={() => handleDelete(tt.id)}><TrashIcon className="w-4 h-4"/></Button>
                            </div>
                        </li>
                    ))}
                </ul>
            </Card>
            {isModalOpen && <TaskTypeFormModal taskType={editingTaskType} onClose={() => setIsModalOpen(false)} />}
        </>
    );
};

const TaskTypeFormModal: React.FC<{ taskType: TaskType | null; onClose: () => void; }> = ({ taskType, onClose }) => {
    const { addTaskType, updateTaskType } = useAppData();
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if(taskType) {
            setCode(taskType.code);
            setDescription(taskType.description);
        }
    }, [taskType]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!code || !description) {
            alert('Ambos campos son requeridos.');
            return;
        }
        setIsSubmitting(true);
        if(taskType) {
            await updateTaskType({ ...taskType, code, description });
        } else {
            await addTaskType({ code, description });
        }
        setIsSubmitting(false);
        onClose();
    };

    const inputStyles = "mt-1 block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm bg-amber-50 text-black";

    return (
        <Modal isOpen={true} onClose={onClose} title={taskType ? 'Editar Tipo de Tarea' : 'Nuevo Tipo de Tarea'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-stone-700">Código</label>
                    <input type="text" value={code} onChange={e => setCode(e.target.value)} required className={inputStyles} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-stone-700">Descripción</label>
                    <input type="text" value={description} onChange={e => setDescription(e.target.value)} required className={inputStyles} />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando..." : (taskType ? 'Guardar Cambios' : 'Crear')}</Button>
                </div>
            </form>
        </Modal>
    );
};

const RoleManager: React.FC = () => {
    const { roles, deleteRole } = useAppData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);

    const handleEdit = (role: Role) => {
        setEditingRole(role);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingRole(null);
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        if(window.confirm('¿Seguro que quieres eliminar este rol? No podrás hacerlo si hay usuarios asignados a él.')) {
            deleteRole(id);
        }
    };

    const supervisorRole = useMemo(() => roles.find(r => r.name === 'Supervisor'), [roles]);

    return (
        <>
            <Card title="Gestionar Roles">
                <div className="flex justify-end mb-4">
                    <Button onClick={handleAddNew}><PlusIcon className="w-5 h-5"/>Añadir Rol</Button>
                </div>
                <ul className="space-y-2">
                    {roles.map(role => (
                        <li key={role.id} className="flex justify-between items-center p-2 border rounded-md bg-stone-50">
                           <span>{role.name}</span>
                           {role.id !== supervisorRole?.id && (
                             <div className="flex gap-2">
                                <Button size="sm" variant="secondary" onClick={() => handleEdit(role)}><PencilIcon className="w-4 h-4"/></Button>
                                <Button size="sm" variant="danger" onClick={() => handleDelete(role.id)}><TrashIcon className="w-4 h-4"/></Button>
                            </div>
                           )}
                        </li>
                    ))}
                </ul>
            </Card>
            {isModalOpen && <RoleFormModal role={editingRole} onClose={() => setIsModalOpen(false)} />}
        </>
    )
};

const RoleFormModal: React.FC<{ role: Role | null; onClose: () => void; }> = ({ role, onClose }) => {
    const { addRole, updateRole, roles } = useAppData();
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if(role) setName(role.name);
    }, [role]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if(!name) {
            setError('El nombre es requerido.');
            return;
        }
        const isNameTaken = roles.some(r => r.name.toLowerCase() === name.toLowerCase() && r.id !== role?.id);
        if(isNameTaken) {
            setError('Ya existe un rol con este nombre.');
            return;
        }

        setIsSubmitting(true);
        if(role) {
            await updateRole({ ...role, name });
        } else {
            await addRole({ name });
        }
        setIsSubmitting(false);
        onClose();
    };

    const inputStyles = "mt-1 block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm bg-amber-50 text-black";

    return (
        <Modal isOpen={true} onClose={onClose} title={role ? 'Editar Rol' : 'Nuevo Rol'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="text-sm text-red-600 bg-red-100 p-2 rounded-md">{error}</p>}
                <div>
                    <label className="block text-sm font-medium text-stone-700">Nombre del Rol</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required className={inputStyles} />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando..." : (role ? 'Guardar Cambios' : 'Crear')}</Button>
                </div>
            </form>
        </Modal>
    );
};

const ApartmentsTab: React.FC = () => {
    const { apartments } = useAppData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingApartment, setEditingApartment] = useState<Apartment | null>(null);

    const handleEdit = (apartment: Apartment) => {
        setEditingApartment(apartment);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingApartment(null);
        setIsModalOpen(true);
    };

    return (
        <>
            <Card title="Gestionar Apartamentos">
                <div className="flex justify-end mb-4">
                    <Button onClick={handleAddNew}><PlusIcon className="w-5 h-5"/>Añadir Apartamento</Button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unidad</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tamaño</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">m²</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dorms</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Baños</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Minutos Limp.</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {apartments.map(apartment => (
                                <tr key={apartment.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{apartment.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{apartment.size}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{apartment.squareMeters}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{apartment.bedrooms}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{apartment.bathrooms}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{apartment.cleaningTimeMinutes}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {apartment.servicesSuspended ? (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                Suspendido
                                            </span>
                                        ) : (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                Activo
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Button variant="secondary" size="sm" onClick={() => handleEdit(apartment)}><PencilIcon className="w-4 h-4"/></Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
            {isModalOpen && <ApartmentFormModal apartment={editingApartment} onClose={() => setIsModalOpen(false)} />}
        </>
    );
};

const ApartmentFormModal: React.FC<{ apartment: Apartment | null; onClose: () => void; }> = ({ apartment, onClose }) => {
    const { addApartment, updateApartment, deleteApartment } = useAppData();
    const [formData, setFormData] = useState({
        name: '',
        size: ApartmentSize.CHICO,
        squareMeters: '',
        bedrooms: '',
        bathrooms: '',
        cleaningTimeMinutes: '',
        servicesSuspended: false,
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (apartment) {
            setFormData({
                name: apartment.name,
                size: apartment.size,
                squareMeters: String(apartment.squareMeters),
                bedrooms: String(apartment.bedrooms),
                bathrooms: String(apartment.bathrooms),
                cleaningTimeMinutes: String(apartment.cleaningTimeMinutes),
                servicesSuspended: apartment.servicesSuspended,
            });
        } else {
            // Reset form
            setFormData({
                name: '', size: ApartmentSize.CHICO, squareMeters: '', bedrooms: '', bathrooms: '', cleaningTimeMinutes: '', servicesSuspended: false,
            });
        }
    }, [apartment]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const numericData = {
            squareMeters: Number(formData.squareMeters),
            bedrooms: Number(formData.bedrooms),
            bathrooms: Number(formData.bathrooms),
            cleaningTimeMinutes: Number(formData.cleaningTimeMinutes),
        };

        if (!/^\d{4}$/.test(formData.name)) {
            setError('La Unidad debe ser un número de 4 dígitos.');
            return;
        }

        if (Object.values(numericData).some(val => isNaN(val) || val <= 0)) {
            setError('Por favor, complete todos los campos numéricos con valores válidos y positivos.');
            return;
        }

        const apartmentData = {
            name: formData.name,
            size: formData.size,
            ...numericData,
            servicesSuspended: formData.servicesSuspended,
        };

        setIsSubmitting(true);
        if (apartment) {
            await updateApartment({ ...apartment, ...apartmentData });
        } else {
            await addApartment(apartmentData as Omit<Apartment, 'id'>);
        }
        setIsSubmitting(false);
        onClose();
    };

    const handleDelete = async () => {
        if (apartment) {
            setIsSubmitting(true);
            await deleteApartment(apartment.id);
            setIsSubmitting(false);
            onClose();
        }
    };
    
    const inputStyles = "mt-1 block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm bg-amber-50 text-black placeholder-stone-500";

    return (
        <Modal isOpen={true} onClose={onClose} title={apartment ? 'Editar Apartamento' : 'Añadir Apartamento'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="text-sm text-red-600 bg-red-100 p-2 rounded-md">{error}</p>}
                
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-700">Unidad</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className={inputStyles}
                            maxLength={4}
                            pattern="\d{4}"
                            title="La unidad debe ser un número de 4 dígitos."
                            inputMode="numeric"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-stone-700">Tamaño</label>
                        <select
                            name="size"
                            value={formData.size}
                            onChange={handleChange}
                            required
                            className={inputStyles}
                        >
                            {Object.values(ApartmentSize).map(size => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-700">Metros Cuadrados (m²)</label>
                        <input type="number" name="squareMeters" value={formData.squareMeters} onChange={handleChange} required className={inputStyles} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700">Minutos de Limpieza</label>
                        <input type="number" name="cleaningTimeMinutes" value={formData.cleaningTimeMinutes} onChange={handleChange} required className={inputStyles} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-700">Dormitorios</label>
                        <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} required className={inputStyles} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700">Baños</label>
                        <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} required className={inputStyles} />
                    </div>
                </div>

                <div className="flex items-center pt-2">
                    <input id="servicesSuspended" name="servicesSuspended" type="checkbox" checked={formData.servicesSuspended} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"/>
                    <label htmlFor="servicesSuspended" className="ml-2 block text-sm text-stone-900">Servicios suspendidos</label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                     {apartment && (
                        <Button type="button" variant="danger" onClick={handleDelete} className="mr-auto" disabled={isSubmitting}>
                            <TrashIcon className="w-5 h-5"/> Eliminar
                        </Button>
                    )}
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando..." : (apartment ? 'Guardar Cambios' : 'Crear Apartamento')}</Button>
                </div>
            </form>
        </Modal>
    );
};