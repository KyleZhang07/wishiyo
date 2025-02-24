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
  };
  subtitleStyle: {
    color: string;
    fontSize: string;
    fontWeight: string;
  };
  authorStyle: {
    color: string;
    fontSize: string;
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
};

export const coverTemplates: { [key: string]: TemplateType } = {
  modern: {
    id: 'modern',
    name: 'Modern',
    backgroundColor: '#1A1F2C',
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
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    backgroundColor: '#F1F0FB',
    titleStyle: {
      color: '#1A1F2C',
      fontSize: '2.5rem',
      fontWeight: 'bold',
      textAlign: 'center',
      offsetY: 0.3
    },
    subtitleStyle: {
      color: '#6E59A5',
      fontSize: '1.25rem',
      fontWeight: 'normal'
    },
    authorStyle: {
      color: '#7E69AB',
      fontSize: '1rem'
    },
    imageStyle: {
      filter: 'brightness(0.9)',
      opacity: '0.8',
      borderRadius: '0'
    },
    spineStyle: {
      backgroundColor: '#F1F0FB',
      titleColor: '#1A1F2C',
      authorColor: '#7E69AB'
    },
    backCoverStyle: {
      backgroundColor: '#F1F0FB',
      textColor: '#6E59A5',
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
    backgroundColor: '#FFECD1',
    titleStyle: {
      color: '#C41E3A',
      fontSize: '2.5rem',
      fontWeight: 'bold',
      textAlign: 'center',
      offsetY: 0.3
    },
    subtitleStyle: {
      color: '#333333',
      fontSize: '1.25rem',
      fontWeight: 'normal'
    },
    authorStyle: {
      color: '#333333',
      fontSize: '1rem'
    },
    imageStyle: {
      filter: 'sepia(0.2)',
      opacity: '0.9',
      borderRadius: '0'
    },
    spineStyle: {
      backgroundColor: '#C41E3A',
      titleColor: '#FFFFFF',
      authorColor: '#FFECD1'
    },
    backCoverStyle: {
      backgroundColor: '#FFECD1',
      textColor: '#333333',
      summaryFontSize: '1rem'
    }
  },
  'vibrant-green': {
    id: 'vibrant-green',
    name: 'Vibrant Green',
    backgroundColor: '#121212',
    titleStyle: {
      color: '#7CFC00',
      fontSize: '3rem',
      fontWeight: 'bold',
      textAlign: 'center',
      offsetY: 0.7
    },
    subtitleStyle: {
      color: '#FFFFFF',
      fontSize: '1.25rem',
      fontWeight: 'normal'
    },
    authorStyle: {
      color: '#FFFFFF',
      fontSize: '1rem'
    },
    imageStyle: {
      filter: 'brightness(1.1) contrast(1.1)',
      opacity: '1.0',
      borderRadius: '0'
    },
    spineStyle: {
      backgroundColor: '#121212',
      titleColor: '#7CFC00',
      authorColor: '#FFFFFF'
    },
    backCoverStyle: {
      backgroundColor: '#121212',
      textColor: '#7CFC00',
      summaryFontSize: '1rem'
    }
  }
};
