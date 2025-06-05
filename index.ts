import { registerRootComponent } from 'expo';

import App from './app';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
/*registerRootComponent(App); 

export interface ChatMessage {
    id: string;
    type: 'user' | 'bot';
    message: string;
    timestamp: Date;
  }
  
  export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
  }
  
  export interface Theme {
    colors: {
      primary: string;
      secondary: string;
      success: string;
      danger: string;
      warning: string;
      info: string;
      light: string;
      dark: string;
      white: string;
      black: string;
      gray: {
        [key: number]: string;
      };
    };
    sizes: {
      screenWidth: number;
      screenHeight: number;
      padding: {
        [key: string]: number;
      };
      margin: {
        [key: string]: number;
      };
      fontSize: {
        [key: string]: number;
      };
      borderRadius: {
        [key: string]: number;
      };
    };
    shadows: {
      [key: string]: object;
    };
  }
  
  export interface FloatingActionButtonProps {
    onPress?: () => void;
    routeName?: string;
    position?: 'left' | 'right';
    bottom?: number;
  }
  
  export interface MessageBubbleProps {
    message: string;
    isUser: boolean;
    timestamp?: string;
  }
  
  export interface ChatInputProps {
    value: string;
    onChangeText: (text: string) => void;
    onSubmit: (message: string) => void;
    loading?: boolean;
    placeholder?: string;
  }*/