
export type TemplateType = {
  id: string;
  name: string;
  backgroundColor: string;
  titleStyle: {
    color: string;
    fontSize: string;
    fontWeight: string;
    textAlign: 'left' | 'center' | 'right';
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
      textAlign: 'center'
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
      opacity: '0.9'
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
      textAlign: 'center'
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
      opacity: '0.8'
    }
  },
  vibrant: {
    id: 'vibrant',
    name: 'Vibrant',
    backgroundColor: '#8B5CF6',
    titleStyle: {
      color: '#ffffff',
      fontSize: '2.5rem',
      fontWeight: 'bold',
      textAlign: 'center'
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
      opacity: '0.85'
    }
  }
};
