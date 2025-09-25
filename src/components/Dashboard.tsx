import { Link } from 'react-router-dom';
import { ClipboardList, BarChart } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function Dashboard() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <div className="flex justify-end gap-2 p-4">
      <Link to="/avaliacoes" className="pb-2 md:pb-4 px-1 text-sm md:text-base text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 font-medium flex items-center gap-2">
        <ClipboardList size={20} />
        <span>Avaliações</span>
      </Link>

      <Link to="/resultados" className="pb-2 md:pb-4 px-1 text-sm md:text-base text-indigo-500/70 dark:text-indigo-400/70 hover:text-indigo-600 dark:hover:text-indigo-300 flex items-center gap-2">
        <BarChart size={20} />
        <span>Resultados</span>
      </Link>
    </div>
  );
} 