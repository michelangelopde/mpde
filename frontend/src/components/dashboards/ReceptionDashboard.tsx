import React, { useState, useMemo } from 'react';
import { useAppData } from '../../hooks/useAppData';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { TabButton } from '../common/TabButton';
import { PlusIcon, BuildingOfficeIcon, CalendarDaysIcon, PencilIcon } from '../icons';
import { getTodayDateString, formatDate, formatDateShort } from '../../lib/utils';
import { Apartment, CheckIn } from '../../types';
import { PrintableCheckInForm } from './PrintableCheckInForm';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

type ReceptionTab = 'checkin' | 'status';

export const ReceptionDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ReceptionTab>('checkin');

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Panel de Recepción</h1>
            <div className="border-b border-slate-200 mb-6">
                <div className="flex space-x-8">
                    <TabButton isActive={activeTab === 'checkin'} onClick={() => setActiveTab('checkin')}>
                        <PlusIcon className="w-5 h-5"/>
                        Nuevo Check In
                    </TabButton>
                    <TabButton isActive={activeTab === 'status'} onClick={() => setActiveTab('status')}>
                        <BuildingOfficeIcon className="w-5 h-5" />
                        Estado de Apartamentos
                    </TabButton>
                </div>
            </div>
            <div>
                {activeTab === 'checkin' && <CheckInTab />}
                {activeTab === 'status' && <ApartmentStatusTab />}
            </div>
        </div>
    );
};

const CheckInTab: React.FC = () => {
    const { apartments, checkIns, addCheckIn, updateCheckIn, currentUser } = useAppData();
    
    const [step, setStep] = useState(1); // 1: Dates, 2: Guest Details
    const [editingCheckInId, setEditingCheckInId] = useState<number | null>(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    
    // Step 1 data
    const [apartmentId, setApartmentId] = useState<number | string>('');
    const [checkInDate, setCheckInDate] = useState(getTodayDateString());
    const [checkOutDate, setCheckOutDate] = useState('');

    // Step 2 data
    const [guestFirstName, setGuestFirstName] = useState('');
    const [guestLastName, setGuestLastName] = useState('');
    const [guestDocument, setGuestDocument] = useState('');
    const [vehicleRegistration, setVehicleRegistration] = useState('');
    const [details, setDetails] = useState('');
    
    const dateError = useMemo<string | null>(() => {
        if (!checkInDate || !checkOutDate) return null;

        if (checkInDate >= checkOutDate) {
            return "La fecha de check-out debe ser posterior a la fecha de check-in.";
        }

        if (apartmentId) {
             const conflict = checkIns.some(ci => 
                ci.id !== editingCheckInId && // Ignore self when editing
                ci.apartmentId === Number(apartmentId) &&
                checkInDate < ci.checkOutDate && 
                checkOutDate > ci.checkInDate
            );

            if (conflict) {
                return "Las fechas seleccionadas se superponen con una reserva existente para este apartamento.";
            }
        }

        return null;
    }, [checkIns, apartmentId, checkInDate, checkOutDate, editingCheckInId]);

    const sortedCheckIns = useMemo(() => [...checkIns].sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime()), [checkIns]);

    const resetForm = () => {
        setStep(1);
        setEditingCheckInId(null);
        setApartmentId('');
        setCheckInDate(getTodayDateString());
        setCheckOutDate('');
        setGuestFirstName('');
        setGuestLastName('');
        setGuestDocument('');
        setVehicleRegistration('');
        setDetails('');
    };
    
    const handleEdit = (checkIn: CheckIn) => {
        setEditingCheckInId(checkIn.id);
        setApartmentId(checkIn.apartmentId);
        setCheckInDate(checkIn.checkInDate);
        setCheckOutDate(checkIn.checkOutDate);
        setGuestFirstName(checkIn.guestFirstName);
        setGuestLastName(checkIn.guestLastName);
        setGuestDocument(checkIn.guestDocument);
        setVehicleRegistration(checkIn.vehicleRegistration || '');
        setDetails(checkIn.details);
        setStep(1);
    };
    
    const handleGeneratePdfAndContinue = async () => {
        if (dateError || !currentUser) return;
        
        // Skip PDF generation if we are just editing
        if (editingCheckInId) {
            setStep(2);
            return;
        }

        setIsGeneratingPdf(true);

        // Wait for the next render cycle to ensure the hidden component is in the DOM
        setTimeout(async () => {
            const printableElement = document.getElementById('pdf-generator-area');
            if (!printableElement) {
                console.error("Printable element not found!");
                setIsGeneratingPdf(false);
                return;
            }

            try {
                const canvas = await html2canvas(printableElement, { scale: 2 });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({
                    orientation: 'p',
                    unit: 'mm',
                    format: 'a4'
                });
                
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const canvasWidth = canvas.width;
                const canvasHeight = canvas.height;
                const ratio = canvasWidth / canvasHeight;
                const height = pdfWidth / ratio;

                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, height > pdfHeight ? pdfHeight : height);
                pdf.save(`Check-In-Apto-${selectedApartmentName}-${checkInDate}.pdf`);

            } catch (error) {
                console.error("Error generating PDF:", error);
                alert("Hubo un error al generar el PDF. Por favor, intente nuevamente.");
            } finally {
                setIsGeneratingPdf(false);
                setStep(2);
            }
        }, 0);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!apartmentId || !guestFirstName || !guestLastName || !guestDocument || !checkInDate || !checkOutDate) {
            alert('Por favor, complete todos los campos requeridos.');
            return;
        }
        if (dateError) {
             alert(`Error en las fechas: ${dateError}. Volviendo al paso 1 para corregir.`);
             setStep(1);
             return;
        }

        const checkInData = {
            apartmentId: Number(apartmentId), 
            guestFirstName, 
            guestLastName, 
            guestDocument, 
            checkInDate, 
            checkOutDate,
            vehicleRegistration,
            details 
        };

        if (editingCheckInId) {
            updateCheckIn({ ...checkInData, id: editingCheckInId });
        } else {
            addCheckIn(checkInData);
        }
        
        resetForm();
    };

    const inputStyles = "mt-1 block w-full rounded-md border-sky-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-sky-100 text-black placeholder-slate-500";
    const isStep1Complete = apartmentId !== '' && checkInDate !== '' && checkOutDate !== '' && !dateError;
    const selectedApartmentName = useMemo(() => apartments.find(ap => ap.id === Number(apartmentId))?.name, [apartments, apartmentId]);
    
    const cardTitle = useMemo(() => {
        if (editingCheckInId) {
            return step === 1 ? `Editando Paso 1: Fechas (Apto ${selectedApartmentName})` : `Editando Paso 2: Huésped (Apto ${selectedApartmentName})`;
        }
        return step === 1 ? 'Paso 1: Apartamento y Fechas' : `Paso 2: Datos del Huésped (Apto ${selectedApartmentName})`;
    }, [editingCheckInId, step, selectedApartmentName]);


    return (
        <>
            {/* Hidden component for PDF generation */}
            {isGeneratingPdf && selectedApartmentName && (
                <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '210mm' }}>
                    <PrintableCheckInForm
                        id="pdf-generator-area"
                        apartmentName={selectedApartmentName}
                        checkInDate={checkInDate}
                        checkOutDate={checkOutDate}
                        registeredBy={currentUser?.name || 'N/A'}
                    />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card title={cardTitle} className="lg:col-span-2">
                    {step === 1 && (
                        <form onSubmit={(e) => { e.preventDefault(); handleGeneratePdfAndContinue(); }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Apartamento</label>
                                <select value={apartmentId} onChange={e => setApartmentId(e.target.value)} required className={inputStyles}>
                                    <option value="" disabled>Seleccione un apartamento</option>
                                    {apartments.map(ap => <option key={ap.id} value={ap.id}>{ap.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Fecha Check-in</label>
                                    <input type="date" value={checkInDate} onChange={e => setCheckInDate(e.target.value)} required className={inputStyles} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Fecha Check-out</label>
                                    <input type="date" value={checkOutDate} onChange={e => setCheckOutDate(e.target.value)} min={checkInDate} required className={inputStyles} />
                                </div>
                            </div>
                            {dateError && (
                                <div className="p-3 bg-red-100 border border-red-300 text-red-700 text-sm rounded-md" role="alert">
                                    {dateError}
                                </div>
                            )}
                            <div className="flex justify-end pt-4 gap-4">
                                {editingCheckInId && (
                                    <Button type="button" variant="warning" onClick={resetForm}>Cancelar Edición</Button>
                                )}
                                <Button type="submit" disabled={!isStep1Complete || isGeneratingPdf}>
                                    {isGeneratingPdf ? 'Generando PDF...' : (editingCheckInId ? 'Continuar Editando' : 'Continuar y Generar PDF')}
                                </Button>
                            </div>
                        </form>
                    )}
                    {step === 2 && (
                         <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-md border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                                 <div><span className="font-semibold">Apartamento:</span> {selectedApartmentName}</div>
                                 <div><span className="font-semibold">Check-in:</span> {formatDate(checkInDate)}</div>
                                 <div><span className="font-semibold">Check-out:</span> {formatDate(checkOutDate)}</div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Nombres</label>
                                    <input type="text" value={guestFirstName} onChange={e => setGuestFirstName(e.target.value)} required className={inputStyles} />
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-slate-700">Apellidos</label>
                                    <input type="text" value={guestLastName} onChange={e => setGuestLastName(e.target.value)} required className={inputStyles} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Documento</label>
                                    <input type="text" value={guestDocument} onChange={e => setGuestDocument(e.target.value)} required className={inputStyles} />
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-slate-700">Matrícula Vehículo (Opcional)</label>
                                    <input type="text" value={vehicleRegistration} onChange={e => setVehicleRegistration(e.target.value)} className={inputStyles} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Detalles Adicionales</label>
                                <textarea value={details} onChange={e => setDetails(e.target.value)} rows={3} className={inputStyles}></textarea>
                            </div>
                            <div className="flex justify-end gap-4 pt-4">
                                <Button type="button" variant="secondary" onClick={() => setStep(1)}>Volver</Button>
                                {editingCheckInId && (
                                    <Button type="button" variant="warning" onClick={resetForm}>Cancelar Edición</Button>
                                )}
                                <Button type="submit">{editingCheckInId ? 'Actualizar Check-in' : 'Guardar Check-in'}</Button>
                            </div>
                        </form>
                    )}
                </Card>
                <Card title="Historial Reciente" className="lg:col-span-1">
                    <ul className="space-y-3 max-h-[500px] overflow-y-auto">
                        {sortedCheckIns.map(ci => {
                            const ap = apartments.find(a => a.id === ci.apartmentId);
                            return (
                                 <li key={ci.id} className="p-3 bg-slate-50 rounded-md border border-slate-200">
                                    <div className="flex justify-between items-start">
                                        <p className="font-bold text-indigo-700">Apto: {ap?.name}</p>
                                        <Button size="sm" variant="secondary" onClick={() => handleEdit(ci)} aria-label="Editar check-in">
                                            <PencilIcon className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <div className="mt-2 pl-2 border-l-2 border-slate-200 text-sm">
                                        <p className="font-medium text-slate-800">{ci.guestFirstName} {ci.guestLastName}</p>
                                        <p className="text-slate-600">Doc: {ci.guestDocument}</p>
                                        {ci.vehicleRegistration && <p className="text-slate-600">Vehículo: {ci.vehicleRegistration}</p>}
                                        <p className="text-xs text-slate-500 mt-1">{formatDate(ci.checkInDate)} - {formatDate(ci.checkOutDate)}</p>
                                        {ci.details && <p className="text-xs text-slate-500 mt-1 italic">Nota: {ci.details}</p>}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </Card>
            </div>
        </>
    );
};

const statusInfo: { [key: string]: { text: string; bg: string; text_color: string; } } = {
    LIBRE: { text: 'Libre', bg: 'bg-green-100', text_color: 'text-green-800' },
    OCUPADO: { text: 'Ocupado', bg: 'bg-red-100', text_color: 'text-red-800' },
    ENTRADA_HOY: { text: 'Entrada Hoy', bg: 'bg-blue-100', text_color: 'text-blue-800' },
    SALIDA_HOY: { text: 'Salida Hoy', bg: 'bg-yellow-100', text_color: 'text-yellow-800' },
    RESERVADO: { text: 'Reservado', bg: 'bg-purple-100', text_color: 'text-purple-800' }
};

interface ApartmentStatusCardProps {
    apartmentStatus: {
        id: number;
        name: string;
        status: string;
        associatedCheckIn: CheckIn | null;
    };
    onHistoryClick: () => void;
}

const ApartmentStatusCard: React.FC<ApartmentStatusCardProps> = ({ apartmentStatus, onHistoryClick }) => {
    const { status, name, associatedCheckIn } = apartmentStatus;
    const info = statusInfo[status];
    const hasHistory = useAppData().checkIns.some(ci => ci.apartmentId === apartmentStatus.id);

    return (
        <div className="border border-slate-200 rounded-lg p-4 flex flex-col justify-between shadow-sm bg-white">
            <div>
                <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-indigo-700">{name}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${info.bg} ${info.text_color}`}>
                        {info.text}
                    </span>
                </div>
                {associatedCheckIn ? (
                    <div className="mt-2 pt-2 border-t border-slate-100 text-sm space-y-1">
                        <p className="font-medium text-slate-800">{associatedCheckIn.guestFirstName} {associatedCheckIn.guestLastName}</p>
                        <p className="text-slate-600">
                           {status === 'RESERVADO' ? 'Reserva: ' : ''}
                           {formatDateShort(associatedCheckIn.checkInDate)} - {formatDateShort(associatedCheckIn.checkOutDate)}
                        </p>
                    </div>
                ) : (
                    <div className="mt-2 pt-2 border-t border-slate-100 text-sm text-slate-500 italic h-[52px] flex items-center">
                        <p>Sin ocupación actual o futura.</p>
                    </div>
                )}
            </div>
            <div className="mt-4">
                <Button variant="secondary" size="sm" onClick={onHistoryClick} disabled={!hasHistory} className="w-full">
                    Ver Historial
                </Button>
            </div>
        </div>
    )
}

type ApartmentStatusFilter = 'TODOS' | 'LIBRES' | 'OCUPADOS' | 'ENTRADAS' | 'SALIDAS' | 'RESERVADOS';

const ApartmentStatusTab: React.FC = () => {
    const { apartments, checkIns } = useAppData();
    const [viewingApartment, setViewingApartment] = useState<Apartment | null>(null);
    const [filter, setFilter] = useState<ApartmentStatusFilter>('TODOS');

    const apartmentStatuses = useMemo(() => {
        const today = getTodayDateString();

        return apartments.map(ap => {
            const arrival = checkIns.find(ci => ci.apartmentId === ap.id && ci.checkInDate === today);
            if (arrival) {
                return { ...ap, status: 'ENTRADA_HOY', associatedCheckIn: arrival };
            }

            const departure = checkIns.find(ci => ci.apartmentId === ap.id && ci.checkOutDate === today);
            if (departure) {
                return { ...ap, status: 'SALIDA_HOY', associatedCheckIn: departure };
            }

            const occupation = checkIns.find(ci => ci.apartmentId === ap.id && ci.checkInDate < today && ci.checkOutDate > today);
            if (occupation) {
                return { ...ap, status: 'OCUPADO', associatedCheckIn: occupation };
            }
            
            const nextReservation = checkIns
                .filter(ci => ci.apartmentId === ap.id && ci.checkInDate > today)
                .sort((a, b) => a.checkInDate.localeCompare(b.checkInDate))[0];
            if (nextReservation) {
                return { ...ap, status: 'RESERVADO', associatedCheckIn: nextReservation };
            }
            
            return { ...ap, status: 'LIBRE', associatedCheckIn: null };
        });
    }, [apartments, checkIns]);
    
    const filteredApartments = useMemo(() => {
        const sorted = apartmentStatuses.sort((a,b) => a.name.localeCompare(b.name));
        if (filter === 'TODOS') return sorted;
        if (filter === 'LIBRES') return sorted.filter(ap => ap.status === 'LIBRE');
        if (filter === 'ENTRADAS') return sorted.filter(ap => ap.status === 'ENTRADA_HOY');
        if (filter === 'SALIDAS') return sorted.filter(ap => ap.status === 'SALIDA_HOY');
        if (filter === 'RESERVADOS') return sorted.filter(ap => ap.status === 'RESERVADO');
        if (filter === 'OCUPADOS') return sorted.filter(ap => ['OCUPADO', 'ENTRADA_HOY', 'SALIDA_HOY'].includes(ap.status));
        return [];
    }, [filter, apartmentStatuses]);

    const FilterButton: React.FC<{ currentFilter: ApartmentStatusFilter, targetFilter: ApartmentStatusFilter, children: React.ReactNode, count: number }> = ({ currentFilter, targetFilter, children, count }) => (
        <button 
            onClick={() => setFilter(targetFilter)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                currentFilter === targetFilter 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white text-slate-700 hover:bg-slate-100 border'
            }`}
        >
            {children}
            <span className={`px-2 py-0.5 rounded-full text-xs ${
                 currentFilter === targetFilter ? 'bg-indigo-400 text-white' : 'bg-slate-200 text-slate-600'
            }`}>{count}</span>
        </button>
    );

    const statusCounts = useMemo(() => ({
        TODOS: apartmentStatuses.length,
        LIBRES: apartmentStatuses.filter(ap => ap.status === 'LIBRE').length,
        OCUPADOS: apartmentStatuses.filter(ap => ['OCUPADO', 'ENTRADA_HOY', 'SALIDA_HOY'].includes(ap.status)).length,
        ENTRADAS: apartmentStatuses.filter(ap => ap.status === 'ENTRADA_HOY').length,
        SALIDAS: apartmentStatuses.filter(ap => ap.status === 'SALIDA_HOY').length,
        RESERVADOS: apartmentStatuses.filter(ap => ap.status === 'RESERVADO').length,
    }), [apartmentStatuses]);

    return (
        <>
            <Card>
                <div className="flex flex-wrap items-center gap-2 mb-6 p-4 bg-slate-50 rounded-lg border">
                    <FilterButton currentFilter={filter} targetFilter="TODOS" count={statusCounts.TODOS}>Todos</FilterButton>
                    <FilterButton currentFilter={filter} targetFilter="LIBRES" count={statusCounts.LIBRES}>Libres</FilterButton>
                    <FilterButton currentFilter={filter} targetFilter="OCUPADOS" count={statusCounts.OCUPADOS}>Ocupados</FilterButton>
                    <FilterButton currentFilter={filter} targetFilter="ENTRADAS" count={statusCounts.ENTRADAS}>Entradas Hoy</FilterButton>
                    <FilterButton currentFilter={filter} targetFilter="SALIDAS" count={statusCounts.SALIDAS}>Salidas Hoy</FilterButton>
                    <FilterButton currentFilter={filter} targetFilter="RESERVADOS" count={statusCounts.RESERVADOS}>Reservados</FilterButton>
                </div>

                {filteredApartments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredApartments.map(ap => (
                            <ApartmentStatusCard 
                                key={ap.id}
                                apartmentStatus={ap}
                                onHistoryClick={() => setViewingApartment(ap)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-500">
                        <p>No hay apartamentos que coincidan con el filtro seleccionado.</p>
                    </div>
                )}
            </Card>
            <HistoryModal 
                apartment={viewingApartment}
                isOpen={!!viewingApartment}
                onClose={() => setViewingApartment(null)}
            />
        </>
    );
};


interface HistoryModalProps {
  apartment: Apartment | null;
  isOpen: boolean;
  onClose: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ apartment, isOpen, onClose }) => {
    const { checkIns } = useAppData();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    const inputStyles = "block w-full rounded-md border-sky-300 shadow-sm sm:text-sm bg-sky-100 text-black";

    const filteredHistory = useMemo(() => {
        if (!apartment) return [];
        return checkIns
            .filter(ci => ci.apartmentId === apartment.id)
            .filter(ci => {
                if (startDate && new Date(ci.checkInDate) < new Date(startDate)) return false;
                if (endDate && new Date(ci.checkInDate) > new Date(endDate)) return false;
                return true;
            })
            .sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime());
    }, [checkIns, apartment, startDate, endDate]);

    if (!apartment) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Historial de ${apartment.name}`}>
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 p-4 bg-slate-50 rounded-md">
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputStyles}/>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputStyles}/>
                </div>
                <ul className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredHistory.length > 0 ? filteredHistory.map(ci => (
                        <li key={ci.id} className="p-3 border rounded-md">
                             <p className="font-semibold text-slate-800">{ci.guestFirstName} {ci.guestLastName}</p>
                             <p className="text-sm text-slate-600">Doc: {ci.guestDocument}</p>
                             {ci.vehicleRegistration && <p className="text-sm text-slate-600">Vehículo: {ci.vehicleRegistration}</p>}
                             <p className="text-sm text-slate-600">{formatDate(ci.checkInDate)} - {formatDate(ci.checkOutDate)}</p>
                             <p className="text-xs text-slate-500 mt-1">{ci.details}</p>
                        </li>
                    )) : <p className="text-center text-slate-500 py-4">No hay registros para las fechas seleccionadas.</p>}
                </ul>
            </div>
        </Modal>
    );
}
