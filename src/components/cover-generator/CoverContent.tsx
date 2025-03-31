
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
            // Convert non-CSS standard properties to regular style object
            ...(template.titleStyle.textTransform ? { textTransform: template.titleStyle.textTransform as 'uppercase' | 'lowercase' | 'capitalize' | 'none' } : {})
          } as CSSProperties}
        >
          {coverTitle}
        </h1>
        <p 
          className={`${selectedFont}`}
          style={{
            color: template.subtitleStyle.color,
            fontSize: template.subtitleStyle.fontSize,
            fontWeight: template.subtitleStyle.fontWeight,
            ...(template.subtitleStyle.fontStyle ? { fontStyle: template.subtitleStyle.fontStyle } : {}),
            ...(template.subtitleStyle.textTransform ? { textTransform: template.subtitleStyle.textTransform as 'uppercase' | 'lowercase' | 'capitalize' | 'none' } : {})
          } as CSSProperties}
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
            ...(template.authorStyle.textTransform ? { textTransform: template.authorStyle.textTransform as 'uppercase' | 'lowercase' | 'capitalize' | 'none' } : {}),
            ...(template.authorStyle.letterSpacing ? { letterSpacing: template.authorStyle.letterSpacing } : {})
          } as CSSProperties}
        >
          By {authorName}
        </p>
      </div>
    </div>
  );
};

export default CoverContent;
