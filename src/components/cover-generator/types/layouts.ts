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
      offsetY: 0.85,
      textAlign: 'center'
    },
    authorPosition: {
      offsetY: 0.3,
      textAlign: 'center'
    },
    imageContainerStyle: {
      width: '70%',
      height: '45%',
      position: 'center',
      borderRadius: '50%'
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
      offsetY: 0.8,
      textAlign: 'left'
    },
    authorPosition: {
      offsetY: 0.25,
      textAlign: 'left'
    },
    imageContainerStyle: {
      width: '100%',
      height: '55%',
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
      offsetY: 0.85,
      textAlign: 'center'
    },
    authorPosition: {
      offsetY: 0.2,
      textAlign: 'center'
    },
    imageContainerStyle: {
      width: '70%',
      height: '60%',
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
      height: '55%',
      position: 'top'
    }
  },
  'left-align': {
    id: 'left-align',
    name: 'Left Align',
    titlePosition: {
      offsetY: 0.2,
      textAlign: 'left'
    },
    subtitlePosition: {
      offsetY: 0.85,
      textAlign: 'left'
    },
    authorPosition: {
      offsetY: 0.3,
      textAlign: 'left'
    },
    imageContainerStyle: {
      width: '80%',
      height: '45%',
      position: 'center'
    }
  },
  'right-align': {
    id: 'right-align',
    name: 'Right Align',
    titlePosition: {
      offsetY: 0.2,
      textAlign: 'right'
    },
    subtitlePosition: {
      offsetY: 0.85,
      textAlign: 'right'
    },
    authorPosition: {
      offsetY: 0.3,
      textAlign: 'right'
    },
    imageContainerStyle: {
      width: '80%',
      height: '45%',
      position: 'center'
    }
  }
};
