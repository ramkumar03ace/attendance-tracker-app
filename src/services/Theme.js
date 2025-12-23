import { MD3DarkTheme } from 'react-native-paper';

export const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#64B5F6',
    onPrimary: '#002E60',
    secondary: '#4FC3F7',
    onSecondary: '#00344F',
    background: '#0D1117',
    surface: '#1E1E1E',
    onSurface: '#E0E0E0',
    error: '#CF6679',
    elevation: {
      level0: 'transparent',
      level1: '#1E1E1E',
      level2: '#232323',
      level3: '#252525',
      level4: '#272727',
      level5: '#2C2C2C',
    }
  },
};
