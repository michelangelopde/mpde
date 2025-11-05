import React, { useState, useMemo, useEffect } from 'react';
import { useAppData } from '../../hooks/useAppData';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { PlusIcon, WrenchScrewdriverIcon, PencilIcon, CheckCircleIcon, TrashIcon } from '../icons';
import { WorkOrder, WorkOrderStatus, RequestMedium } from '../../types';
import { getTodayDateString, formatDate } from '../../lib/utils';

interface MaintenanceDashboardProps {
    isEmbedded?: boolean;
}

// Main Dashboard Component
export const MaintenanceDashboard: React.FC<MaintenanceDashboardProps> = ({ isEmbedded = false }) => {
    const { workOrders, apartments } = useAppData();
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
    const [modalAction, setModalAction] = useState<'workDone' | 'approval' | null>(null);

    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [filterApartmentId, setFilterApartmentId] = useState('');
    const [filterStatus, setFilterStatus] = useState<WorkOrderStatus | ''>('');

    const filteredWorkOrders = useMemo(() => {
        const sorted = [...workOrders].sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
        
        return sorted.filter(wo => {
            if (filterStartDate && wo.requestDate < filterStartDate) return false;
            if (filterEndDate && wo.requestDate > filterEndDate) return false;
            if (filterApartmentId && wo.apartmentId !== Number(filterApartmentId)) return false;
            if (filterStatus && wo.status !== filterStatus) return false;
            return true;
        });
    }, [workOrders, filterStartDate, filterEndDate, filterApartmentId, filterStatus]);

    const handleOpenModal = (workOrder: WorkOrder, action: 'workDone' | 'approval') => {
        setSelectedWorkOrder(workOrder);
        setModalAction(action);
    };

    const handleCloseModal = () => {
        setSelectedWorkOrder(null);
        setModalAction(null);
    };

    const clearFilters = () => {
        setFilterStartDate('');
        setFilterEndDate('');
        setFilterApartmentId('');
        setFilterStatus('');
    };
    
    const inputStyles = "block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm";


    return (
        <div className={isEmbedded ? "space-y-6" : "p-4 md:p-8 space-y-6"}>
            <Card>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-stone-800 flex items-center gap-3">
                            <WrenchScrewdriverIcon className="w-8 h-8 text-amber-600" />
                            Panel de Mantenimiento - Órdenes de Trabajo
                        </h1>
                        <p className="text-stone-500">Gestione todas las solicitudes de mantenimiento.</p>
                    </div>
                    <Button onClick={() => setCreateModalOpen(true)}>
                        <PlusIcon className="w-5 h-5" />
                        Nueva Orden de Trabajo
                    </Button>
                </div>
                <div className="border-t border-stone-200 mt-4 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                        <div>
                            <label htmlFor="filterStartDate" className="block text-sm font-medium text-stone-700">Desde</label>
                            <input type="date" id="filterStartDate" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className={inputStyles} />
                        </div>
                         <div>
                            <label htmlFor="filterEndDate" className="block text-sm font-medium text-stone-700">Hasta</label>
                            <input type="date" id="filterEndDate" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className={inputStyles} min={filterStartDate} />
                        </div>
                         <div>
                            <label htmlFor="filterApartmentId" className="block text-sm font-medium text-stone-700">Apartamento</label>
                            <select id="filterApartmentId" value={filterApartmentId} onChange={e => setFilterApartmentId(e.target.value)} className={inputStyles}>
                                <option value="">Todos</option>
                                {apartments.map(ap => <option key={ap.id} value={ap.id}>{ap.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="filterStatus" className="block text-sm font-medium text-stone-700">Estado</label>
                            <select id="filterStatus" value={filterStatus} onChange={e => setFilterStatus(e.target.value as WorkOrderStatus | '')} className={inputStyles}>
                                <option value="">Todos</option>
                                {Object.values(WorkOrderStatus).map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>
                        <Button variant="secondary" onClick={clearFilters} className="w-full">
                            Limpiar Filtros
                        </Button>
                    </div>
                </div>
            </Card>

            {filteredWorkOrders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredWorkOrders.map(wo => (
                        <WorkOrderCard 
                            key={wo.id}
                            workOrder={wo}
                            apartmentName={apartments.find(a => a.id === wo.apartmentId)?.name || 'N/A'}
                            onWorkDoneClick={() => handleOpenModal(wo, 'workDone')}
                            onApprovalClick={() => handleOpenModal(wo, 'approval')}
                        />
                    ))}
                </div>
            ) : (
                 <Card>
                    <div className="text-center py-12 text-stone-500">
                        <p>No se encontraron órdenes de trabajo que coincidan con los filtros seleccionados.</p>
                    </div>
                </Card>
            )}

            {isCreateModalOpen && <WorkOrderFormModal onClose={() => setCreateModalOpen(false)} />}
            
            {selectedWorkOrder && modalAction === 'workDone' && (
                <WorkDoneFormModal workOrder={selectedWorkOrder} onClose={handleCloseModal} />
            )}

            {selectedWorkOrder && modalAction === 'approval' && (
                <ApprovalFormModal workOrder={selectedWorkOrder} onClose={handleCloseModal} />
            )}
        </div>
    );
};

// Work Order Card
interface WorkOrderCardProps {
    workOrder: WorkOrder;
    apartmentName: string;
    onWorkDoneClick: () => void;
    onApprovalClick: () => void;
}

const WorkOrderCard: React.FC<WorkOrderCardProps> = ({ workOrder, apartmentName, onWorkDoneClick, onApprovalClick }) => {
    const { deleteWorkOrder } = useAppData();
    
    const statusInfo = {
        [WorkOrderStatus.SOLICITADO]: { text: 'Solicitado', bg: 'bg-yellow-100', text_color: 'text-yellow-800' },
        [WorkOrderStatus.REALIZADO]: { text: 'Realizado', bg: 'bg-stone-200', text_color: 'text-stone-800' },
        [WorkOrderStatus.CONFORME]: { text: 'Conforme', bg: 'bg-green-100', text_color: 'text-green-800' },
    };

    return (
        <Card className="flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-lg text-amber-700">Apto {apartmentName}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusInfo[workOrder.status].bg} ${statusInfo[workOrder.status].text_color}`}>
                        {statusInfo[workOrder.status].text}
                    </span>
                </div>
                <p className="text-sm text-stone-500 mb-2">Solicitado por: {workOrder.requesterName}</p>
                <div className="text-sm space-y-3 p-3 bg-stone-50 border rounded-md">
                    <p><strong className="text-stone-700">Fecha Solicitud:</strong> {formatDate(workOrder.requestDate)}</p>
                    <p><strong className="text-stone-700">Detalle Solicitado:</strong> {workOrder.requestDetails}</p>
                    
                    {workOrder.status !== WorkOrderStatus.SOLICITADO && (
                        <div className="pt-2 border-t mt-2 space-y-2">
                            {workOrder.completionDate && (
                                <p><strong className="text-stone-700">Fecha Realizado:</strong> {formatDate(workOrder.completionDate)}</p>
                            )}
                            <p><strong className="text-stone-700">Trabajo Realizado:</strong> {workOrder.materialsUsed || 'Sin detalles.'}</p>
                            
                            {workOrder.status === WorkOrderStatus.CONFORME && workOrder.approvalDate && (
                                <p><strong className="text-stone-700">Fecha Conforme:</strong> {formatDate(workOrder.approvalDate)}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div className="flex justify-end items-center gap-2 mt-4 pt-4 border-t">
                <Button variant="danger" size="sm" onClick={() => deleteWorkOrder(workOrder.id)} className="mr-auto !p-2">
                    <TrashIcon className="w-4 h-4" />
                </Button>
                {workOrder.status === WorkOrderStatus.SOLICITADO && (
                    <Button size="sm" onClick={onWorkDoneClick}>
                        <PencilIcon className="w-4 h-4" /> Registrar Trabajo
                    </Button>
                )}
                {workOrder.status === WorkOrderStatus.REALIZADO && (
                    <Button size="sm" variant="success" onClick={onApprovalClick}>
                        <CheckCircleIcon className="w-5 h-5" /> Registrar Conformidad
                    </Button>
                )}
            </div>
        </Card>
    );
};

// Create Work Order Modal
const WorkOrderFormModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { apartments, addWorkOrder } = useAppData();
    const [apartmentId, setApartmentId] = useState('');
    const [requestDate, setRequestDate] = useState(getTodayDateString());
    const [requesterName, setRequesterName] = useState('');
    const [requestDetails, setRequestDetails] = useState('');
    const [requestMedium, setRequestMedium] = useState<RequestMedium>(RequestMedium.PRESENCIAL);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!apartmentId || !requestDate || !requesterName || !requestDetails) {
            alert('Por favor, complete todos los campos.');
            return;
        }
        addWorkOrder({
            apartmentId: Number(apartmentId),
            requestDate,
            requesterName,
            requestDetails,
            requestMedium
        });
        onClose();
    };
    
    const inputStyles = "mt-1 block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm bg-amber-50 text-black placeholder-stone-500";

    return (
        <Modal isOpen={true} onClose={onClose} title="Nueva Solicitud de Servicio">
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-stone-700">Apartamento</label>
                    <select value={apartmentId} onChange={e => setApartmentId(e.target.value)} required className={inputStyles}>
                        <option value="" disabled>Seleccione...</option>
                        {apartments.map(ap => <option key={ap.id} value={ap.id}>{ap.name}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-700">Fecha de Solicitud</label>
                        <input type="date" value={requestDate} onChange={e => setRequestDate(e.target.value)} required className={inputStyles} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700">Nombre del Solicitante</label>
                        <input type="text" value={requesterName} onChange={e => setRequesterName(e.target.value)} required className={inputStyles} />
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-stone-700">Detalle del Servicio Solicitado</label>
                    <textarea value={requestDetails} onChange={e => setRequestDetails(e.target.value)} required rows={4} className={inputStyles}></textarea>
                </div>
                <div>
                    <label className="block text-sm font-medium text-stone-700">Medio de Solicitud</label>
                    <div className="mt-2 flex flex-wrap gap-4">
                        {Object.values(RequestMedium).map(medium => (
                             <label key={medium} className="flex items-center gap-2">
                                <input type="radio" name="requestMedium" value={medium} checked={requestMedium === medium} onChange={() => setRequestMedium(medium)} className="h-4 w-4 text-amber-600 border-gray-300 focus:ring-amber-500" />
                                {medium}
                            </label>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Guardar Solicitud</Button>
                </div>
            </form>
        </Modal>
    );
};

// Log Work Done Modal
interface WorkDoneFormModalProps {
    workOrder: WorkOrder;
    onClose: () => void;
}
const WorkDoneFormModal: React.FC<WorkDoneFormModalProps> = ({ workOrder, onClose }) => {
    const { updateWorkOrderWorkDone } = useAppData();
    const [completionDate, setCompletionDate] = useState(getTodayDateString());
    const [materialsUsed, setMaterialsUsed] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateWorkOrderWorkDone(workOrder.id, completionDate, materialsUsed);
        onClose();
    };

    const inputStyles = "mt-1 block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm bg-amber-50 text-black placeholder-stone-500";
    
    return (
        <Modal isOpen={true} onClose={onClose} title="Registrar Trabajo Realizado">
             <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-3 bg-stone-50 border rounded-md text-sm">
                    <p><strong>Solicitud Original:</strong> {workOrder.requestDetails}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-stone-700">Fecha de Realización</label>
                    <input type="date" value={completionDate} onChange={e => setCompletionDate(e.target.value)} required min={workOrder.requestDate} className={inputStyles} />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-stone-700">Materiales Utilizados y Detalles del Trabajo</label>
                    <textarea value={materialsUsed} onChange={e => setMaterialsUsed(e.target.value)} rows={4} className={inputStyles}></textarea>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Guardar Trabajo</Button>
                </div>
             </form>
        </Modal>
    );
};

// Log Approval Modal
interface ApprovalFormModalProps {
    workOrder: WorkOrder;
    onClose: () => void;
}
const ApprovalFormModal: React.FC<ApprovalFormModalProps> = ({ workOrder, onClose }) => {
    const { updateWorkOrderApproval } = useAppData();
    const [approvalDate, setApprovalDate] = useState(getTodayDateString());
    const [approvalName, setApprovalName] = useState(workOrder.requesterName);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateWorkOrderApproval(workOrder.id, approvalName, approvalDate);
        onClose();
    };

    const inputStyles = "mt-1 block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm bg-amber-50 text-black placeholder-stone-500";
    
    return (
        <Modal isOpen={true} onClose={onClose} title="Registrar Conformidad del Solicitante">
             <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-3 bg-stone-50 border rounded-md text-sm space-y-2">
                    <p><strong>Solicitud:</strong> {workOrder.requestDetails}</p>
                    <p className="pt-2 border-t"><strong>Trabajo Realizado:</strong> {workOrder.materialsUsed || 'N/A'}</p>
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-700">Nombre de quien da conformidad</label>
                        <input type="text" value={approvalName} onChange={e => setApprovalName(e.target.value)} required className={inputStyles} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700">Fecha de Conformidad</label>
                        <input type="date" value={approvalDate} onChange={e => setApprovalDate(e.target.value)} required min={workOrder.completionDate} className={inputStyles} />
                    </div>
                 </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" variant="success">Finalizar Orden</Button>
                </div>
             </form>
        </Modal>
    );
};