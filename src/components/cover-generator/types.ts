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
      borderRadius: '50%'
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
      borderRadius: '50%'
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
    backgroundColor: '#8B5CF6',
    titleStyle: {
      color: '#ffffff',
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
      borderRadius: '50%'
    },
    spineStyle: {
      backgroundColor: '#8B5CF6',
      titleColor: '#ffffff',
      authorColor: '#F2FCE2'
    },
    backCoverStyle: {
      backgroundColor: '#8B5CF6',
      textColor: '#FDE1D3',
      summaryFontSize: '1rem'
    }
  }
};

export interface CoverLayout {
  id: string;
  name: string;
  titlePosition: {
    offsetY: number;
    textAlign: 'left' | 'center' | 'right';
  };
  subtitlePosition: {
    offsetY: number;
    textAlign: 'left' | 'center' | 'right';
  };
  authorPosition: {
    offsetY: number;
    textAlign: 'left' | 'center' | 'right';
  };
  imageContainerStyle?: {
    width: string;
    height: string;
    borderRadius?: string;
    position: 'top' | 'center' | 'bottom';
  };
}

export const coverLayouts: { [key: string]: CoverLayout } = {
  'classic-centered': {
    id: 'classic-centered',
    name: 'Classic Centered',
    titlePosition: {
      offsetY: 0.2,
      textAlign: 'center'
    },
    subtitlePosition: {
      offsetY: 0.35,
      textAlign: 'center'
    },
    authorPosition: {
      offsetY: 0.9,
      textAlign: 'center'
    },
    imageContainerStyle: {
      width: '80%',
      height: '50%',
      position: 'center'
    }
  },
  'modern-split': {
    id: 'modern-split',
    name: 'Modern Split',
    titlePosition: {
      offsetY: 0.15,
      textAlign: 'left'
    },
    subtitlePosition: {
      offsetY: 0.3,
      textAlign: 'left'
    },
    authorPosition: {
      offsetY: 0.9,
      textAlign: 'right'
    },
    imageContainerStyle: {
      width: '100%',
      height: '60%',
      position: 'bottom'
    }
  },
  'minimal-frame': {
    id: 'minimal-frame',
    name: 'Minimal Frame',
    titlePosition: {
      offsetY: 0.1,
      textAlign: 'center'
    },
    subtitlePosition: {
      offsetY: 0.25,
      textAlign: 'center'
    },
    authorPosition: {
      offsetY: 0.95,
      textAlign: 'center'
    },
    imageContainerStyle: {
      width: '70%',
      height: '70%',
      borderRadius: '50%',
      position: 'center'
    }
  },
  'bold-header': {
    id: 'bold-header',
    name: 'Bold Header',
    titlePosition: {
      offsetY: 0.7,
      textAlign: 'center'
    },
    subtitlePosition: {
      offsetY: 0.85,
      textAlign: 'center'
    },
    authorPosition: {
      offsetY: 0.95,
      textAlign: 'center'
    },
    imageContainerStyle: {
      width: '100%',
      height: '60%',
      position: 'top'
    }
  }
};

export const fontOptions = [
  { id: 'playfair', name: 'Playfair Display', className: 'font-playfair' },
  { id: 'inter', name: 'Inter', className: 'font-inter' },
  { id: 'roboto', name: 'Roboto', className: 'font-roboto' },
  { id: 'lora', name: 'Lora', className: 'font-lora' }
];

export interface CanvasSize {
  width: number;
  height: number;
  spine: number;
  gap: number;
}

export interface CanvasImage {
  element: HTMLImageElement;
  scale: number;
  position: { x: number; y: number };
}

export const DEFAULT_CANVAS_SIZE: CanvasSize = {
  width: 2400,
  height: 1000,
  spine: 100,
  gap: 30
};
