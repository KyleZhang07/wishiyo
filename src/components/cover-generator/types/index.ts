
// Define the template type with proper TypeScript types
export interface TemplateType {
  id: string;
  name: string;
  backgroundColor: string;
  titleStyle: {
    color: string;
    fontSize: string;
    fontWeight: string;
    textAlign: "center" | "right" | "left";
    offsetY: number;
    textTransform?: "uppercase" | "lowercase" | "capitalize" | "none";
  };
  subtitleStyle: {
    color: string;
    fontSize: string;
    fontWeight: string;
    fontStyle?: string;
    textTransform?: "uppercase" | "lowercase" | "capitalize" | "none";
  };
  authorStyle: {
    color: string;
    fontSize: string;
    fontWeight: string;
    textTransform?: "uppercase" | "lowercase" | "capitalize" | "none";
    letterSpacing?: string;
  };
  imageStyle?: React.CSSProperties;
}

// Define template presets
export const coverTemplates: Record<string, TemplateType> = {
  modern: {
    id: 'modern',
    name: 'Modern',
    backgroundColor: '#E8F4F8',
    titleStyle: {
      color: '#2C3E50',
      fontSize: '2.5rem',
      fontWeight: '700',
      textAlign: 'center',
      offsetY: 0,
      textTransform: 'none'
    },
    subtitleStyle: {
      color: '#16A085',
      fontSize: '1.2rem',
      fontWeight: '400',
      fontStyle: 'italic'
    },
    authorStyle: {
      color: '#34495E',
      fontSize: '1rem',
      fontWeight: '500',
      letterSpacing: '0.05rem'
    },
    imageStyle: {
      opacity: 0.9,
      filter: 'contrast(1.1)'
    }
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    backgroundColor: '#FFFFFF',
    titleStyle: {
      color: '#333333',
      fontSize: '2rem',
      fontWeight: '700',
      textAlign: 'center',
      offsetY: 0
    },
    subtitleStyle: {
      color: '#666666',
      fontSize: '1rem',
      fontWeight: '400'
    },
    authorStyle: {
      color: '#999999',
      fontSize: '0.9rem',
      fontWeight: '400'
    },
    imageStyle: {
      opacity: 0.8
    }
  },
  vintage: {
    id: 'vintage',
    name: 'Vintage',
    backgroundColor: '#F5E8D0',
    titleStyle: {
      color: '#8B4513',
      fontSize: '2.2rem',
      fontWeight: '700',
      textAlign: 'center',
      offsetY: 0,
      textTransform: 'uppercase'
    },
    subtitleStyle: {
      color: '#A0522D',
      fontSize: '1.1rem',
      fontWeight: '500',
      fontStyle: 'italic'
    },
    authorStyle: {
      color: '#6B4226',
      fontSize: '0.9rem',
      fontWeight: '400',
      textTransform: 'capitalize'
    },
    imageStyle: {
      filter: 'sepia(0.5)'
    }
  },
  colorful: {
    id: 'colorful',
    name: 'Colorful',
    backgroundColor: '#FFA07A',
    titleStyle: {
      color: '#FFFFFF',
      fontSize: '2.4rem',
      fontWeight: '700',
      textAlign: 'center',
      offsetY: 0
    },
    subtitleStyle: {
      color: '#F0F8FF',
      fontSize: '1.2rem',
      fontWeight: '400'
    },
    authorStyle: {
      color: '#FFFAFA',
      fontSize: '1rem',
      fontWeight: '500'
    },
    imageStyle: {
      filter: 'brightness(1.1)'
    }
  },
  dark: {
    id: 'dark',
    name: 'Dark',
    backgroundColor: '#2C3E50',
    titleStyle: {
      color: '#FFFFFF',
      fontSize: '2.5rem',
      fontWeight: '700',
      textAlign: 'center',
      offsetY: 0
    },
    subtitleStyle: {
      color: '#ECF0F1',
      fontSize: '1.2rem',
      fontWeight: '400'
    },
    authorStyle: {
      color: '#BDC3C7',
      fontSize: '1rem',
      fontWeight: '500'
    },
    imageStyle: {
      opacity: 0.7,
      filter: 'brightness(0.9)'
    }
  }
};
