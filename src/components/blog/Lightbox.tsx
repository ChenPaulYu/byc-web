import React from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';

interface LightboxProps {
  slides: Array<{ src: string }>;
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export const LightboxComponent: React.FC<LightboxProps> = ({
  slides,
  index,
  onClose,
  onIndexChange,
}) => {
  return (
    <Lightbox
      slides={slides}
      open={true}
      index={index}
      close={onClose}
      on={{
        view: ({ index: currentIndex }) => onIndexChange(currentIndex),
      }}
      plugins={[Zoom, Fullscreen]}
      carousel={{
        preload: 2,
      }}
    />
  );
};

export default LightboxComponent;
