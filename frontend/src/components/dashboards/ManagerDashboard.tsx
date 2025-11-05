import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAppData } from '../../hooks/useAppData';
import { Assignment, AssignmentStatus, Apartment, User, ApartmentSize } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { TabButton } from '../common/TabButton';
import { ClipboardDocumentListIcon, DocumentChartBarIcon, CheckCircleIcon, RefreshIcon, BuildingOfficeIcon, PlusIcon, PencilIcon, TrashIcon, UserGroupIcon, CalendarDaysIcon, Cog6ToothIcon, WrenchScrewdriverIcon } from '../icons';
import { getTodayDateString, formatDateShort, formatMinutesToHoursAndMinutes } from '../../lib/utils';
import { MaintenanceDashboard } from './MaintenanceDashboard';
import { LogbookView } from './LogbookView';

type MainManagerTab = 'mucamas' | 'checkin' | 'mantenimiento' | 'bitacora' | 'config';

export const ManagerDashboard: React.FC = () => {
    const [activeMainTab, setActiveMainTab] = useState<MainManagerTab>('mucamas');

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold text-stone-800 mb-6">Panel del Encargado</h1>
            <div className="border-b border-stone-200 mb-6">
                <div className="flex flex-wrap space-x-8">
                    <TabButton isActive={activeMainTab === 'mucamas'} onClick={() => setActiveMainTab('mucamas')}>
                        <ClipboardDocumentListIcon className="w-5 h-5"/>
                        Mucamas
                    </TabButton>
                    <TabButton isActive={activeMainTab === 'checkin'} onClick={() => setActiveMainTab('checkin')}>
                        <CalendarDaysIcon className="w-5 h-5" />
                        Recepcion
                    </TabButton>
                    <TabButton isActive={activeMainTab === 'mantenimiento'} onClick={() => setActiveMainTab('mantenimiento')}>
                        <WrenchScrewdriverIcon className="w-5 h-5" />
                        Mantenimiento
                    </TabButton>
                    <TabButton isActive={activeMainTab === 'bitacora'} onClick={() => setActiveMainTab('bitacora')}>
                        <ClipboardDocumentListIcon className="w-5 h-5" />
                        Bitácora
                    </TabButton>
                    <TabButton isActive={activeMainTab === 'config'} onClick={() => setActiveMainTab('config')}>
                        <Cog6ToothIcon className="w-5 h-5" />
                        Configuración
                    </TabButton>
                </div>
            </div>
            <div>
                {activeMainTab === 'mucamas' && <MucamasTab />}
                {activeMainTab === 'checkin' && <CheckInHistoryTab />}
                {activeMainTab === 'mantenimiento' && <MaintenanceDashboard isEmbedded />}
                {activeMainTab === 'bitacora' && <LogbookView />}
                {activeMainTab === 'config' && <ConfigTab />}
            </div>
        </div>
    );
};

// Sub-navigation for Tareas de Mucamas
type MucamasSubTab = 'tablero' | 'assign' | 'reports' | 'workReport';

const MucamasTab: React.FC = () => {
    const [activeSubTab, setActiveSubTab] = useState<MucamasSubTab>('tablero');
    return (
        <div>
            <div className="border-b border-stone-200 mb-6">
                <div className="flex flex-wrap space-x-8">
                    <TabButton isActive={activeSubTab === 'tablero'} onClick={() => setActiveSubTab('tablero')}>
                        <DocumentChartBarIcon className="w-5 h-5"/>
                        Tablero Tareas
                    </TabButton>
                    <TabButton isActive={activeSubTab === 'assign'} onClick={() => setActiveSubTab('assign')}>
                        <ClipboardDocumentListIcon className="w-5 h-5"/>
                        Asignar Tareas
                    </TabButton>
                    <TabButton isActive={activeSubTab === 'reports'} onClick={() => setActiveSubTab('reports')}>
                        <DocumentChartBarIcon className="w-5 h-5"/>
                        Reporte Tareas
                    </TabButton>
                    <TabButton isActive={activeSubTab === 'workReport'} onClick={() => setActiveSubTab('workReport')}>
                        <DocumentChartBarIcon className="w-5 h-5"/>
                        Informe de Trabajo
                    </TabButton>
                </div>
            </div>
            <div>
                {activeSubTab === 'tablero' && <DashboardTab />}
                {activeSubTab === 'assign' && <AssignTaskTab />}
                {activeSubTab === 'reports' && <ReportsTab />}
                {activeSubTab === 'workReport' && <WorkReportTab />}
            </div>
        </div>
    );
};

const WorkReportTab: React.FC = () => {
    const { assignments, users, apartments, roles } = useAppData();
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [filterEmployeeId, setFilterEmployeeId] = useState('');

    const mucamas = useMemo(() => {
        const mucamaRole = roles.find(r => r.name === 'Mucama');
        if (!mucamaRole) return [];
        return users.filter(u => u.roleIds.includes(mucamaRole.id));
    }, [users, roles]);

    const reportData = useMemo(() => {
        const relevantAssignments = assignments.filter(a => {
            if (a.status === AssignmentStatus.PENDIENTE) return false;
            if (filterStartDate && a.date < filterStartDate) return false;
            if (filterEndDate && a.date > filterEndDate) return false;
            if (filterEmployeeId && !a.employeeIds.includes(Number(filterEmployeeId))) return false;
            return true;
        });

        const dataByMucama: { [key: number]: { name: string, counts: { [key in ApartmentSize]: number }, totalMinutes: number } } = {};

        for (const mucama of mucamas) {
            if (filterEmployeeId && mucama.id !== Number(filterEmployeeId)) {
                continue;
            }

            dataByMucama[mucama.id] = {
                name: mucama.name,
                counts: {
                    [ApartmentSize.CHICO]: 0,
                    [ApartmentSize.MEDIANO]: 0,
                    [ApartmentSize.GRANDE]: 0,
                    [ApartmentSize.PH]: 0,
                },
                totalMinutes: 0,
            };
        }

        for (const assignment of relevantAssignments) {
            const apartment = apartments.find(ap => ap.id === assignment.apartmentId);
            if (!apartment) continue;

            const creditDivisor = assignment.employeeIds.length || 1;
            const apartmentCountCredit = 1 / creditDivisor;
            const timeCredit = apartment.cleaningTimeMinutes / creditDivisor;

            for (const employeeId of assignment.employeeIds) {
                if (dataByMucama[employeeId]) {
                    dataByMucama[employeeId].counts[apartment.size] += apartmentCountCredit;
                    dataByMucama[employeeId].totalMinutes += timeCredit;
                }
            }
        }

        return Object.values(dataByMucama)
            .filter(d => d.totalMinutes > 0)
            .map(data => {
                const totalApartments = Object.values(data.counts).reduce((sum, count) => sum + count, 0);
                return { ...data, totalApartments };
            });

    }, [assignments, users, apartments, roles, filterStartDate, filterEndDate, filterEmployeeId]);

    const handleExportToCSV = () => {
        if (reportData.length === 0) {
            alert('No hay datos para exportar.');
            return;
        }

        const headers = ["Mucama", "Chico", "Mediano", "Grande", "PH", "Total Apartamentos", "Total Horas"];

        const csvEscape = (field: string | number) => {
            const str = String(field);
            if (str.includes(';') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const rows = reportData.map(data => {
            const rowData = [
                data.name,
                data.counts[ApartmentSize.CHICO].toFixed(1),
                data.counts[ApartmentSize.MEDIANO].toFixed(1),
                data.counts[ApartmentSize.GRANDE].toFixed(1),
                data.counts[ApartmentSize.PH].toFixed(1),
                data.totalApartments.toFixed(1),
                formatMinutesToHoursAndMinutes(Math.round(data.totalMinutes))
            ];
            return rowData.map(csvEscape).join(';');
        });

        const csvString = [headers.join(';'), ...rows].join('\n');
        const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `informe-trabajo-${getTodayDateString()}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };


    const filterInputStyles = "rounded-md border-amber-300 sm:text-sm bg-amber-50 text-black";

    return (
        <Card title="Informe de Trabajo Comparativo">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-md mb-6 bg-stone-50">
                 <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className={filterInputStyles} placeholder="Fecha Desde"/>
                 <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className={filterInputStyles} placeholder="Fecha Hasta"/>
                 <select value={filterEmployeeId} onChange={e => setFilterEmployeeId(e.target.value)} className={filterInputStyles}>
                    <option value="">Todas las Mucamas</option>
                    {mucamas.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mucama</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Chico</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Mediano</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Grande</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">PH</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Horas</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                         {reportData.map((data, index) => (
                            <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{data.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">{data.counts[ApartmentSize.CHICO].toFixed(1)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">{data.counts[ApartmentSize.MEDIANO].toFixed(1)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">{data.counts[ApartmentSize.GRANDE].toFixed(1)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">{data.counts[ApartmentSize.PH].toFixed(1)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-gray-700">{data.totalApartments.toFixed(1)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-amber-600">{formatMinutesToHoursAndMinutes(Math.round(data.totalMinutes))}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {reportData.length === 0 && (
                    <div className="text-center py-10 text-stone-500">
                        <p>No hay datos de trabajos terminados para los filtros seleccionados.</p>
                    </div>
                )}
            </div>
            <div className="flex justify-end mt-6">
                <Button variant="success" onClick={handleExportToCSV}>Exportar a Excel</Button>
            </div>
        </Card>
    )
};


// Sub-navigation for Configuración
type ConfigSubTab = 'apartments' | 'employees';

const ConfigTab: React.FC = () => {
    const [activeSubTab, setActiveSubTab] = useState<ConfigSubTab>('apartments');

    return (
        <div>
             <div className="border-b border-stone-200 mb-6">
                <div className="flex flex-wrap space-x-8">
                    <TabButton isActive={activeSubTab === 'apartments'} onClick={() => setActiveSubTab('apartments')}>
                        <BuildingOfficeIcon className="w-5 h-5" />
                        Apartamentos
                    </TabButton>
                    <TabButton isActive={activeSubTab === 'employees'} onClick={() => setActiveSubTab('employees')}>
                        <UserGroupIcon className="w-5 h-5" />
                        Empleados
                    </TabButton>
                </div>
            </div>
            <div>
                {activeSubTab === 'apartments' && <ApartmentsTab />}
                {activeSubTab === 'employees' && <EmployeesTab />}
            </div>
        </div>
    );
};


const DashboardTab: React.FC = () => {
    const { users, roles, assignments, apartments } = useAppData();
    const today = getTodayDateString();

    const employeeProgressData = useMemo(() => {
        const mucamaRole = roles.find(r => r.name === 'Mucama');
        if (!mucamaRole) return [];

        const mucamas = users.filter(u => u.roleIds.includes(mucamaRole.id));
        const todaysAssignments = assignments.filter(a => a.date === today);

        return mucamas.map(mucama => {
            const myAssignments = todaysAssignments.filter(a => a.employeeIds.includes(mucama.id));
            if (myAssignments.length === 0) return null;

            const completedTasks = myAssignments.filter(a => a.status !== AssignmentStatus.PENDIENTE);
            const pendingTasks = myAssignments.filter(a => a.status === AssignmentStatus.PENDIENTE);

            const getTaskTime = (task: Assignment) => apartments.find(ap => ap.id === task.apartmentId)?.cleaningTimeMinutes || 0;

            const completedTime = completedTasks.reduce((acc, task) => acc + getTaskTime(task), 0);
            const pendingTime = pendingTasks.reduce((acc, task) => acc + getTaskTime(task), 0);
            
            const totalTasks = myAssignments.length;
            const completedCount = completedTasks.length;
            const progressPercentage = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;
            
            const dailyMinutes = mucama.dailyMinutes || 0;
            const timeProgressPercentage = dailyMinutes > 0 ? (completedTime / dailyMinutes) * 100 : 0;

            return {
                employeeId: mucama.id,
                employeeName: mucama.name,
                completedCount,
                totalTasks,
                progressPercentage,
                completedTime,
                pendingTime,
                dailyMinutes,
                timeProgressPercentage,
            };
        }).filter(Boolean);

    }, [users, roles, assignments, apartments, today]);

    return (
        <Card title={`Progreso del Día - ${new Date(today).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC'})}`}>
            {employeeProgressData.length === 0 ? (
                <div className="text-center py-10 text-stone-500">
                    <p>No hay tareas asignadas para el día de hoy.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {employeeProgressData.map(data => data && (
                        <div key={data.employeeId}>
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="font-bold text-stone-800">{data.employeeName}</h3>
                                <span className="text-sm font-semibold text-stone-600">{data.completedCount}/{data.totalTasks} completadas</span>
                            </div>
                            <div className="w-full bg-stone-200 rounded-full h-4" title="Progreso de Tareas">
                                <div 
                                    className="bg-amber-600 h-4 rounded-full transition-all duration-500" 
                                    style={{ width: `${data.progressPercentage}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between items-center mt-2 text-sm text-stone-500">
                                <div>
                                    <span className="font-semibold text-amber-700">Completado:</span> {formatMinutesToHoursAndMinutes(data.completedTime)}
                                </div>
                                <div>
                                    <span className="font-semibold text-yellow-700">Pendiente:</span> {formatMinutesToHoursAndMinutes(data.pendingTime)}
                                </div>
                            </div>

                            {data.dailyMinutes > 0 && (
                                <div className="mt-4">
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className="text-sm font-semibold text-stone-700">Progreso Diario (Tiempo)</h4>
                                        <span className="text-sm text-stone-600">
                                            {formatMinutesToHoursAndMinutes(data.dailyMinutes - data.completedTime)} restantes
                                        </span>
                                    </div>
                                    <div className="w-full bg-stone-200 rounded-full h-4" title="Progreso de Tiempo">
                                        <div 
                                            className="bg-green-600 h-4 rounded-full transition-all duration-500" 
                                            style={{ width: `${data.timeProgressPercentage}%` }}
                                        ></div>
                                    </div>
                                    <div className="text-right mt-1 text-xs text-stone-500">
                                        {formatMinutesToHoursAndMinutes(data.completedTime)} de {formatMinutesToHoursAndMinutes(data.dailyMinutes)}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};


const AssignTaskTab: React.FC = () => {
    const { apartments, users, roles, assignments, addAssignment, updateAssignmentStatus } = useAppData();
    const [apartmentId, setApartmentId] = useState<number | string>('');
    const [employeeIds, setEmployeeIds] = useState<number[]>([]);
    const [date, setDate] = useState(getTodayDateString());
    const [notes, setNotes] = useState('');
    const [isShared, setIsShared] = useState(false);
    const [reassigningAssignment, setReassigningAssignment] = useState<Assignment | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const availableApartments = useMemo(() => {
        const assignedApartmentIdsOnDate = new Set(
            assignments
                .filter(a => a.date === date)
                .map(a => a.apartmentId)
        );
        return apartments
            .filter(ap => !ap.servicesSuspended)
            .filter(ap => !assignedApartmentIdsOnDate.has(ap.id));
    }, [apartments, assignments, date]);

    useEffect(() => {
        if (apartmentId && !availableApartments.some(ap => ap.id === Number(apartmentId))) {
            setApartmentId('');
        }
    }, [availableApartments, apartmentId]);

    const employees = useMemo(() => {
        const mucamaRole = roles.find(r => r.name === 'Mucama');
        if (!mucamaRole) return [];
        return users.filter(u => u.roleIds.includes(mucamaRole.id));
    }, [users, roles]);

    const sortedAssignments = useMemo(() => [...assignments].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [assignments]);
    
    const inputStyles = "mt-1 block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm bg-amber-50 text-black placeholder-stone-500";


    const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const options = e.target.options;
        const value: number[] = [];
        for (let i = 0, l = options.length; i < l; i++) {
            if (options[i].selected) {
                value.push(Number(options[i].value));
            }
        }
        setEmployeeIds(value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!apartmentId || employeeIds.length === 0 || !date) {
            alert('Por favor, complete todos los campos.');
            return;
        }
        setIsSubmitting(true);
        await addAssignment({ apartmentId: Number(apartmentId), employeeIds, date, notes, shared: isShared });
        setIsSubmitting(false);
        // Reset form
        setApartmentId('');
        setEmployeeIds([]);
        setNotes('');
        setIsShared(false);
    };
    
    const getStatusChip = (status: AssignmentStatus) => {
        const classes = {
            [AssignmentStatus.PENDIENTE]: 'bg-yellow-100 text-yellow-800',
            [AssignmentStatus.COMPLETADA]: 'bg-stone-200 text-stone-800',
            [AssignmentStatus.VERIFICADA]: 'bg-green-100 text-green-800',
        };
        return <span className={`px-2 py-1 text-xs font-medium rounded-full ${classes[status]}`}>{status}</span>;
    };
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card title="Nueva Asignación" className="lg:col-span-1">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-700">Apartamento</label>
                        <select value={apartmentId} onChange={e => setApartmentId(e.target.value)} required className={inputStyles}>
                            <option value="" disabled>Seleccionar...</option>
                            {availableApartments.map(ap => <option key={ap.id} value={ap.id}>{ap.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-stone-700">Empleado(s)</label>
                        <select multiple={true} value={employeeIds.map(String)} onChange={handleEmployeeChange} required className={`${inputStyles} h-32`}>
                            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700">Fecha</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} required className={inputStyles} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700">Notas</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={inputStyles}></textarea>
                    </div>
                    <div className="flex items-center">
                        <input id="shared" type="checkbox" checked={isShared} onChange={e => setIsShared(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"/>
                        <label htmlFor="shared" className="ml-2 block text-sm text-stone-900">Tarea Compartida</label>
                    </div>
                    <div className="pt-2">
                         <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Asignando..." : "Asignar Tarea"}</Button>
                    </div>
                </form>
            </Card>
            <Card title="Lista de Asignaciones" className="lg:col-span-2">
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {sortedAssignments.map(a => {
                        const ap = apartments.find(ap => ap.id === a.apartmentId);
                        const emps = users.filter(u => a.employeeIds.includes(u.id));
                        return (
                            <div key={a.id} className="p-4 border rounded-lg bg-stone-50">
                                <div className="flex flex-wrap justify-between items-start">
                                    <div>
                                        <p className="font-bold text-amber-800">{ap?.name}</p>
                                        <p className="text-sm text-stone-600">{emps.map(e => e.name).join(', ')}</p>
                                        <p className="text-xs text-stone-500">{formatDateShort(a.date)}</p>
                                    </div>
                                    {getStatusChip(a.status)}
                                </div>
                                {a.notes && <p className="text-sm mt-2 p-2 bg-yellow-50 rounded-md"><b>Nota Encargado:</b> {a.notes}</p>}
                                {a.observations && <p className="text-sm mt-2 p-2 bg-amber-50 rounded-md"><b>Observación Mucama:</b> {a.observations}</p>}
                                <div className="flex gap-2 justify-end mt-3">
                                {a.status === AssignmentStatus.PENDIENTE && (
                                    <Button size="sm" variant="secondary" onClick={() => setReassigningAssignment(a)}>
                                        <PencilIcon className="w-4 h-4" /> Reasignar
                                    </Button>
                                )}
                                {a.status !== AssignmentStatus.PENDIENTE && 
                                    <Button size="sm" variant="warning" onClick={()=> updateAssignmentStatus(a.id, AssignmentStatus.PENDIENTE)}>
                                        <RefreshIcon className="w-4 h-4" /> Reabrir
                                    </Button>
                                }
                                {a.status === AssignmentStatus.COMPLETADA && 
                                    <Button size="sm" variant="success" onClick={()=> updateAssignmentStatus(a.id, AssignmentStatus.VERIFICADA)}>
                                        <CheckCircleIcon className="w-5 h-5"/> Marcar OK
                                    </Button>
                                }
                                </div>
                            </div>
                        )
                    })}
                </div>
            </Card>
            {reassigningAssignment && (
                <ReassignModal
                    assignment={reassigningAssignment}
                    onClose={() => setReassigningAssignment(null)}
                />
            )}
        </div>
    );
};

interface ReassignModalProps {
    assignment: Assignment;
    onClose: () => void;
}

const ReassignModal: React.FC<ReassignModalProps> = ({ assignment, onClose }) => {
    const { users, roles, apartments, reassignTask } = useAppData();
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>(assignment.employeeIds);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const apartment = useMemo(() => apartments.find(ap => ap.id === assignment.apartmentId), [apartments, assignment.apartmentId]);

    const employees = useMemo(() => {
        const mucamaRole = roles.find(r => r.name === 'Mucama');
        if (!mucamaRole) return [];
        return users.filter(u => u.roleIds.includes(mucamaRole.id));
    }, [users, roles]);

    const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const options = e.target.options;
        const value: number[] = [];
        for (let i = 0, l = options.length; i < l; i++) {
            if (options[i].selected) {
                value.push(Number(options[i].value));
            }
        }
        setSelectedEmployeeIds(value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedEmployeeIds.length === 0) {
            alert('Debe seleccionar al menos un empleado.');
            return;
        }
        setIsSubmitting(true);
        if(reassignTask) {
            await reassignTask(assignment.id, selectedEmployeeIds);
        }
        setIsSubmitting(false);
        onClose();
    };
    
    const inputStyles = "mt-1 block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm bg-amber-50 text-black placeholder-stone-500";

    return (
        <Modal isOpen={true} onClose={onClose} title={`Reasignar Tarea: ${apartment?.name}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-stone-700">Seleccionar Nuevo(s) Empleado(s)</label>
                    <select 
                        multiple 
                        value={selectedEmployeeIds.map(String)} 
                        onChange={handleEmployeeChange} 
                        required 
                        className={`${inputStyles} h-40`}
                    >
                        {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando..." : "Guardar Cambios"}</Button>
                </div>
            </form>
        </Modal>
    );
};

const CheckInHistoryTab: React.FC = () => {
    const { checkIns, apartments, deleteCheckIn } = useAppData();
    const [filterApartmentId, setFilterApartmentId] = useState<string>('');
    const [filterStartDate, setFilterStartDate] = useState<string>('');
    const [filterEndDate, setFilterEndDate] = useState<string>('');

    const filteredCheckIns = useMemo(() => {
        return checkIns
            .filter(ci => filterApartmentId ? ci.apartmentId === Number(filterApartmentId) : true)
            .filter(ci => filterStartDate ? ci.checkInDate >= filterStartDate : true)
            .filter(ci => filterEndDate ? ci.checkInDate <= filterEndDate : true)
            .sort((a,b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime());
    }, [checkIns, filterApartmentId, filterStartDate, filterEndDate]);
    
    const handleExportToCSV = () => {
        if (filteredCheckIns.length === 0) {
            alert('No hay datos para exportar.');
            return;
        }
    
        const headers = ["Apartamento", "Huésped", "Documento", "Check In", "Check Out", "Matrícula", "Detalles"];
    
        const csvEscape = (field: string | number) => {
            const str = String(field);
            if (str.includes(';') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };
    
        const rows = filteredCheckIns.map(ci => {
            const ap = apartments.find(ap => ap.id === ci.apartmentId);
            const guestFullName = `${ci.guestFirstName} ${ci.guestLastName}`;
            
            const rowData = [
                ap?.name ?? 'N/A',
                guestFullName,
                ci.guestDocument,
                formatDateShort(ci.checkInDate),
                formatDateShort(ci.checkOutDate),
                ci.vehicleRegistration || '',
                ci.details
            ];
            return rowData.map(csvEscape).join(';');
        });
        
        const csvString = [headers.join(';'), ...rows].join('\n');
        const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `reporte-check-ins-${getTodayDateString()}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };
    
    const filterInputStyles = "rounded-md border-amber-300 sm:text-sm bg-amber-50 text-black";

    return (
        <Card title="Historial de Check-Ins">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-md mb-6 bg-stone-50">
                <select value={filterApartmentId} onChange={e => setFilterApartmentId(e.target.value)} className={filterInputStyles}>
                    <option value="">Todos los Apartamentos</option>
                    {apartments.map(ap => <option key={ap.id} value={ap.id}>{ap.name}</option>)}
                </select>
                <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className={filterInputStyles}/>
                <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className={filterInputStyles}/>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Apto.</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Huésped</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matrícula</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detalles</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredCheckIns.map(ci => {
                            const ap = apartments.find(ap => ap.id === ci.apartmentId);
                            return (
                                <tr key={ci.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ap?.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ci.guestFirstName} {ci.guestLastName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ci.guestDocument}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateShort(ci.checkInDate)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateShort(ci.checkOutDate)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ci.vehicleRegistration || '-'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 break-words max-w-xs">{ci.details || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => deleteCheckIn(ci.id)}
                                            aria-label="Eliminar check-in"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                 {filteredCheckIns.length === 0 && (
                    <div className="text-center py-10 text-stone-500">
                        <p>No hay registros de check-in que coincidan con los filtros seleccionados.</p>
                    </div>
                )}
            </div>
            <div className="flex justify-end mt-6">
                <Button variant="success" onClick={handleExportToCSV}>Exportar a Excel</Button>
            </div>
        </Card>
    );
};


const ReportsTab: React.FC = () => {
    const { assignments, users, apartments, taskTypes, roles } = useAppData();
    const [filterEmployeeId, setFilterEmployeeId] = useState<string>('');
    const [filterApartmentId, setFilterApartmentId] = useState<string>('');
    const [filterStartDate, setFilterStartDate] = useState<string>('');
    const [filterEndDate, setFilterEndDate] = useState<string>('');

    const mucamaRoleId = useMemo(() => roles.find(r => r.name === 'Mucama')?.id, [roles]);

    const filteredAssignments = useMemo(() => {
        return assignments
            .filter(a => filterEmployeeId ? a.employeeIds.includes(Number(filterEmployeeId)) : true)
            .filter(a => filterApartmentId ? a.apartmentId === Number(filterApartmentId) : true)
            .filter(a => filterStartDate ? a.date >= filterStartDate : true)
            .filter(a => filterEndDate ? a.date <= filterEndDate : true)
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [assignments, filterEmployeeId, filterApartmentId, filterStartDate, filterEndDate]);

    const getCompletedTasksString = (taskIds: number[]): string => {
        return taskIds.map(id => taskTypes.find(t => t.id === id)?.code || '').join(', ');
    }
    
    const handleExportToCSV = () => {
        if (filteredAssignments.length === 0) {
            alert('No hay datos para exportar.');
            return;
        }
    
        const headers = [
            "Fecha",
            "Apartamento",
            "Empleado(s)",
            "Minutos",
            "Tareas Completadas",
            "Observaciones",
            "Estado"
        ];
    
        const csvEscape = (field: string | number) => {
            const str = String(field);
            if (str.includes(';') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };
    
        const rows = filteredAssignments.map(a => {
            const ap = apartments.find(ap => ap.id === a.apartmentId);
            const emps = users.filter(u => a.employeeIds.includes(u.id));
            const managerNote = a.notes ? `Enc: ${a.notes}` : '';
            const employeeObservation = a.observations ? `Muc: ${a.observations}` : '';
            const combinedObs = [managerNote, employeeObservation].filter(Boolean).join(' / ');
    
            const rowData = [
                formatDateShort(a.date),
                ap?.name ?? 'N/A',
                emps.map(e => e.name).join(', '),
                ap?.cleaningTimeMinutes ?? 0,
                getCompletedTasksString(a.completedTasks),
                combinedObs,
                a.status
            ];
            return rowData.map(csvEscape).join(';');
        });
        
        const csvString = [headers.join(';'), ...rows].join('\n');
        const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `reporte-tareas-${getTodayDateString()}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };
    
    const filterInputStyles = "rounded-md border-amber-300 sm:text-sm bg-amber-50 text-black";

    return (
        <Card title="Reportes de Tareas">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-md mb-6 bg-stone-50">
                <select value={filterEmployeeId} onChange={e => setFilterEmployeeId(e.target.value)} className={filterInputStyles}>
                    <option value="">Todos los Empleados</option>
                    {users.filter(u => mucamaRoleId && u.roleIds.includes(mucamaRoleId)).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <select value={filterApartmentId} onChange={e => setFilterApartmentId(e.target.value)} className={filterInputStyles}>
                    <option value="">Todos los Apartamentos</option>
                    {apartments.map(ap => <option key={ap.id} value={ap.id}>{ap.name}</option>)}
                </select>
                <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className={filterInputStyles}/>
                <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className={filterInputStyles}/>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apartamento</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empleado(s)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Minutos</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tareas Completadas</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observaciones</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredAssignments.map(a => {
                            const ap = apartments.find(ap => ap.id === a.apartmentId);
                            const emps = users.filter(u => a.employeeIds.includes(u.id));
                            const managerNote = a.notes ? `Enc: ${a.notes}` : '';
                            const employeeObservation = a.observations ? `Muc: ${a.observations}` : '';
                            const combinedObs = [managerNote, employeeObservation].filter(Boolean).join(' / ');
                            return (
                                <tr key={a.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateShort(a.date)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ap?.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {emps.map(e => <div key={e.id}>{e.name}</div>)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ap?.cleaningTimeMinutes}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-amber-600">{getCompletedTasksString(a.completedTasks)}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 break-words max-w-xs">{combinedObs || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            a.status === AssignmentStatus.PENDIENTE 
                                                ? 'bg-yellow-100 text-yellow-800' 
                                                : 'bg-green-100 text-green-800'
                                        }`}>
                                            {a.status}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-end mt-6">
                <Button variant="success" onClick={handleExportToCSV}>Exportar a Excel</Button>
            </div>
        </Card>
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

// FIX: The component was truncated, causing a type error. Completed the component definition.
// Also made handlers async and added a submitting state.
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
