
export interface FontOption {
  id: string;
  name: string;
  className: string;
}

export const fontOptions: FontOption[] = [
  { id: 'playfair', name: 'Playfair Display', className: 'font-playfair' },
  { id: 'inter', name: 'Inter', className: 'font-inter' },
  { id: 'roboto', name: 'Roboto', className: 'font-roboto' },
  { id: 'lora', name: 'Lora', className: 'font-lora' }
];
