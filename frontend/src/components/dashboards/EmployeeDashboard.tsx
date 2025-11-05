import React, { useState, useMemo } from 'react';
import { useAppData } from '../../hooks/useAppData';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { CheckIcon } from '../icons';
import { Assignment, AssignmentStatus, Apartment } from '../../types';
import { getTodayDateString } from '../../lib/utils';

export const EmployeeDashboard: React.FC = () => {
    const { assignments, apartments, completeAssignment, currentUser } = useAppData();
    const [selectedDate, setSelectedDate] = useState(getTodayDateString());
    const today = getTodayDateString();

    const myTasks = useMemo(() => {
        if (!currentUser) return [];
        const tasks = assignments.filter(a =>
            a.employeeIds.includes(currentUser.id) &&
            a.date === selectedDate &&
            (a.status === AssignmentStatus.PENDIENTE || selectedDate === today)
        );

        return tasks.sort((a, b) => {
            const apartmentA = apartments.find(ap => ap.id === a.apartmentId);
            const apartmentB = apartments.find(ap => ap.id === b.apartmentId);
            if (apartmentA && apartmentB) {
                return parseInt(apartmentA.name, 10) - parseInt(apartmentB.name, 10);
            }
            return 0;
        });
    }, [assignments, currentUser, selectedDate, today, apartments]);

    if (!currentUser) {
        return <div className="p-4 text-center text-stone-500">No se ha podido identificar al usuario.</div>;
    }

    return (
        <div className="p-4 md:p-8 space-y-6">
            <Card>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-stone-800">Panel de Empleado: {currentUser.name}</h1>
                        <p className="text-stone-500">
                            Mostrando tareas para: {new Date(selectedDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'})}
                        </p>
                    </div>
                     <div className="flex items-center gap-2">
                         <label htmlFor="date-filter" className="text-sm font-medium">Ver otro día:</label>
                        <input
                            type="date"
                            id="date-filter"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="p-2 border border-stone-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm"
                        />
                    </div>
                </div>
            </Card>

            {myTasks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myTasks.map(task => (
                        <TaskCard key={task.id} task={task} isToday={selectedDate === today} />
                    ))}
                </div>
            ) : (
                <Card>
                    <div className="text-center py-12">
                        <CheckIcon className="mx-auto h-12 w-12 text-green-500" />
                        <h2 className="mt-2 text-lg font-medium text-stone-900">¡Todo listo!</h2>
                        <p className="mt-1 text-sm text-stone-500">No tienes tareas asignadas para la fecha seleccionada.</p>
                    </div>
                </Card>
            )}
        </div>
    );
};

interface TaskCardProps {
    task: Assignment;
    isToday: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, isToday }) => {
    const { apartments, taskTypes, completeAssignment } = useAppData();
    const [selectedTasks, setSelectedTasks] = useState<number[]>(task.completedTasks || []);
    const [observations, setObservations] = useState(task.observations || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const apartment = apartments.find(a => a.id === task.apartmentId);
    
    const isCompleted = task.status !== AssignmentStatus.PENDIENTE;
    const canCompleteTask = isToday && !isCompleted;

    const handleToggleTask = (taskId: number) => {
        if (!canCompleteTask) return;
        setSelectedTasks(prev => 
            prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
        );
    };

    const handleSubmit = async () => {
        if (selectedTasks.length === 0) {
            alert('Por favor, seleccione al menos un tipo de tarea completada.');
            return;
        }
        setIsSubmitting(true);
        await completeAssignment(task.id, selectedTasks, observations);
        setIsSubmitting(false);
    };

    if (!apartment) return null;

    return (
        <Card className={`flex flex-col ${isCompleted ? 'bg-green-50' : ''}`}>
            <div className="flex-grow space-y-4">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex-grow flex items-center flex-wrap gap-2">
                         <h3 className="font-bold text-lg text-amber-700 whitespace-nowrap">Apto {apartment.name}</h3>
                         {taskTypes.map(tt => (
                            <button
                                key={tt.id}
                                onClick={() => handleToggleTask(tt.id)}
                                disabled={!canCompleteTask}
                                className={`px-3 py-1 text-sm font-semibold rounded-full border-2 transition-colors ${
                                    selectedTasks.includes(tt.id)
                                        ? 'bg-amber-600 text-white border-amber-600'
                                        : 'bg-white text-stone-700 border-stone-300'
                                } ${canCompleteTask ? 'hover:bg-stone-50' : 'cursor-not-allowed opacity-70'}`}
                                title={tt.description}
                            >
                                {tt.code}
                            </button>
                        ))}
                    </div>
                    {canCompleteTask && (
                        <Button 
                            variant="success" 
                            onClick={handleSubmit} 
                            disabled={selectedTasks.length === 0 || isSubmitting}
                            className="!p-2 aspect-square shrink-0"
                            aria-label="Marcar como completada"
                        >
                           {isSubmitting ? '...' : <CheckIcon className="w-5 h-5" />}
                        </Button>
                    )}
                     {isCompleted && (
                        <div className="p-2 bg-green-200 rounded-full">
                            <CheckIcon className="w-5 h-5 text-green-700"/>
                        </div>
                    )}
                </div>
                
                <div className="text-xs text-stone-600 flex flex-wrap items-center gap-x-4 gap-y-1 p-2 bg-stone-50 rounded-md border border-stone-200">
                    <span>{apartment.bedrooms} dorms.</span>
                    <span className="w-px h-3 bg-stone-300"></span>
                    <span>{apartment.bathrooms} baños</span>
                    <span className="w-px h-3 bg-stone-300"></span>
                    <span>{apartment.squareMeters}m²</span>
                    {task.shared && 
                        <>
                            <span className="w-px h-3 bg-stone-300"></span>
                            <span className="font-semibold text-amber-800">Compartida</span>
                        </>
                    }
                </div>

                {task.notes && (
                    <p className="text-sm font-bold text-red-600">Notas: {task.notes}</p>
                )}
                
                <div>
                     <label htmlFor={`obs-${task.id}`} className="text-sm font-medium text-stone-700">Añadir Observaciones (Opcional):</label>
                     <textarea
                        id={`obs-${task.id}`}
                        rows={2}
                        value={observations}
                        onChange={(e) => setObservations(e.target.value)}
                        readOnly={!canCompleteTask}
                        className={`mt-1 block w-full text-sm rounded-md border-amber-300 shadow-sm focus:border-amber-300 focus:ring focus:ring-amber-200 focus:ring-opacity-50 text-black placeholder-stone-500 ${!canCompleteTask ? 'bg-stone-100' : 'bg-amber-50'}`}
                     />
                </div>
            </div>
        </Card>
    );
};
