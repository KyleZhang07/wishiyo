
export interface FontOption {
  id: string;
  name: string;
  className: string;
}

export const fontOptions: FontOption[] = [
  {
    id: 'playfair',
    name: 'Playfair',
    className: 'font-playfair'
  },
  {
    id: 'merriweather',
    name: 'Merriweather',
    className: 'font-serif'
  },
  {
    id: 'montserrat',
    name: 'Montserrat',
    className: 'font-sans'
  },
  {
    id: 'roboto',
    name: 'Roboto',
    className: 'font-sans'
  },
  {
    id: 'times',
    name: 'Times New Roman',
    className: 'font-serif'
  },
  {
    id: 'georgia',
    name: 'Georgia',
    className: 'font-serif'
  },
  {
    id: 'didot',
    name: 'Didot',
    className: 'font-serif'
  },
  {
    id: 'comic-sans',
    name: 'Comic Sans',
    className: 'font-sans'
  },
  {
    id: 'inter',
    name: 'Inter',
    className: 'font-sans'
  }
];
