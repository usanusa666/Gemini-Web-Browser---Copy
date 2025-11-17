
import React from 'react';

interface WebViewProps {
  url: string;
}

export const WebView: React.FC<WebViewProps> = ({ url }) => {
  return (
    <iframe
      src={url}
      className="w-full h-full border-0"
      title="Web Browser Content"
      sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
      referrerPolicy="no-referrer"
    />
  );
};
