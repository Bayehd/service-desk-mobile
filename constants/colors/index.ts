export const primaryColor = '#106ebe';
//const secondaryColor = '#c7fe00';
const errorColor = '#e74c3c';

export const Colors = {
  light: {
    text: '#666',
    background: '#fff',
    backgroundTint: '#f5f5f5', 
    primary: primaryColor,
    icon: '#687076',
   // secondary: secondaryColor,
    tint: primaryColor,
    tabIconDefault: 'rgb(29 78 216)',
    tabIconSelected: primaryColor,
    error: errorColor,
    border: '#E6E8EB',        
    placeholder: '#A9AEB4',
    
   
    cardBackground: '#fff',
    searchBackground: '#fff',
    titleColor: primaryColor,
    subtitleColor: '#666',
    technicianColor: '#333',
    dateColor: '#999',
    emptyStateColor: '#666',
    shadowColor: '#000',
    
 
    statusOpen: '#e3f2fd',
    statusClosed: '#ffebee',
    statusResolved: '#e8f5e9',
    statusUnassigned: '#fff3e0',
    
   
    statusOpenText: '#1565c0',
    statusClosedText: '#c62828',
    statusResolvedText: '#2e7d32',
    statusUnassignedText: '#ef6c00',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    backgroundTint: '#2a2b2c', 
    primary: primaryColor,
    //secondary: secondaryColor,
    tint: '#fff',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: primaryColor,
    error: '#ff6b6b',        
    border: '#2E3235',         
    placeholder: '#737A80',
    
    // Additional colors for dark mode
    cardBackground: '#1f2023',
    searchBackground: '#1f2023',
    titleColor: primaryColor,
    subtitleColor: '#B0B7BD',
    technicianColor: '#ECEDEE',
    dateColor: '#737A80',
    emptyStateColor: '#9BA1A6',
    shadowColor: '#000',
    
    // Status badge colors for dark mode
    statusOpen: '#1a365d',
    statusClosed: '#742a2a',
    statusResolved: '#22543d',
    statusUnassigned: '#744210',
    
    // Status text colors for dark mode
    statusOpenText: '#90cdf4',
    statusClosedText: '#fc8181',
    statusResolvedText: '#9ae6b4',
    statusUnassignedText: '#fbb965',
  },
} as const;