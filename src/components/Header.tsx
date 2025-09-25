import { Menu, Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Link } from 'react-router-dom';

interface HeaderProps {
  onMenuClick: () => void;
  isMenuOpen: boolean;
}

export function Header({ onMenuClick, isMenuOpen }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <header className={`md:hidden ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-b p-4 flex justify-between items-center`}>
      <Link to="/dashboard" className="flex items-center">
        <img
          alt="Consultoria Extermina Frango"
          className="w-16 h-16 rounded-lg"
          src="/images/Logo-Consultoria.png"
        />
      </Link>

      <div className="flex items-center space-x-3">
        <button
          className={`p-2 rounded-lg ${
            isDarkMode 
              ? 'text-gray-400 hover:text-orange-400' 
              : 'text-gray-600 hover:text-orange-500'
          }`}
          onClick={toggleTheme}
          aria-label={isDarkMode ? "Mudar para tema claro" : "Mudar para tema escuro"}
        >
          {isDarkMode ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>
        
        <button
          onClick={onMenuClick}
          className={`p-2 rounded-lg ${
            isDarkMode 
              ? 'text-gray-400 hover:text-orange-400' 
              : 'text-gray-600 hover:text-orange-500'
          }`}
          aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
} 