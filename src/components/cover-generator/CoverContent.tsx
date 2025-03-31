
import { TemplateType } from './types';

interface CoverContentProps {
  coverTitle: string;
  subtitle: string;
  authorName: string;
  selectedFont: string;
  template: TemplateType;
}

const CoverContent = ({
  coverTitle,
  subtitle,
  authorName,
  selectedFont,
  template
}: CoverContentProps) => {
  return (
    <div className="relative z-10 h-full flex flex-col justify-between p-8">
      <div className="space-y-2 text-center">
        <h1 
          className={`${selectedFont}`}
          style={template.titleStyle}
        >
          {coverTitle}
        </h1>
        <p 
          className={`${selectedFont}`}
          style={template.subtitleStyle}
        >
          {subtitle}
        </p>
      </div>
      <div className="text-center">
        <p 
          className={`${selectedFont}`}
          style={template.authorStyle}
        >
          By {authorName}
        </p>
      </div>
    </div>
  );
};

export default CoverContent;
