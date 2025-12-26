declare namespace JSX {
  interface IntrinsicElements {
    webview: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      src: string;
      preload?: string;
      useragent?: string;
      partition?: string;
      allowpopups?: boolean;
      webpreferences?: string;
      nodeintegration?: boolean;
      plugins?: boolean;
      disablewebsecurity?: boolean;
      allowmediakeycodes?: boolean;
      style?: React.CSSProperties;
      className?: string;
    };
  }
}
