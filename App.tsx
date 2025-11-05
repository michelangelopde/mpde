import React, { useState, useMemo, useEffect } from 'react';
import { AppDataProvider, useAppData } from './hooks/useAppData';
import { SupervisorDashboard } from './components/dashboards/SupervisorDashboard';
import { ManagerDashboard } from './components/dashboards/ManagerDashboard';
import { EmployeeDashboard } from './components/dashboards/EmployeeDashboard';
import { ReceptionDashboard } from './components/dashboards/ReceptionDashboard';
import { MaintenanceDashboard } from './components/dashboards/MaintenanceDashboard';
import { HomeIcon, UserGroupIcon, QuestionMarkCircleIcon } from './components/icons';
import { Button } from './components/common/Button';
import { Card } from './components/common/Card';
import { UserManual } from './components/dashboards/UserManual';

const App: React.FC = () => {
  return (
    <AppDataProvider>
      <AppContent />
    </AppDataProvider>
  );
};

const AppContent: React.FC = () => {
  const { currentUser, activeRole, logout, buildingName } = useAppData();
  const [isManualOpen, setManualOpen] = useState(false);

  useEffect(() => {
    document.title = `Sistema de Gestión - ${buildingName}`;
  }, [buildingName]);

  const renderDashboard = () => {
    if (!activeRole) return <p>Seleccione un rol para continuar.</p>;

    switch (activeRole.name) {
      case 'Supervisor':
        return <SupervisorDashboard />;
      case 'Encargado':
        return <ManagerDashboard />;
      case 'Mucama':
        return <EmployeeDashboard />;
      case 'Recepción':
        return <ReceptionDashboard />;
      case 'Mantenimiento':
        return <MaintenanceDashboard />;
      default:
        return <p>Rol desconocido o sin panel asignado.</p>;
    }
  };

  const renderContent = () => {
    if (!currentUser) {
      return <Login />;
    }
    if (!activeRole) {
      return <RoleSelection />;
    }
    return renderDashboard();
  };

  const rootDivClass = !currentUser ? 'login-background' : 'bg-stone-100';

  return (
    <div className={`flex flex-col min-h-screen text-stone-800 ${rootDivClass}`}>
      {currentUser && (
        <header className="bg-white shadow-md">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="logo-font text-4xl text-amber-600">M</div>
              <h1 className="text-xl font-bold text-stone-800">Sistema de Gestión - {buildingName}</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden sm:block font-semibold text-stone-700">Hola, {currentUser.name}</span>
              {activeRole && (
                <span className="hidden sm:block px-3 py-1 bg-amber-100 text-amber-800 text-sm font-semibold rounded-full">
                  {activeRole.name}
                </span>
              )}
               <Button variant="secondary" size="sm" onClick={() => setManualOpen(true)} className="!p-2" aria-label="Abrir manual de usuario">
                  <QuestionMarkCircleIcon className="w-5 h-5" />
               </Button>
              <Button variant="secondary" onClick={logout}>Cerrar Sesión</Button>
            </div>
          </div>
        </header>
      )}

      <main className={`flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 ${!currentUser ? 'flex flex-col justify-center' : ''}`}>
        {renderContent()}
      </main>

      {currentUser && (
        <footer className="text-center py-4 text-sm text-stone-500 bg-white border-t border-stone-200">
          &copy; {new Date().getFullYear()} Germán Rodríguez Barcos
        </footer>
      )}
      
      {isManualOpen && <UserManual onClose={() => setManualOpen(false)} />}
    </div>
  );
};

const Login: React.FC = () => {
    const { login, buildingName } = useAppData();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const success = login(username, password);
        if (!success) {
            setError('Usuario o clave incorrectos.');
        }
    };
    
    const inputStyles = "appearance-none block w-full px-3 py-2 border border-amber-300 rounded-md shadow-sm placeholder-stone-500 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-amber-50 text-black";

    return (
        <div className="flex justify-center items-center">
            <div className="w-full max-w-md">
                 <Card>
                    <div className="flex justify-center items-center mb-4">
                        <div className="logo-font text-8xl text-amber-600">
                            M
                        </div>
                    </div>
                    <div className="mb-6 text-center">
                        <h2 className="text-3xl font-bold text-stone-800">{buildingName}</h2>
                        <h3 className="mt-2 text-xl text-stone-700">Bienvenid@</h3>
                        <p className="mt-4 text-stone-600">
                            Por favor, ingrese sus datos para acceder al sistema.
                        </p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-stone-700">
                                Usuario
                            </label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    autoComplete="username"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className={inputStyles}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-stone-700">
                                Clave
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={inputStyles}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                                <span className="block sm:inline">{error}</span>
                            </div>
                        )}

                        <div>
                            <Button type="submit" className="w-full">
                                Entrar
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
};

const RoleSelection: React.FC = () => {
    const { currentUser, roles, setActiveRole } = useAppData();

    const availableRoles = useMemo(() => {
        if (!currentUser) return [];
        return roles.filter(r => currentUser.roleIds.includes(r.id));
    }, [currentUser, roles]);

    return (
        <div className="flex justify-center items-center">
            <div className="w-full max-w-md">
                <Card title="Seleccionar Perfil">
                     <div className="mb-6 text-center">
                        <h2 className="text-2xl font-bold text-stone-800">Hola, {currentUser?.name}</h2>
                        <p className="mt-2 text-stone-600">
                            Tienes varios perfiles asignados. Por favor, selecciona con cuál deseas trabajar hoy.
                        </p>
                    </div>
                    <div className="space-y-4">
                        {availableRoles.map(role => (
                            <Button
                                key={role.id}
                                onClick={() => setActiveRole(role.id)}
                                className="w-full"
                            >
                                <UserGroupIcon className="w-5 h-5" />
                                Entrar como {role.name}
                            </Button>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};


export default App;