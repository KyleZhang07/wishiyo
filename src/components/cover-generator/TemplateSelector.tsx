
import { Button } from '@/components/ui/button';

interface TemplateSelectorProps {
  selectedTemplate: string;
  onSelectTemplate: (template: string) => void;
}

const templates = [
  { id: 'modern', name: 'Modern' },
  { id: 'minimal', name: 'Minimal' },
  { id: 'vibrant', name: 'Vibrant' },
];

const TemplateSelector = ({ selectedTemplate, onSelectTemplate }: TemplateSelectorProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto py-4">
      {templates.map((template) => (
        <Button
          key={template.id}
          variant={selectedTemplate === template.id ? 'default' : 'outline'}
          onClick={() => onSelectTemplate(template.id)}
        >
          {template.name}
        </Button>
      ))}
    </div>
  );
};

export default TemplateSelector;
