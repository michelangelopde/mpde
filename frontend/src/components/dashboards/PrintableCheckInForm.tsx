import React from 'react';

interface PrintableCheckInFormProps {
  apartmentName: string;
  checkInDate: string;
  checkOutDate: string;
  registeredBy: string;
  id?: string;
}

const Field: React.FC<{ label: string, value?: string, className?: string, valueClassName?: string, children?: React.ReactNode }> = ({ label, value, className, valueClassName, children }) => (
    <div className={`flex border border-black ${className}`}>
        <div className="w-2/5 border-r border-black p-2 font-semibold bg-stone-200 flex items-center text-sm">{label}</div>
        <div className={`w-3/5 p-2 flex items-center ${valueClassName}`}>{value || children}</div>
    </div>
);

const EmptyField: React.FC<{ label: string, className?: string }> = ({ label, className }) => (
    <div className={`flex border border-black ${className}`}>
        <div className="w-2/5 border-r border-black p-2 font-semibold flex items-center text-sm">{label}</div>
        <div className="w-3/5 p-2 h-10"></div>
    </div>
);


export const PrintableCheckInForm: React.FC<PrintableCheckInFormProps> = ({ id, apartmentName, checkInDate, checkOutDate, registeredBy }) => {
  const formatDateForPrint = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00'); // Assume UTC to avoid timezone issues
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div id={id || 'printable-area'} className="p-8 bg-white text-black font-sans text-base">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold">EDIFICIO MICHELANGELO</h1>
        <h2 className="text-xl">Bienvenidos - Welcome - Bem-vindos</h2>
        <h3 className="text-2xl font-bold pt-4">CHECK - IN</h3>
      </div>

      <div className="space-y-px">
        <Field 
            label="Apartamento/Apartament/Departamento" 
            value={apartmentName} 
            className="bg-amber-200"
            valueClassName="font-bold text-black text-lg justify-center" 
        />
        
        <div className="flex w-full">
            <div className="w-1/2 flex border border-black">
                <div className="w-1/5 border-r border-black p-2 font-bold bg-stone-300 flex items-center justify-center">IN</div>
                <div className="w-2/5 border-r border-black p-2 font-semibold flex items-center text-sm">Fecha/Date/Data</div>
                <div className="w-2/5 p-2 flex items-center justify-center bg-amber-200 font-bold text-black text-lg">{formatDateForPrint(checkInDate)}</div>
            </div>
             <div className="w-1/2 flex border border-black">
                <div className="w-1/5 border-r border-black p-2 font-bold bg-stone-300 flex items-center justify-center">OUT</div>
                <div className="w-2/5 border-r border-black p-2 font-semibold flex items-center text-sm">Fecha/Date/Data</div>
                <div className="w-2/5 p-2 flex items-center justify-center bg-amber-200 font-bold text-black text-lg">{formatDateForPrint(checkOutDate)}</div>
            </div>
        </div>

        <EmptyField label="Nombre/Name/Nome" />
        <EmptyField label="Apellido/Surname/Sobrenome" />
        <EmptyField label="Documento (DNI - CI)/Passport/Identidade" />
        <EmptyField label="Teléfono/Phone/Telefone" />
        <EmptyField label="Correo/Email" />
        <EmptyField label="Ciudad/City/Cidade" />

        <div className="flex border border-black">
            <div className="w-2/5 border-r border-black p-2 font-semibold flex items-center text-sm">Acompañantes/Shares/Companheiros</div>
            <div className="w-3/5">
                <div className="h-10 border-b border-black"></div>
                <div className="h-10 border-b border-black"></div>
                <div className="h-10 border-b border-black"></div>
                <div className="h-10 border-b border-black"></div>
                <div className="h-10"></div>
            </div>
        </div>
        
        <div className="flex border border-black">
            <div className="w-2/5 border-r border-black p-2 font-semibold flex items-center text-sm">Auto/Car/Carro</div>
            <div className="w-3/5 p-2 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <div><span className="font-bold">SI</span> <span className="inline-block w-6 h-6 border border-black ml-2"></span></div>
                    <div><span className="font-bold">NO</span> <span className="inline-block w-6 h-6 border border-black ml-2"></span></div>
                </div>
                <div className="flex items-center">
                    <span className="font-semibold mr-2">Nro.</span>
                    <div className="w-64 h-8 border-b border-black"></div>
                </div>
            </div>
        </div>
        
        <EmptyField label="Firma/Signature/Assinatura" />

      </div>

      <div className="mt-12 text-center text-lg font-semibold">
        DE USO INTERNO
      </div>
      <Field label="REGISTRADO POR" value={registeredBy} className="mt-2" valueClassName="font-semibold" />

    </div>
  );
};
