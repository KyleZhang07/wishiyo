import React from 'react';

interface NewBannerProps {
  imagePosition: 'left' | 'right';
  textTitle: string;
  textBody: string;
  imageUrl: string;
  imageAlt?: string;
  buttonText?: string;
  buttonLink?: string;
  bgColorText?: string;
  bgColorImage?: string;
}

const NewBanner: React.FC<NewBannerProps> = ({
  imagePosition,
  textTitle,
  textBody,
  imageUrl,
  imageAlt = 'Banner image',
  buttonText,
  buttonLink,
  bgColorText = 'bg-blue-100',
  bgColorImage = 'bg-stone-50',
}) => {
  const ZIGZAG_DEPTH = '16px';

  const clipPathRight =
    `polygon(0 0, calc(100% - ${ZIGZAG_DEPTH}) 0, 100% 8.33%, calc(100% - ${ZIGZAG_DEPTH}) 16.66%, 100% 25%, calc(100% - ${ZIGZAG_DEPTH}) 33.33%, 100% 41.66%, calc(100% - ${ZIGZAG_DEPTH}) 50%, 100% 58.33%, calc(100% - ${ZIGZAG_DEPTH}) 66.66%, 100% 75%, calc(100% - ${ZIGZAG_DEPTH}) 83.33%, 100% 91.66%, calc(100% - ${ZIGZAG_DEPTH}) 100%, 0 100%)`;

  const clipPathLeft =
    `polygon(${ZIGZAG_DEPTH} 0, 100% 0, 100% 100%, ${ZIGZAG_DEPTH} 100%, 0 91.66%, ${ZIGZAG_DEPTH} 83.33%, 0 75%, ${ZIGZAG_DEPTH} 66.66%, 0 58.33%, ${ZIGZAG_DEPTH} 50%, 0 41.66%, ${ZIGZAG_DEPTH} 33.33%, 0 25%, ${ZIGZAG_DEPTH} 16.66%, 0 8.33%, ${ZIGZAG_DEPTH} 0)`;

  const clipPathStyleToUse = imagePosition === 'right' ? clipPathRight : clipPathLeft;

  const textContentPaddingValue = '1rem';
  const textContainerPaddingStyle = imagePosition === 'right'
    ? { paddingRight: `calc(${ZIGZAG_DEPTH} + ${textContentPaddingValue})`, paddingLeft: textContentPaddingValue }
    : { paddingLeft: `calc(${ZIGZAG_DEPTH} + ${textContentPaddingValue})`, paddingRight: textContentPaddingValue };

  const textPart = (
    <div
      className={`py-4 md:py-6 flex flex-col justify-center items-start text-gray-800 h-full ${bgColorText}`}
      style={{ clipPath: clipPathStyleToUse, ...textContainerPaddingStyle }}
    >
      <h2 className="text-lg md:text-xl font-bold tracking-tight leading-tight">
        {textTitle}
      </h2>
      <p className="text-xs md:text-sm mt-2">
        {textBody}
      </p>
      {buttonText && (
        <button
          onClick={() => buttonLink && (window.location.href = buttonLink)}
          className="mt-4 bg-green-700 text-white py-1.5 px-4 rounded-md text-xs md:text-sm font-medium hover:bg-green-800 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
        >
          {buttonText}
        </button>
      )}
    </div>
  );

  const imagePart = (
    <div className="flex items-center justify-center w-full h-full">
      <div className="w-full h-full">
        <img
          src={imageUrl}
          alt={imageAlt}
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );

  return (
    <section className={`grid md:grid-cols-2 w-full ${bgColorImage}`}>
      {imagePosition === 'left' ? (
        <>
          {imagePart}
          {textPart}
        </>
      ) : (
        <>
          {textPart}
          {imagePart}
        </>
      )}
    </section>
  );
};

export default NewBanner; 