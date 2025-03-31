
import { Button } from '@/components/ui/button';
import { coverTemplates } from './types';

interface TemplateSelectorProps {
  selectedTemplate: string;
  onSelectTemplate: (template: string) => void;
}

const TemplateSelector = ({ selectedTemplate, onSelectTemplate }: TemplateSelectorProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto py-4 justify-center">
      {Object.values(coverTemplates).map((template) => (
        <Button
          key={template.id}
          variant={selectedTemplate === template.id ? 'default' : 'outline'}
          onClick={() => onSelectTemplate(template.id)}
          className="min-w-[120px] relative overflow-hidden"
          style={{
            backgroundColor: selectedTemplate === template.id ? template.backgroundColor : 'transparent',
            color: selectedTemplate === template.id ? template.titleStyle.color : 'inherit',
            borderColor: template.backgroundColor
          }}
        >
          <div 
            className="absolute inset-0 opacity-20" 
            style={{ 
              backgroundColor: template.backgroundColor,
              display: selectedTemplate === template.id ? 'none' : 'block'
            }}
          />
          {template.name}
        </Button>
      ))}
    </div>
  );
};

export default TemplateSelector;
