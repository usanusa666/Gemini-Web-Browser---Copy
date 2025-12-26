
import React from 'react';

interface WebViewProps {
  url: string;
}

export const WebView: React.FC<WebViewProps> = ({ url }) => {
  return (
    <webview
      src={url}
      className="w-full h-full border-0"
      nodeintegration={false}
      allowpopups
    />
  );
};
