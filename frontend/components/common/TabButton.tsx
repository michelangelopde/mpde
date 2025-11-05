import React from 'react';

interface TabButtonProps {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export const TabButton: React.FC<TabButtonProps> = ({ isActive, onClick, children }) => {
  const activeClasses = 'border-indigo-500 text-indigo-600';
  const inactiveClasses = 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300';

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors ${isActive ? activeClasses : inactiveClasses}`}
    >
      {children}
    </button>
  );
};