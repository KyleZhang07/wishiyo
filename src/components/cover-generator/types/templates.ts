
export type TemplateType = {
  id: string;
  name: string;
  backgroundColor: string;
  titleStyle: {
    color: string;
    fontSize: string;
    fontWeight: string;
    textAlign: 'left' | 'center' | 'right';
    offsetY: number;
    textTransform?: string;
  };
  subtitleStyle: {
    color: string;
    fontSize: string;
    fontWeight: string;
    fontStyle?: string;
    textTransform?: string;
  };
  authorStyle: {
    color: string;
    fontSize: string;
    fontWeight: string;
    textTransform?: string;
    letterSpacing?: string;
  };
  imageStyle: {
    filter: string;
    opacity: string;
    borderRadius: string;
  };
  spineStyle: {
    backgroundColor: string;
    titleColor: string;
    authorColor: string;
  };
  backCoverStyle: {
    backgroundColor: string;
    textColor: string;
    summaryFontSize: string;
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
};

export const coverTemplates: { [key: string]: TemplateType } = {
  modern: {
    id: 'modern',
    name: 'Modern',
    backgroundColor: '#ECE8D9',
    titleStyle: {
      color: '#F97316',
      fontSize: '2.5rem',
      fontWeight: 'bold',
      textAlign: 'center',
      offsetY: 0.3
    },
    subtitleStyle: {
      color: '#FDBA74',
      fontSize: '1.25rem',
      fontWeight: 'normal'
    },
    authorStyle: {
      color: '#EA580C',
      fontSize: '1rem',
      fontWeight: 'normal'
    },
    imageStyle: {
      filter: 'brightness(0.7)',
      opacity: '0.9',
      borderRadius: '0'
    },
    spineStyle: {
      backgroundColor: '#1A1F2C',
      titleColor: '#F97316',
      authorColor: '#FDBA74'
    },
    backCoverStyle: {
      backgroundColor: '#1A1F2C',
      textColor: '#FDBA74',
      summaryFontSize: '1rem'
    }
  },
  'minimal': {
    id: 'minimal',
    name: 'Minimal Gray',
    backgroundColor: '#D9D9D9', 
    titleStyle: {
      color: '#F97316', 
      fontSize: '3.5rem', 
      fontWeight: 'bold',
      textAlign: 'center',
      offsetY: 0.75 
    },
    subtitleStyle: {
      color: '#FFFFFF', 
      fontSize: '1.6rem', 
      fontWeight: 'normal'
    },
    authorStyle: {
      color: '#EA580C', 
      fontSize: '2.5rem',
      fontWeight: 'bold'
    },
    imageStyle: {
      filter: 'grayscale(100%)', 
      opacity: '1',
      borderRadius: '0' 
    },
    spineStyle: {
      backgroundColor: '#000000',
      titleColor: '#F97316',
      authorColor: '#EA580C'
    },
    backCoverStyle: {
      backgroundColor: '#D9D9D9',
      textColor: '#000000',
      summaryFontSize: '1rem'
    }
  },
  vibrant: {
    id: 'vibrant',
    name: 'Vibrant',
    backgroundColor: '#FEC6A1',
    titleStyle: {
      color: '#F97316',
      fontSize: '2.5rem',
      fontWeight: 'bold',
      textAlign: 'center',
      offsetY: 0.3
    },
    subtitleStyle: {
      color: '#EA580C',
      fontSize: '1.25rem',
      fontWeight: 'normal'
    },
    authorStyle: {
      color: '#7C2D12',
      fontSize: '1rem',
      fontWeight: 'normal'
    },
    imageStyle: {
      filter: 'brightness(0.6) contrast(1.2)',
      opacity: '0.85',
      borderRadius: '0'
    },
    spineStyle: {
      backgroundColor: '#4361EE',
      titleColor: '#F97316',
      authorColor: '#7C2D12'
    },
    backCoverStyle: {
      backgroundColor: '#4361EE',
      textColor: '#EA580C',
      summaryFontSize: '1rem'
    }
  },
  classic: {
    id: 'classic',
    name: 'Classic',
    backgroundColor: '#000000',
    titleStyle: {
      color: '#F97316',
      fontSize: '3rem',
      fontWeight: 'bold',
      textAlign: 'center',
      offsetY: 0.3,
      textTransform: 'uppercase'
    },
    subtitleStyle: {
      color: '#FFFFFF',
      fontSize: '1.25rem',
      fontWeight: 'normal',
      fontStyle: 'italic',
      textTransform: 'lowercase'
    },
    authorStyle: {
      color: '#FFFFFF',
      fontSize: '1.2rem',
      fontWeight: 'normal',
      textTransform: 'uppercase',
      letterSpacing: '0.1em'
    },
    bottomAreaColor: '#F97316',
    bottomAreaHeight: 0.15,
    descriptionStyle: {
      color: '#FFFFFF',
      fontSize: '1rem',
      fontWeight: 'normal'
    },
    imageStyle: {
      filter: 'none',
      opacity: '1.0',
      borderRadius: '50%'
    },
    spineStyle: {
      backgroundColor: '#000000',
      titleColor: '#F97316',
      authorColor: '#FFFFFF'
    },
    backCoverStyle: {
      backgroundColor: '#000000',
      textColor: '#FFFFFF',
      summaryFontSize: '1rem'
    }
  },
  'pastel-beige': {
    id: 'pastel-beige',
    name: 'Sweet Orange',
    backgroundColor: '#FFEDD5', 
    titleStyle: {
      color: '#F97316', 
      fontSize: '3rem',
      fontWeight: 'bold',
      textAlign: 'center',
      offsetY: 0.3 
    },
    subtitleStyle: {
      color: '#EA580C', 
      fontSize: '1.5rem',
      fontWeight: 'normal',
      fontStyle: 'normal'
    },
    authorStyle: {
      color: '#F97316', 
      fontSize: '1.6rem',
      fontWeight: 'bold'
    },
    imageStyle: {
      filter: 'brightness(1.1)', 
      opacity: '1',
      borderRadius: '50%' 
    },
    spineStyle: {
      backgroundColor: '#FFEDD5',
      titleColor: '#F97316',
      authorColor: '#EA580C'
    },
    backCoverStyle: {
      backgroundColor: '#FFEDD5',
      textColor: '#F97316',
      summaryFontSize: '1.1rem'
    }
  },
  'vibrant-green': {
    id: 'vibrant-green',
    name: 'Cream Portrait',
    backgroundColor: '#E6DEC9',
    titleStyle: {
      color: '#F97316',
      fontSize: '3.5rem',
      fontWeight: 'bold',
      textAlign: 'center',
      offsetY: 0.35
    },
    subtitleStyle: {
      color: '#FFFFFF',
      fontSize: '1.5rem',
      fontWeight: 'normal'
    },
    authorStyle: {
      color: '#FFFFFF',
      fontSize: '1.8rem',
      fontWeight: 'normal'
    },
    imageStyle: {
      filter: 'none',
      opacity: '1',
      borderRadius: '0'
    },
    spineStyle: {
      backgroundColor: '#E6DEC9',
      titleColor: '#F97316',
      authorColor: '#FFFFFF'
    },
    backCoverStyle: {
      backgroundColor: '#E6DEC9',
      textColor: '#FFFFFF',
      summaryFontSize: '1rem'
    }
  },
  bestseller: {
    id: 'bestseller',
    name: 'Bestseller',
    backgroundColor: '#000000',
    titleStyle: {
      color: '#F97316',
      fontSize: '3rem',
      fontWeight: 'bold',
      textAlign: 'center',
      offsetY: 0.3
    },
    subtitleStyle: {
      color: '#ffffff',
      fontSize: '1rem',
      fontWeight: 'normal'
    },
    authorStyle: {
      color: '#ffffff',
      fontSize: '1.8rem',
      fontWeight: 'bold'
    },
    imageStyle: {
      filter: 'none',
      opacity: '1',
      borderRadius: '0px'
    },
    spineStyle: {
      backgroundColor: '#4361EE',
      titleColor: '#F97316',
      authorColor: '#ffffff'
    },
    backCoverStyle: {
      backgroundColor: '#000000',
      textColor: '#ffffff',
      summaryFontSize: '16px'
    },
    badgeStyle: {
      backgroundColor: '#F97316',
      textColor: '#000000'
    }
  }
};
