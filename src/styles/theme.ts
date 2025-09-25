export const themeConfig = {
  light: {
    // Backgrounds
    background: "bg-white",
    cardBg: "bg-white",
    inputBg: "bg-white",
    
    // Borders
    border: "border-gray-300",
    inputBorder: "border-gray-300 focus:border-blue-500",
    
    // Text
    text: "text-gray-900",
    textSecondary: "text-purple-600",
    label: "text-gray-700",
    placeholder: "text-gray-500",
    helperText: "text-gray-500",
    
    // Interactive
    button: "bg-blue-600 hover:bg-blue-700 text-white",
    buttonSecondary: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300",
    input: "block w-full rounded-lg border border-gray-300 bg-white focus:border-purple-500 focus:ring-purple-500",
    select: "block w-full rounded-lg border border-gray-300 bg-white focus:border-purple-500 focus:ring-purple-500",
    
    // Effects
    shadow: "shadow-md",
    focusRing: "focus:ring-1 focus:ring-blue-200",
  },
  dark: {
    // Backgrounds
    background: "bg-slate-900",
    cardBg: "bg-slate-800",
    inputBg: "bg-slate-700",
    
    // Borders
    border: "border-slate-700",
    inputBorder: "border-slate-600 focus:border-purple-500",
    
    // Text
    text: "text-white",
    textSecondary: "text-purple-400",
    label: "text-gray-300",
    placeholder: "text-gray-400",
    helperText: "text-gray-400",
    
    // Interactive
    button: "bg-purple-600 hover:bg-purple-700 text-white",
    buttonSecondary: "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600",
    input: "block w-full rounded-lg border border-slate-600 bg-slate-700 focus:border-purple-500 focus:ring-purple-500 text-white",
    select: "block w-full rounded-lg border border-slate-600 bg-slate-700 focus:border-purple-500 focus:ring-purple-500 text-white",
    
    // Effects
    shadow: "shadow-lg shadow-black/20",
    focusRing: "focus:ring-1 focus:ring-purple-500",
  }
} as const;

// Hook para usar classes do tema
export const getThemeClass = (isDark: boolean, key: keyof typeof themeConfig.light) => {
  return isDark ? themeConfig.dark[key] : themeConfig.light[key];
}; 