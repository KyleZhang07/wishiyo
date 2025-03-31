
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
          style={{
            color: template.titleStyle.color,
            fontSize: template.titleStyle.fontSize,
            fontWeight: template.titleStyle.fontWeight,
            textAlign: template.titleStyle.textAlign,
            textTransform: template.titleStyle.textTransform as any || 'none',
            marginTop: `${template.titleStyle.offsetY}px`
          }}
        >
          {coverTitle}
        </h1>
        <p 
          className={`${selectedFont}`}
          style={{
            color: template.subtitleStyle.color,
            fontSize: template.subtitleStyle.fontSize,
            fontWeight: template.subtitleStyle.fontWeight,
            fontStyle: template.subtitleStyle.fontStyle || 'normal',
            textTransform: template.subtitleStyle.textTransform as any || 'none'
          }}
        >
          {subtitle}
        </p>
      </div>
      <div className="text-center">
        <p 
          className={`${selectedFont}`}
          style={{
            color: template.authorStyle.color,
            fontSize: template.authorStyle.fontSize,
            fontWeight: template.authorStyle.fontWeight,
            textTransform: template.authorStyle.textTransform as any || 'none',
            letterSpacing: template.authorStyle.letterSpacing || 'normal'
          }}
        >
          By {authorName}
        </p>
      </div>
    </div>
  );
};

export default CoverContent;
