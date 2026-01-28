import React from 'react';

interface YouTubeEmbedProps {
  videoId: string;
}

export const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({ videoId }) => {
  const [loaded, setLoaded] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleClick = () => {
    setLoaded(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setLoaded(true);
    }
  };

  if (loaded) {
    return (
      <div className="youtube-embed-wrapper">
        <iframe
          className="youtube-embed-iframe"
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="youtube-lite-embed"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      style={{
        backgroundImage: `url(https://i.ytimg.com/vi/${videoId}/hqdefault.jpg)`,
      }}
    >
      <div className="youtube-play-button">
        <svg viewBox="0 0 68 48" width="68px" height="48px">
          <path
            className="youtube-play-icon"
            d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24 S67.94,13.05,66.52,7.74z"
            fill="#f1f1f1"
          />
          <path
            d="M 45,24 27,14 27,34 z"
            fill="#212121"
          />
        </svg>
      </div>
    </div>
  );
};

export default YouTubeEmbed;
