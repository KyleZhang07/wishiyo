
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
