import React, { useState, useMemo } from 'react';
import { useAppData } from '../../hooks/useAppData';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { PencilIcon, TrashIcon } from '../icons';
import { LogbookEntry } from '../../types';
import { formatDateTime } from '../../lib/utils';

export const LogbookView: React.FC = () => {
    const { logbookEntries, apartments, users, addLogbookEntry, updateLogbookEntry, deleteLogbookEntry, currentUser, activeRole } = useAppData();

    // Form state
    const [apartmentId, setApartmentId] = useState('');
    const [note, setNote] = useState('');
    const [editingEntry, setEditingEntry] = useState<LogbookEntry | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter state
    const [filterApartmentId, setFilterApartmentId] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    const isManager = activeRole?.name === 'Encargado' || activeRole?.name === 'Supervisor';

    const filteredEntries = useMemo(() => {
        return logbookEntries
            .filter(entry => {
                if (filterApartmentId && entry.apartmentId !== Number(filterApartmentId)) {
                    return false;
                }
                const entryDate = entry.date.split('T')[0];
                if (filterStartDate && entryDate < filterStartDate) {
                    return false;
                }
                if (filterEndDate && entryDate > filterEndDate) {
                    return false;
                }
                return true;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [logbookEntries, filterApartmentId, filterStartDate, filterEndDate]);

    const resetForm = () => {
        setApartmentId('');
        setNote('');
        setEditingEntry(null);
    };

    const handleEdit = (entry: LogbookEntry) => {
        setEditingEntry(entry);
        setApartmentId(String(entry.apartmentId));
        setNote(entry.note);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!apartmentId || !note.trim()) {
            alert('Por favor, seleccione un apartamento y escriba una nota.');
            return;
        }

        setIsSubmitting(true);
        if (editingEntry) {
            await updateLogbookEntry({
                ...editingEntry,
                apartmentId: Number(apartmentId),
                note: note.trim(),
            });
        } else {
            await addLogbookEntry({
                apartmentId: Number(apartmentId),
                note: note.trim(),
            });
        }
        setIsSubmitting(false);
        resetForm();
    };
    
    const inputStyles = "mt-1 block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm bg-amber-50 text-black placeholder-stone-500";
    const filterInputStyles = "rounded-md border-amber-300 sm:text-sm bg-amber-50 text-black";


    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
                <Card title={editingEntry ? 'Editar Entrada' : 'Nueva Entrada en Bitácora'}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="log-apartment" className="block text-sm font-medium text-stone-700">Apartamento</label>
                            <select id="log-apartment" value={apartmentId} onChange={e => setApartmentId(e.target.value)} required className={inputStyles}>
                                <option value="" disabled>Seleccione...</option>
                                {apartments.map(ap => <option key={ap.id} value={ap.id}>{ap.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="log-note" className="block text-sm font-medium text-stone-700">Nota / Solicitud</label>
                            <textarea id="log-note" value={note} onChange={e => setNote(e.target.value)} required rows={5} className={inputStyles}></textarea>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            {editingEntry && (
                                <Button type="button" variant="secondary" onClick={resetForm} disabled={isSubmitting}>Cancelar Edición</Button>
                            )}
                            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : (editingEntry ? 'Actualizar Nota' : 'Guardar Nota')}</Button>
                        </div>
                    </form>
                </Card>
            </div>
            <div className="lg:col-span-2">
                <Card title="Registro de Bitácora">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-md mb-6 bg-stone-50">
                        <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className={filterInputStyles}/>
                        <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className={filterInputStyles}/>
                        <select value={filterApartmentId} onChange={e => setFilterApartmentId(e.target.value)} className={filterInputStyles}>
                            <option value="">Todos los Apartamentos</option>
                            {apartments.map(ap => <option key={ap.id} value={ap.id}>{ap.name}</option>)}
                        </select>
                    </div>

                    <ul className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                        {filteredEntries.length > 0 ? filteredEntries.map(entry => {
                            const apartment = apartments.find(a => a.id === entry.apartmentId);
                            const creator = users.find(u => u.id === entry.createdBy);
                            const canEdit = currentUser?.id === entry.createdBy;
                            const canDelete = isManager;

                            return (
                                <li key={entry.id} className="p-4 border rounded-lg bg-stone-50">
                                    <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                                        <div className="flex items-center gap-3">
                                            <p className="font-bold text-amber-700">Apto: {apartment?.name || 'N/A'}</p>
                                            <span className="text-xs text-stone-500">{formatDateTime(entry.date)}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            {canEdit && <Button size="sm" variant="secondary" onClick={() => handleEdit(entry)}><PencilIcon className="w-4 h-4" /></Button>}
                                            {canDelete && <Button size="sm" variant="danger" onClick={() => deleteLogbookEntry(entry.id)}><TrashIcon className="w-4 h-4" /></Button>}
                                        </div>
                                    </div>
                                    <p className="text-sm text-stone-800 whitespace-pre-wrap">{entry.note}</p>
                                    <p className="text-right text-xs text-stone-500 mt-3">Registrado por: {creator?.name || 'Desconocido'}</p>
                                </li>
                            )
                        }) : (
                            <div className="text-center py-10 text-stone-500">
                                <p>No hay entradas en la bitácora para los filtros seleccionados.</p>
                            </div>
                        )}
                    </ul>
                </Card>
            </div>
        </div>
    );
};
