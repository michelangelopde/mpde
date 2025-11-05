

import React, { ReactNode } from 'react';
import { useAppData } from '../../hooks/useAppData';

interface UserManualProps {
    onClose: () => void;
}

const ManualSection: React.FC<{ title: string; children: ReactNode }> = ({ title, children }) => (
    <section className="mb-8">
        <h2 className="text-2xl font-bold text-amber-700 border-b-2 border-amber-200 pb-2 mb-4">{title}</h2>
        <div className="prose prose-stone max-w-none">
            {children}
        </div>
    </section>
);

const SubSection: React.FC<{ title: string; children: ReactNode }> = ({ title, children }) => (
     <div className="mt-6 p-4 bg-stone-50 rounded-lg border border-stone-200">
        <h3 className="text-xl font-semibold text-stone-800 mb-3">{title}</h3>
        {children}
    </div>
);


export const UserManual: React.FC<UserManualProps> = ({ onClose }) => {
    const { buildingName } = useAppData();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col m-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-2xl font-bold text-stone-800">Manual de Usuario del Sistema</h2>
                    <button onClick={onClose} className="text-stone-500 hover:text-stone-800 text-3xl font-light">&times;</button>
                </div>
                <div className="p-6 md:p-8 overflow-y-auto flex-grow">
                    <ManualSection title="1. Introducción y Acceso">
                        <p>Bienvenido al Sistema de Gestión para <strong>{buildingName}</strong>. Esta aplicación está diseñada para optimizar y simplificar la administración de las tareas de limpieza, mantenimiento y gestión de huéspedes en el edificio.</p>
                        
                        <SubSection title="1.1. Inicio de Sesión">
                            <p>Para acceder al sistema, diríjase a la pantalla principal e ingrese su <strong>Usuario</strong> y <strong>Clave</strong> asignados. Si sus credenciales son correctas, será dirigido a la siguiente pantalla.</p>
                        </SubSection>

                        <SubSection title="1.2. Selección de Rol">
                             <p>Si su usuario tiene múltiples roles (por ejemplo, "Mucama" y "Recepción"), el sistema le pedirá que seleccione el perfil con el que desea trabajar en esta sesión. Haga clic en el botón correspondiente al rol que desea asumir.</p>
                        </SubSection>
                    </ManualSection>

                     <ManualSection title="2. Paneles por Rol">
                        <p>El sistema presentará diferentes paneles y funcionalidades según el rol seleccionado. A continuación se detallan las capacidades de cada uno.</p>

                        <SubSection title="2.1. Panel de Mucama">
                            <p>Este panel está diseñado para que el personal de limpieza gestione sus tareas diarias.</p>
                            <ul>
                                <li><strong>Vista de Tareas:</strong> Al ingresar, verá una lista de tarjetas, cada una representando una tarea de limpieza asignada para el día de hoy en un apartamento específico.</li>
                                <li><strong>Detalles del Apartamento:</strong> Cada tarjeta muestra información clave como el número de dormitorios, baños y si la tarea es compartida.</li>
                                <li><strong>Notas del Encargado:</strong> Si el encargado dejó una nota especial para la tarea, aparecerá resaltada en color rojo.</li>
                                <li><strong>Cambiar de Fecha:</strong> Puede usar el selector de fecha en la parte superior para ver las tareas asignadas en otros días (solo podrá completar las del día actual).</li>
                                <li><strong>Completar una Tarea:</strong>
                                    <ol>
                                        <li>Haga clic en los botones de código de tarea (ej: SL, SV) para indicar qué tipo de servicio realizó. Puede seleccionar varios.</li>
                                        <li>Si es necesario, añada observaciones en el campo de texto.</li>
                                        <li>Haga clic en el botón verde con el tick (✓) para marcar la tarea como completada. La tarjeta cambiará de color para indicar que el trabajo ha sido finalizado.</li>
                                    </ol>
                                </li>
                            </ul>
                        </SubSection>

                        <SubSection title="2.2. Panel de Recepción">
                           <p>Este panel centraliza la gestión de huéspedes y el estado de los apartamentos.</p>
                            <h4 className="font-semibold mt-3">Pestaña "Nuevo Check-In"</h4>
                            <ul>
                                <li><strong>Paso 1: Fechas y Apartamento:</strong> Seleccione el apartamento, la fecha de entrada y la fecha de salida. El sistema validará que no haya conflictos con otras reservas. Al continuar, se generará y descargará automáticamente un PDF con la ficha de check-in para imprimir.</li>
                                <li><strong>Paso 2: Datos del Huésped:</strong> Complete la información del huésped principal (nombre, documento, etc.) y guarde el check-in.</li>
                                <li><strong>Historial Reciente:</strong> En el lateral, verá una lista de los check-ins más recientes. Puede hacer clic en el botón de editar para corregir cualquier dato de un check-in existente.</li>
                            </ul>
                             <h4 className="font-semibold mt-3">Pestaña "Estado de Apartamentos"</h4>
                             <ul>
                                <li><strong>Vista General:</strong> Muestra tarjetas para cada apartamento con su estado actual: Libre, Ocupado, Entrada Hoy, Salida Hoy o Reservado.</li>
                                <li><strong>Filtros:</strong> Use los botones de filtro en la parte superior para visualizar solo los apartamentos que cumplan una condición específica (ej: ver solo los libres).</li>
                                <li><strong>Ver Historial:</strong> En cada tarjeta, un botón le permite abrir una ventana para ver el historial completo de check-ins de ese apartamento, con la opción de filtrar por fechas.</li>
                             </ul>
                             <h4 className="font-semibold mt-3">Pestaña "Bitácora"</h4>
                             <p>Un espacio para registrar notas, solicitudes o eventos importantes relacionados con apartamentos específicos. Todas las entradas quedan registradas con fecha, hora y usuario.</p>
                             <h4 className="font-semibold mt-3">Pestaña "Notas Post-it"</h4>
                             <p>Un sistema de mensajería interna para el personal de recepción. Permite dejar notas adhesivas virtuales para todos o para un colega específico.</p>
                        </SubSection>
                        
                        <SubSection title="2.3. Panel de Mantenimiento">
                            <p>Permite gestionar las órdenes de trabajo (OT) para reparaciones y mantenimiento.</p>
                            <ul>
                                <li><strong>Crear Nueva OT:</strong> Use el botón "Nueva Orden de Trabajo" para abrir un formulario y registrar una nueva solicitud, especificando el apartamento, el solicitante y el detalle del problema.</li>
                                <li><strong>Filtros:</strong> Puede filtrar las órdenes por rango de fechas, apartamento o estado (Solicitado, Realizado, Conforme).</li>
                                <li><strong>Gestionar una OT:</strong>
                                    <ol>
                                        <li><strong>Registrar Trabajo:</strong> En una OT "Solicitada", haga clic en "Registrar Trabajo" para detallar qué se hizo y qué materiales se usaron. El estado cambiará a "Realizado".</li>
                                        <li><strong>Registrar Conformidad:</strong> En una OT "Realizada", haga clic en "Registrar Conformidad" para que el solicitante (o un responsable) apruebe el trabajo. El estado cambiará a "Conforme", cerrando el ciclo.</li>
                                        <li><strong>Eliminar:</strong> Puede eliminar una OT en cualquier momento usando el botón de la papelera.</li>
                                    </ol>
                                </li>
                            </ul>
                        </SubSection>
                        
                        <SubSection title="2.4. Panel del Encargado">
                           <p>Este es un panel completo que agrupa varias funcionalidades para la gestión diaria.</p>
                            <h4 className="font-semibold mt-3">Pestaña "Mucamas"</h4>
                             <p>Contiene 4 sub-pestañas para la gestión del personal de limpieza:</p>
                             <ul>
                                 <li><strong>Tablero Tareas:</strong> Muestra barras de progreso en tiempo real del avance de las tareas de cada mucama durante el día actual.</li>
                                 <li><strong>Asignar Tareas:</strong> Permite asignar nuevas tareas de limpieza a uno o varios empleados para un apartamento y fecha específicos. También puede reasignar o reabrir tareas desde la lista.</li>
                                 <li><strong>Reporte Tareas:</strong> Un listado detallado de todas las tareas (pasadas, presentes y futuras) con filtros avanzados y la opción de exportar los datos a un archivo Excel (.csv).</li>
                                 <li><strong>Informe de Trabajo:</strong> Un reporte comparativo que totaliza la cantidad de apartamentos y horas trabajadas por cada mucama en un período de tiempo, ideal para análisis de rendimiento. También es exportable.</li>
                             </ul>
                             <h4 className="font-semibold mt-3">Otras Pestañas</h4>
                             <ul>
                                 <li><strong>Recepción:</strong> Muestra un historial completo de todos los check-ins realizados en el sistema, con filtros y opción de exportar a Excel.</li>
                                 <li><strong>Mantenimiento:</strong> Acceso directo al Panel de Mantenimiento descrito en el punto 2.3.</li>
                                 <li><strong>Bitácora:</strong> Acceso directo al módulo de Bitácora.</li>
                                 <li><strong>Configuración:</strong> Permite gestionar la lista de Apartamentos y Empleados (similar al Supervisor).</li>
                             </ul>
                        </SubSection>

                         <SubSection title="2.5. Panel del Supervisor">
                           <p>El panel de más alto nivel, centrado en la configuración y administración del sistema.</p>
                            <h4 className="font-semibold mt-3">Pestaña "Empleados"</h4>
                            <p>Permite crear, editar y eliminar usuarios del sistema. Al crear o editar, puede asignarles nombre, ID de empleado, usuario, clave y uno o más roles. Para el rol de Mucama, puede especificar la cantidad de minutos de su jornada laboral diaria.</p>
                            <h4 className="font-semibold mt-3">Pestaña "Apartamentos"</h4>
                            <p>Permite crear, editar y eliminar los apartamentos del edificio, especificando sus características como tamaño, metros cuadrados, y tiempo estimado de limpieza. También puede marcar un apartamento como "Suspendido" para que no aparezca en las listas de asignación.</p>
                             <h4 className="font-semibold mt-3">Pestaña "Configuración"</h4>
                             <ul>
                                <li><strong>Configuración General:</strong> Permite cambiar el nombre del edificio que se muestra en toda la aplicación.</li>
                                <li><strong>Gestionar Tipos de Tarea:</strong> Cree o edite los códigos de tarea (ej: SL, SV) que las mucamas seleccionan al completar un trabajo.</li>
                                <li><strong>Gestionar Roles:</strong> Permite crear o editar los nombres de los roles de usuario en el sistema.</li>
                             </ul>
                        </SubSection>
                    </ManualSection>
                </div>
            </div>
        </div>
    );
};
