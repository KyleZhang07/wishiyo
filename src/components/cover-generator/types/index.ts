
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
  imageStyle?: {
    opacity: string;
    filter?: string;
  };
  // Add missing properties
  spineStyle: {
    backgroundColor: string;
    authorColor: string;
    titleColor: string;
    authorFontSize?: string;
    titleFontSize?: string;
    topMargin?: number;
    bottomMargin?: number;
    authorTitleSpacing?: number;
    charSpacing?: number;
  };
  backCoverStyle: {
    backgroundColor: string;
    textColor: string;
    textAlign?: "center" | "right" | "left";
    marginLeft?: number;
    marginTop?: number;
    titleFontSize?: string;
    titleSpacing?: number;
    praiseFontSize?: string;
    lineHeight?: number;
    praiseSpacing?: number;
    sourceFontSize?: string;
    sourceSpacing?: number;
  };
  badgeStyle?: {
    backgroundColor: string;
    textColor: string;
  };
  bottomAreaColor?: string;
  bottomAreaHeight?: number;
  descriptionStyle?: {
    color: string;
    fontSize: string;
    fontWeight: string;
  };
}

// Export all types
export * from './layouts';
export * from './fonts';
export * from './canvas';

// Define template presets
export const coverTemplates: Record<string, TemplateType> = {
  modern: {
    id: 'modern',
    name: 'Modern',
    backgroundColor: '#FFEDD5',
    titleStyle: {
      color: '#F97316',
      fontSize: '2.5rem',
      fontWeight: '700',
      textAlign: 'center',
      offsetY: 0,
      textTransform: 'none'
    },
    subtitleStyle: {
      color: '#EA580C',
      fontSize: '1.2rem',
      fontWeight: '400',
      fontStyle: 'italic'
    },
    authorStyle: {
      color: '#9A3412',
      fontSize: '1rem',
      fontWeight: '500',
      letterSpacing: '0.05rem'
    },
    imageStyle: {
      opacity: '0.9',
      filter: 'contrast(1.1)'
    },
    spineStyle: {
      backgroundColor: '#FFEDD5',
      authorColor: '#9A3412',
      titleColor: '#F97316',
      authorFontSize: '24px',
      titleFontSize: '20px',
      topMargin: 60,
      bottomMargin: 60,
      authorTitleSpacing: 20,
      charSpacing: 0.8
    },
    backCoverStyle: {
      backgroundColor: '#FFEDD5',
      textColor: '#F97316',
      textAlign: 'left',
      marginLeft: 40,
      marginTop: 60,
      titleFontSize: '30px',
      titleSpacing: 40,
      praiseFontSize: '24px',
      lineHeight: 36,
      praiseSpacing: 20,
      sourceFontSize: '26px',
      sourceSpacing: 60
    }
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    backgroundColor: '#FFFFFF',
    titleStyle: {
      color: '#F97316',
      fontSize: '2rem',
      fontWeight: '700',
      textAlign: 'center',
      offsetY: 0
    },
    subtitleStyle: {
      color: '#EA580C',
      fontSize: '1rem',
      fontWeight: '400'
    },
    authorStyle: {
      color: '#9A3412',
      fontSize: '0.9rem',
      fontWeight: '400'
    },
    imageStyle: {
      opacity: '0.8'
    },
    spineStyle: {
      backgroundColor: '#FFFFFF',
      authorColor: '#9A3412',
      titleColor: '#F97316',
      authorFontSize: '22px',
      titleFontSize: '18px',
      topMargin: 60,
      bottomMargin: 60,
      authorTitleSpacing: 20,
      charSpacing: 0.75
    },
    backCoverStyle: {
      backgroundColor: '#FFFFFF',
      textColor: '#F97316',
      textAlign: 'left',
      marginLeft: 40,
      marginTop: 60,
      titleFontSize: '28px',
      titleSpacing: 40,
      praiseFontSize: '22px',
      lineHeight: 30,
      praiseSpacing: 20,
      sourceFontSize: '24px',
      sourceSpacing: 60
    }
  },
  vintage: {
    id: 'vintage',
    name: 'Vintage',
    backgroundColor: '#FED7AA',
    titleStyle: {
      color: '#EA580C',
      fontSize: '2.2rem',
      fontWeight: '700',
      textAlign: 'center',
      offsetY: 0,
      textTransform: 'uppercase'
    },
    subtitleStyle: {
      color: '#9A3412',
      fontSize: '1.1rem',
      fontWeight: '500',
      fontStyle: 'italic'
    },
    authorStyle: {
      color: '#7C2D12',
      fontSize: '0.9rem',
      fontWeight: '400',
      textTransform: 'capitalize'
    },
    imageStyle: {
      opacity: '1',
      filter: 'sepia(0.5)'
    },
    spineStyle: {
      backgroundColor: '#FED7AA',
      authorColor: '#7C2D12',
      titleColor: '#EA580C',
      authorFontSize: '22px',
      titleFontSize: '18px',
      topMargin: 60,
      bottomMargin: 60,
      authorTitleSpacing: 20,
      charSpacing: 0.75
    },
    backCoverStyle: {
      backgroundColor: '#FED7AA',
      textColor: '#EA580C',
      textAlign: 'left',
      marginLeft: 40,
      marginTop: 60,
      titleFontSize: '28px',
      titleSpacing: 40,
      praiseFontSize: '22px',
      lineHeight: 30,
      praiseSpacing: 20,
      sourceFontSize: '24px',
      sourceSpacing: 60
    }
  },
  colorful: {
    id: 'colorful',
    name: 'Colorful',
    backgroundColor: '#FFEDD5',
    titleStyle: {
      color: '#F97316',
      fontSize: '2.4rem',
      fontWeight: '700',
      textAlign: 'center',
      offsetY: 0
    },
    subtitleStyle: {
      color: '#EA580C',
      fontSize: '1.2rem',
      fontWeight: '400'
    },
    authorStyle: {
      color: '#9A3412',
      fontSize: '1rem',
      fontWeight: '500'
    },
    imageStyle: {
      opacity: '1',
      filter: 'brightness(1.1)'
    },
    spineStyle: {
      backgroundColor: '#FFEDD5',
      authorColor: '#9A3412',
      titleColor: '#F97316',
      authorFontSize: '22px',
      titleFontSize: '18px',
      topMargin: 60,
      bottomMargin: 60,
      authorTitleSpacing: 20,
      charSpacing: 0.75
    },
    backCoverStyle: {
      backgroundColor: '#FFEDD5',
      textColor: '#F97316',
      textAlign: 'left',
      marginLeft: 40,
      marginTop: 60,
      titleFontSize: '28px',
      titleSpacing: 40,
      praiseFontSize: '22px',
      lineHeight: 30,
      praiseSpacing: 20,
      sourceFontSize: '24px',
      sourceSpacing: 60
    }
  },
  dark: {
    id: 'dark',
    name: 'Dark',
    backgroundColor: '#2C3E50',
    titleStyle: {
      color: '#F97316',
      fontSize: '2.5rem',
      fontWeight: '700',
      textAlign: 'center',
      offsetY: 0
    },
    subtitleStyle: {
      color: '#FDBA74',
      fontSize: '1.2rem',
      fontWeight: '400'
    },
    authorStyle: {
      color: '#FED7AA',
      fontSize: '1rem',
      fontWeight: '500'
    },
    imageStyle: {
      opacity: '0.7',
      filter: 'brightness(0.9)'
    },
    spineStyle: {
      backgroundColor: '#2C3E50',
      authorColor: '#FED7AA',
      titleColor: '#F97316',
      authorFontSize: '22px',
      titleFontSize: '18px',
      topMargin: 60,
      bottomMargin: 60,
      authorTitleSpacing: 20,
      charSpacing: 0.75
    },
    backCoverStyle: {
      backgroundColor: '#2C3E50',
      textColor: '#F97316',
      textAlign: 'left',
      marginLeft: 40,
      marginTop: 60,
      titleFontSize: '28px',
      titleSpacing: 40,
      praiseFontSize: '22px',
      lineHeight: 30,
      praiseSpacing: 20,
      sourceFontSize: '24px',
      sourceSpacing: 60
    }
  },
  // Additional templates for specific themes
  'pastel-beige': {
    id: 'pastel-beige',
    name: 'Pastel Orange',
    backgroundColor: '#FFEDD5', 
    titleStyle: {
      color: '#F97316', 
      fontSize: '2.5rem',
      fontWeight: '700',
      textAlign: 'center',
      offsetY: 0
    },
    subtitleStyle: {
      color: '#EA580C', 
      fontSize: '1.2rem',
      fontWeight: '400'
    },
    authorStyle: {
      color: '#F97316', 
      fontSize: '1rem',
      fontWeight: '500'
    },
    imageStyle: {
      opacity: '1',
      filter: 'none'
    },
    spineStyle: {
      backgroundColor: '#FFEDD5',
      authorColor: '#F97316',
      titleColor: '#EA580C',
      authorFontSize: '22px',
      titleFontSize: '18px',
      topMargin: 60,
      bottomMargin: 60,
      authorTitleSpacing: 20,
      charSpacing: 0.75
    },
    backCoverStyle: {
      backgroundColor: '#FFEDD5',
      textColor: '#F97316',
      textAlign: 'left',
      marginLeft: 40,
      marginTop: 60,
      titleFontSize: '28px',
      titleSpacing: 40,
      praiseFontSize: '22px',
      lineHeight: 30,
      praiseSpacing: 20,
      sourceFontSize: '24px',
      sourceSpacing: 60
    }
  },
  'vibrant-green': {
    id: 'vibrant-green',
    name: 'Vibrant Orange',
    backgroundColor: '#FED7AA', 
    titleStyle: {
      color: '#F97316', 
      fontSize: '2.5rem',
      fontWeight: '700',
      textAlign: 'center',
      offsetY: 0
    },
    subtitleStyle: {
      color: '#FFFFFF', 
      fontSize: '1.2rem',
      fontWeight: '400'
    },
    authorStyle: {
      color: '#FFFFFF', 
      fontSize: '1rem',
      fontWeight: '500'
    },
    imageStyle: {
      opacity: '1',
      filter: 'none'
    },
    spineStyle: {
      backgroundColor: '#FED7AA',
      authorColor: '#FFFFFF',
      titleColor: '#F97316',
      authorFontSize: '22px',
      titleFontSize: '18px',
      topMargin: 60,
      bottomMargin: 60,
      authorTitleSpacing: 20,
      charSpacing: 0.75
    },
    backCoverStyle: {
      backgroundColor: '#FED7AA',
      textColor: '#F97316',
      textAlign: 'left',
      marginLeft: 40,
      marginTop: 60,
      titleFontSize: '28px',
      titleSpacing: 40,
      praiseFontSize: '22px',
      lineHeight: 30,
      praiseSpacing: 20,
      sourceFontSize: '24px',
      sourceSpacing: 60
    }
  },
  'classic': {
    id: 'classic',
    name: 'Classic',
    backgroundColor: '#000000', 
    titleStyle: {
      color: '#F97316', 
      fontSize: '2.5rem',
      fontWeight: '700',
      textAlign: 'center',
      offsetY: 0
    },
    subtitleStyle: {
      color: '#FFFFFF', 
      fontSize: '1.2rem',
      fontWeight: '400'
    },
    authorStyle: {
      color: '#FFFFFF', 
      fontSize: '1rem',
      fontWeight: '500'
    },
    imageStyle: {
      opacity: '1',
      filter: 'none'
    },
    spineStyle: {
      backgroundColor: '#000000',
      authorColor: '#FFFFFF',
      titleColor: '#F97316',
      authorFontSize: '22px',
      titleFontSize: '18px',
      topMargin: 60,
      bottomMargin: 60,
      authorTitleSpacing: 20,
      charSpacing: 0.75
    },
    backCoverStyle: {
      backgroundColor: '#000000',
      textColor: '#FFFFFF',
      textAlign: 'left',
      marginLeft: 40,
      marginTop: 60,
      titleFontSize: '28px',
      titleSpacing: 40,
      praiseFontSize: '22px',
      lineHeight: 30,
      praiseSpacing: 20,
      sourceFontSize: '24px',
      sourceSpacing: 60
    },
    bottomAreaColor: '#F97316',
    bottomAreaHeight: 0.15
  },
  'bestseller': {
    id: 'bestseller',
    name: 'Bestseller',
    backgroundColor: '#000000', 
    titleStyle: {
      color: '#F97316', 
      fontSize: '2.5rem',
      fontWeight: '700',
      textAlign: 'center',
      offsetY: 0
    },
    subtitleStyle: {
      color: '#F97316', 
      fontSize: '1.2rem',
      fontWeight: '400'
    },
    authorStyle: {
      color: '#FFFFFF', 
      fontSize: '1rem',
      fontWeight: '500'
    },
    imageStyle: {
      opacity: '1',
      filter: 'none'
    },
    spineStyle: {
      backgroundColor: '#000000',
      authorColor: '#FFFFFF',
      titleColor: '#F97316',
      authorFontSize: '22px',
      titleFontSize: '18px',
      topMargin: 60,
      bottomMargin: 60,
      authorTitleSpacing: 20,
      charSpacing: 0.75
    },
    backCoverStyle: {
      backgroundColor: '#000000',
      textColor: '#F97316',
      textAlign: 'left',
      marginLeft: 40,
      marginTop: 60,
      titleFontSize: '28px',
      titleSpacing: 40,
      praiseFontSize: '22px',
      lineHeight: 30,
      praiseSpacing: 20,
      sourceFontSize: '24px',
      sourceSpacing: 60
    },
    badgeStyle: {
      backgroundColor: '#F97316',
      textColor: '#000000'
    }
  }
};
