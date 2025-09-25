import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center gap-2 p-2 rounded-lg w-full ${
        isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
      }`}
    >
      {isDarkMode ? (
        <Sun className="text-gray-300" size={20} />
      ) : (
        <Moon className="text-gray-600" size={20} />
      )}
      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
        {isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
      </span>
    </button>
  );
};

export default ThemeToggle; 