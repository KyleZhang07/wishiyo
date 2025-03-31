
import { CSSProperties } from 'react';
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
            textTransform: template.titleStyle.textTransform as CSSProperties['textTransform']
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
            fontStyle: template.subtitleStyle.fontStyle,
            textTransform: template.subtitleStyle.textTransform as CSSProperties['textTransform']
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
            textTransform: template.authorStyle.textTransform as CSSProperties['textTransform'],
            letterSpacing: template.authorStyle.letterSpacing
          }}
        >
          By {authorName}
        </p>
      </div>
    </div>
  );
};

export default CoverContent;
