
export interface TemplateType {
  backgroundColor: string;
  titleStyle: React.CSSProperties;
  subtitleStyle: React.CSSProperties;
  authorStyle: React.CSSProperties;
  imageStyle?: React.CSSProperties;
}

export const coverTemplates: Record<string, TemplateType> = {
  modern: {
    backgroundColor: '#f8f9fa',
    titleStyle: {
      fontSize: '2.5rem',
      fontWeight: 'bold',
      color: '#212529',
      textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
    },
    subtitleStyle: {
      fontSize: '1.2rem',
      fontWeight: 'normal',
      color: '#495057',
      fontStyle: 'italic'
    },
    authorStyle: {
      fontSize: '1rem',
      fontWeight: 'medium',
      color: '#6c757d'
    },
    imageStyle: {
      opacity: 0.9
    }
  },
  classic: {
    backgroundColor: '#f5f5dc', // Beige
    titleStyle: {
      fontSize: '2.2rem',
      fontWeight: 'bold',
      color: '#3a3a3a',
      fontFamily: 'serif'
    },
    subtitleStyle: {
      fontSize: '1.1rem',
      fontWeight: 'normal',
      color: '#555555',
      fontFamily: 'serif'
    },
    authorStyle: {
      fontSize: '1rem',
      fontWeight: 'medium',
      color: '#666666',
      fontFamily: 'serif'
    },
    imageStyle: {
      opacity: 0.8,
      filter: 'sepia(20%)'
    }
  },
  minimalist: {
    backgroundColor: '#ffffff',
    titleStyle: {
      fontSize: '2rem',
      fontWeight: '300',
      color: '#333333',
      letterSpacing: '1px'
    },
    subtitleStyle: {
      fontSize: '1rem',
      fontWeight: '300',
      color: '#666666',
      letterSpacing: '0.5px'
    },
    authorStyle: {
      fontSize: '0.9rem',
      fontWeight: '300',
      color: '#888888',
      letterSpacing: '0.5px'
    },
    imageStyle: {
      opacity: 0.7,
      filter: 'grayscale(40%)'
    }
  },
  romantic: {
    backgroundColor: '#fff0f5', // LavenderBlush
    titleStyle: {
      fontSize: '2.4rem',
      fontWeight: 'bold',
      color: '#d81b60',
      fontFamily: 'cursive'
    },
    subtitleStyle: {
      fontSize: '1.2rem',
      fontWeight: 'normal',
      color: '#ad1457',
      fontStyle: 'italic'
    },
    authorStyle: {
      fontSize: '1rem',
      fontWeight: 'medium',
      color: '#c2185b'
    },
    imageStyle: {
      opacity: 0.8,
      filter: 'brightness(1.05) saturate(1.1)'
    }
  },
  dark: {
    backgroundColor: '#212121',
    titleStyle: {
      fontSize: '2.5rem',
      fontWeight: 'bold',
      color: '#ffffff',
      textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
    },
    subtitleStyle: {
      fontSize: '1.2rem',
      fontWeight: 'normal',
      color: '#e0e0e0'
    },
    authorStyle: {
      fontSize: '1rem',
      fontWeight: 'medium',
      color: '#bdbdbd'
    },
    imageStyle: {
      opacity: 0.7,
      filter: 'brightness(0.8) contrast(1.2)'
    }
  }
};
