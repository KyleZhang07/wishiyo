
import { TemplateType } from '.';

type TextTransformType = 'none' | 'capitalize' | 'uppercase' | 'lowercase';

interface TitleStyleType {
  color: string;
  fontSize: string;
  fontWeight: string;
  textAlign: 'center' | 'right' | 'left';
  offsetY: number;
  textTransform?: TextTransformType;
}

interface SubtitleStyleType {
  color: string;
  fontSize: string;
  fontWeight: string;
  fontStyle?: string;
  textTransform?: TextTransformType;
}

interface AuthorStyleType {
  color: string;
  fontSize: string;
  fontWeight: string;
  textTransform?: TextTransformType;
  letterSpacing?: string;
}

export const coverTemplates: Record<string, TemplateType> = {
  'modern': {
    id: 'modern',
    name: 'Modern',
    backgroundColor: '#ffffff',
    titleStyle: {
      color: '#333333',
      fontSize: '28px',
      fontWeight: '700',
      textAlign: 'center',
      offsetY: 0
    },
    subtitleStyle: {
      color: '#666666',
      fontSize: '18px',
      fontWeight: '400'
    },
    authorStyle: {
      color: '#555555',
      fontSize: '16px',
      fontWeight: '500'
    },
    imageStyle: {
      opacity: '1'
    }
  },
  'classic': {
    id: 'classic',
    name: 'Classic',
    backgroundColor: '#f5f5f0',
    titleStyle: {
      color: '#2c3e50',
      fontSize: '32px',
      fontWeight: '700',
      textAlign: 'center',
      offsetY: 0,
      textTransform: 'uppercase' as TextTransformType
    },
    subtitleStyle: {
      color: '#7f8c8d',
      fontSize: '18px',
      fontWeight: '400',
      fontStyle: 'italic'
    },
    authorStyle: {
      color: '#34495e',
      fontSize: '14px',
      fontWeight: '500',
      letterSpacing: '1px'
    },
    imageStyle: {
      opacity: '0.9'
    }
  },
  'minimalist': {
    id: 'minimalist',
    name: 'Minimalist',
    backgroundColor: '#ffffff',
    titleStyle: {
      color: '#000000',
      fontSize: '24px',
      fontWeight: '400',
      textAlign: 'center',
      offsetY: 0
    },
    subtitleStyle: {
      color: '#777777',
      fontSize: '16px',
      fontWeight: '300'
    },
    authorStyle: {
      color: '#999999',
      fontSize: '14px',
      fontWeight: '300'
    },
    imageStyle: {
      opacity: '0.7'
    }
  },
  'bold': {
    id: 'bold',
    name: 'Bold',
    titleStyle: {
      color: '#ffffff',
      fontSize: '36px',
      fontWeight: '800',
      textAlign: 'center',
      offsetY: 0,
      textTransform: 'uppercase' as TextTransformType
    },
    subtitleStyle: {
      color: '#f1c40f',
      fontSize: '20px',
      fontWeight: '600'
    },
    authorStyle: {
      color: '#ffffff',
      fontSize: '16px',
      fontWeight: '400'
    },
    backgroundColor: '#2c3e50',
    imageStyle: {
      opacity: '0.8'
    }
  },
  'romantic': {
    id: 'romantic',
    name: 'Romantic',
    backgroundColor: '#fdf2f2',
    titleStyle: {
      color: '#e74c3c',
      fontSize: '32px',
      fontWeight: '600',
      textAlign: 'center',
      offsetY: 0
    },
    subtitleStyle: {
      color: '#c0392b',
      fontSize: '18px',
      fontWeight: '400',
      fontStyle: 'italic'
    },
    authorStyle: {
      color: '#7f8c8d',
      fontSize: '16px',
      fontWeight: '400'
    },
    imageStyle: {
      opacity: '0.85'
    }
  },
  'dramatic': {
    id: 'dramatic',
    name: 'Dramatic',
    backgroundColor: '#000000',
    titleStyle: {
      color: '#ffffff',
      fontSize: '34px',
      fontWeight: '700',
      textAlign: 'center',
      offsetY: 0
    },
    subtitleStyle: {
      color: '#e74c3c',
      fontSize: '20px',
      fontWeight: '500'
    },
    authorStyle: {
      color: '#bdc3c7',
      fontSize: '16px',
      fontWeight: '300'
    },
    imageStyle: {
      opacity: '0.75'
    }
  },
  'whimsical': {
    id: 'whimsical',
    name: 'Whimsical',
    backgroundColor: '#e8f4f8',
    titleStyle: {
      color: '#16a085',
      fontSize: '28px',
      fontWeight: '600',
      textAlign: 'center',
      offsetY: 0
    },
    subtitleStyle: {
      color: '#2980b9',
      fontSize: '18px',
      fontWeight: '400',
      fontStyle: 'italic'
    },
    authorStyle: {
      color: '#8e44ad',
      fontSize: '16px',
      fontWeight: '400'
    },
    imageStyle: {
      opacity: '0.9'
    }
  },
  'elegant': {
    id: 'elegant',
    name: 'Elegant',
    backgroundColor: '#f9f3f0',
    titleStyle: {
      color: '#8e44ad',
      fontSize: '30px',
      fontWeight: '600',
      textAlign: 'center',
      offsetY: 0,
      textTransform: 'capitalize' as TextTransformType
    },
    subtitleStyle: {
      color: '#d35400',
      fontSize: '18px',
      fontWeight: '400'
    },
    authorStyle: {
      color: '#7f8c8d',
      fontSize: '16px',
      fontWeight: '400',
      letterSpacing: '1px'
    },
    imageStyle: {
      opacity: '0.85'
    }
  }
};
