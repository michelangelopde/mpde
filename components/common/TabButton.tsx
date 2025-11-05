import React from 'react';

interface TabButtonProps {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export const TabButton: React.FC<TabButtonProps> = ({ isActive, onClick, children }) => {
  const activeClasses = 'border-amber-500 text-amber-600';
  const inactiveClasses = 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300';

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors ${isActive ? activeClasses : inactiveClasses}`}
    >
      {children}
    </button>
  );
};