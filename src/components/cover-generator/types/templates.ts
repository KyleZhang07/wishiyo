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
      color: '#ffffff',
      fontSize: '2.5rem',
      fontWeight: 'bold',
      textAlign: 'center',
      offsetY: 0.3
    },
    subtitleStyle: {
      color: '#D6BCFA',
      fontSize: '1.25rem',
      fontWeight: 'normal'
    },
    authorStyle: {
      color: '#9b87f5',
      fontSize: '1rem'
    },
    imageStyle: {
      filter: 'brightness(0.7)',
      opacity: '0.9',
      borderRadius: '0'
    },
    spineStyle: {
      backgroundColor: '#1A1F2C',
      titleColor: '#ffffff',
      authorColor: '#9b87f5'
    },
    backCoverStyle: {
      backgroundColor: '#1A1F2C',
      textColor: '#D6BCFA',
      summaryFontSize: '1rem'
    }
  },
  'minimal': {
    id: 'minimal',
    name: 'Minimal Gray',
    backgroundColor: '#C2C2C2',
    titleStyle: {
      color: '#FFFFFF',
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
      color: '#FFFFFF',
      fontSize: '2.5rem',
      fontWeight: 'bold'
    },
    imageStyle: {
      filter: 'grayscale(100%)',
      opacity: 1,
      borderRadius: '0'
    },
    spineStyle: {
      backgroundColor: '#000000',
      titleColor: '#FFFFFF',
      authorColor: '#FFFFFF'
    },
    backCoverStyle: {
      backgroundColor: '#ECECEC',
      textColor: '#000000',
      summaryFontSize: '1rem'
    }
  },
  vibrant: {
    id: 'vibrant',
    name: 'Vibrant',
    backgroundColor: '#4361EE',
    titleStyle: {
      color: '#FFCA3A',
      fontSize: '2.5rem',
      fontWeight: 'bold',
      textAlign: 'center',
      offsetY: 0.3
    },
    subtitleStyle: {
      color: '#FDE1D3',
      fontSize: '1.25rem',
      fontWeight: 'normal'
    },
    authorStyle: {
      color: '#F2FCE2',
      fontSize: '1rem'
    },
    imageStyle: {
      filter: 'brightness(0.6) contrast(1.2)',
      opacity: '0.85',
      borderRadius: '0'
    },
    spineStyle: {
      backgroundColor: '#4361EE',
      titleColor: '#FFCA3A',
      authorColor: '#F2FCE2'
    },
    backCoverStyle: {
      backgroundColor: '#4361EE',
      textColor: '#FDE1D3',
      summaryFontSize: '1rem'
    }
  },
  classic: {
    id: 'classic',
    name: 'Classic',
    backgroundColor: '#000000',
    titleStyle: {
      color: '#C75B7D',
      fontSize: '3rem',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      textAlign: 'center',
      offsetY: 0
    },
    subtitleStyle: {
      color: '#C75B7D',
      fontSize: '1.25rem',
      fontWeight: 'normal',
      fontStyle: 'italic',
      textTransform: 'lowercase'
    },
    authorStyle: {
      color: '#C75B7D',
      fontSize: '1.2rem',
      fontWeight: 'normal',
      textTransform: 'uppercase',
      letterSpacing: '0.1em'
    },
    bottomAreaColor: '#9B0000',
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
      titleColor: '#FFFFFF',
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
    name: 'Sweet Pink',
    backgroundColor: '#FFC0CB',
    titleStyle: {
      color: '#8A2BE2',
      fontSize: '3rem',
      fontWeight: 'bold',
      textAlign: 'center',
      offsetY: 0.3
    },
    subtitleStyle: {
      color: '#9400D3',
      fontSize: '1.5rem',
      fontWeight: 'normal',
      fontStyle: 'normal'
    },
    authorStyle: {
      color: '#8A2BE2',
      fontSize: '1.6rem',
      fontWeight: 'bold'
    },
    imageStyle: {
      filter: 'brightness(1.1)',
      opacity: 1,
      borderRadius: '50%'
    },
    spineStyle: {
      backgroundColor: '#FFC0CB',
      titleColor: '#8A2BE2',
      authorColor: '#9400D3'
    },
    backCoverStyle: {
      backgroundColor: '#FFC0CB',
      textColor: '#8A2BE2',
      summaryFontSize: '1.1rem'
    }
  },
  'vibrant-green': {
    id: 'vibrant-green',
    name: 'Modern Green',
    backgroundColor: '#E5DDCA',
    titleStyle: {
      color: '#D7B33E',
      fontSize: '2.5rem',
      fontWeight: 'bold',
      textAlign: 'center',
      offsetY: 0.3
    },
    subtitleStyle: {
      color: '#A3896B',
      fontSize: '1.25rem',
      fontWeight: 'normal'
    },
    authorStyle: {
      color: '#A3896B',
      fontSize: '1.8rem',
      fontWeight: 'normal'
    },
    imageStyle: {
      filter: 'none',
      opacity: '1',
      borderRadius: '0'
    },
    spineStyle: {
      backgroundColor: '#E5DDCA',
      titleColor: '#D7B33E',
      authorColor: '#A3896B'
    },
    backCoverStyle: {
      backgroundColor: '#E5DDCA',
      textColor: '#A3896B',
      summaryFontSize: '1rem'
    }
  },
  bestseller: {
    id: 'bestseller',
    name: 'Bestseller',
    backgroundColor: '#000000',
    titleStyle: {
      color: '#FFC300',
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
      fontSize: '1.8rem'
    },
    imageStyle: {
      filter: 'none',
      opacity: '1',
      borderRadius: '0px'
    },
    spineStyle: {
      backgroundColor: '#4361EE',
      titleColor: '#FFC300',
      authorColor: '#ffffff'
    },
    backCoverStyle: {
      backgroundColor: '#000000',
      textColor: '#ffffff',
      summaryFontSize: '16px'
    },
    badgeStyle: {
      backgroundColor: '#FFC300',
      textColor: '#000000'
    },
    bottomAreaColor: '#4361EE',
    bottomAreaHeight: 0.15
  }
};
