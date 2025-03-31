
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
      opacity: '0.9',
      filter: 'contrast(1.1)'
    },
    spineStyle: {
      backgroundColor: '#E8F4F8',
      authorColor: '#34495E',
      titleColor: '#2C3E50',
      authorFontSize: '24px',
      titleFontSize: '20px',
      topMargin: 60,
      bottomMargin: 60,
      authorTitleSpacing: 20,
      charSpacing: 0.8
    },
    backCoverStyle: {
      backgroundColor: '#E8F4F8',
      textColor: '#2C3E50',
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
      opacity: '0.8'
    },
    spineStyle: {
      backgroundColor: '#FFFFFF',
      authorColor: '#999999',
      titleColor: '#333333',
      authorFontSize: '22px',
      titleFontSize: '18px',
      topMargin: 60,
      bottomMargin: 60,
      authorTitleSpacing: 20,
      charSpacing: 0.75
    },
    backCoverStyle: {
      backgroundColor: '#FFFFFF',
      textColor: '#333333',
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
      opacity: '1',
      filter: 'sepia(0.5)'
    },
    spineStyle: {
      backgroundColor: '#F5E8D0',
      authorColor: '#6B4226',
      titleColor: '#8B4513',
      authorFontSize: '22px',
      titleFontSize: '18px',
      topMargin: 60,
      bottomMargin: 60,
      authorTitleSpacing: 20,
      charSpacing: 0.75
    },
    backCoverStyle: {
      backgroundColor: '#F5E8D0',
      textColor: '#8B4513',
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
      opacity: '1',
      filter: 'brightness(1.1)'
    },
    spineStyle: {
      backgroundColor: '#FFA07A',
      authorColor: '#FFFAFA',
      titleColor: '#FFFFFF',
      authorFontSize: '22px',
      titleFontSize: '18px',
      topMargin: 60,
      bottomMargin: 60,
      authorTitleSpacing: 20,
      charSpacing: 0.75
    },
    backCoverStyle: {
      backgroundColor: '#FFA07A',
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
      opacity: '0.7',
      filter: 'brightness(0.9)'
    },
    spineStyle: {
      backgroundColor: '#2C3E50',
      authorColor: '#BDC3C7',
      titleColor: '#FFFFFF',
      authorFontSize: '22px',
      titleFontSize: '18px',
      topMargin: 60,
      bottomMargin: 60,
      authorTitleSpacing: 20,
      charSpacing: 0.75
    },
    backCoverStyle: {
      backgroundColor: '#2C3E50',
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
    }
  },
  // Additional templates for specific themes
  'pastel-beige': {
    id: 'pastel-beige',
    name: 'Pastel Beige',
    backgroundColor: '#FFC0CB', // Pink background
    titleStyle: {
      color: '#8A2BE2', // Purple title
      fontSize: '2.5rem',
      fontWeight: '700',
      textAlign: 'center',
      offsetY: 0
    },
    subtitleStyle: {
      color: '#9400D3', // Dark purple subtitle
      fontSize: '1.2rem',
      fontWeight: '400'
    },
    authorStyle: {
      color: '#8A2BE2', // Purple author name
      fontSize: '1rem',
      fontWeight: '500'
    },
    imageStyle: {
      opacity: '1',
      filter: 'none'
    },
    spineStyle: {
      backgroundColor: '#FFC0CB',
      authorColor: '#8A2BE2',
      titleColor: '#9400D3',
      authorFontSize: '22px',
      titleFontSize: '18px',
      topMargin: 60,
      bottomMargin: 60,
      authorTitleSpacing: 20,
      charSpacing: 0.75
    },
    backCoverStyle: {
      backgroundColor: '#FFC0CB',
      textColor: '#8A2BE2',
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
    name: 'Vibrant Green',
    backgroundColor: '#E6DEC9', // Cream background
    titleStyle: {
      color: '#D4AF37', // Gold title
      fontSize: '2.5rem',
      fontWeight: '700',
      textAlign: 'center',
      offsetY: 0
    },
    subtitleStyle: {
      color: '#FFFFFF', // White subtitle
      fontSize: '1.2rem',
      fontWeight: '400'
    },
    authorStyle: {
      color: '#FFFFFF', // White author name
      fontSize: '1rem',
      fontWeight: '500'
    },
    imageStyle: {
      opacity: '1',
      filter: 'none'
    },
    spineStyle: {
      backgroundColor: '#E6DEC9',
      authorColor: '#FFFFFF',
      titleColor: '#D4AF37',
      authorFontSize: '22px',
      titleFontSize: '18px',
      topMargin: 60,
      bottomMargin: 60,
      authorTitleSpacing: 20,
      charSpacing: 0.75
    },
    backCoverStyle: {
      backgroundColor: '#E6DEC9',
      textColor: '#D4AF37',
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
    backgroundColor: '#000000', // Black background
    titleStyle: {
      color: '#FFFFFF', // White title
      fontSize: '2.5rem',
      fontWeight: '700',
      textAlign: 'center',
      offsetY: 0
    },
    subtitleStyle: {
      color: '#FFFFFF', // White subtitle
      fontSize: '1.2rem',
      fontWeight: '400'
    },
    authorStyle: {
      color: '#FFFFFF', // White author name
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
      titleColor: '#FFFFFF',
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
    bottomAreaHeight: 0.15,
    bottomAreaColor: '#9B0000'
  },
  'bestseller': {
    id: 'bestseller',
    name: 'Bestseller',
    backgroundColor: '#000000', // Black background
    titleStyle: {
      color: '#FFC300', // Yellow title
      fontSize: '2.5rem',
      fontWeight: '700',
      textAlign: 'center',
      offsetY: 0
    },
    subtitleStyle: {
      color: '#FFC300', // Yellow subtitle
      fontSize: '1.2rem',
      fontWeight: '400'
    },
    authorStyle: {
      color: '#FFFFFF', // White author name
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
      titleColor: '#FFC300',
      authorFontSize: '22px',
      titleFontSize: '18px',
      topMargin: 60,
      bottomMargin: 60,
      authorTitleSpacing: 20,
      charSpacing: 0.75
    },
    backCoverStyle: {
      backgroundColor: '#000000',
      textColor: '#FFC300',
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
  }
};
