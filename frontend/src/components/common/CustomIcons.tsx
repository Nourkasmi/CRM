import * as React from 'react';
import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

export function GoogleIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M21.35 11.1h-9.18v2.92h5.27c-.23 1.24-.95 2.29-2.02 2.98v2.49h3.26c1.91-1.76 3.01-4.36 3.01-7.39 0-.63-.07-1.24-.19-1.82z" />
      <path d="M12.17 22c2.7 0 4.96-.9 6.61-2.44l-3.26-2.49c-.91.6-2.06.96-3.35.96-2.58 0-4.77-1.74-5.55-4.08H3.24v2.56C4.87 19.98 8.26 22 12.17 22z" />
      <path d="M6.62 13.95a5.7 5.7 0 010-3.63V7.76H3.24a9.93 9.93 0 000 8.48l3.38-2.29z" />
      <path d="M12.17 5.04c1.47 0 2.79.51 3.84 1.51l2.88-2.88C16.89 2.12 14.64 1.2 12.17 1.2 8.26 1.2 4.87 3.22 3.24 6.72l3.38 2.56c.78-2.34 2.97-4.08 5.55-4.08z" />
    </SvgIcon>
  );
}

export function FacebookIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 5 3.66 9.13 8.44 9.88v-6.99H7.9V12h2.54V9.79c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.77-1.63 1.55V12h2.78l-.44 2.89h-2.34v6.99C18.34 21.13 22 17 22 12z" />
    </SvgIcon>
  );
}

export function SitemarkIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="12" r="10" fill="#1976d2" />
      <text x="50%" y="55%" textAnchor="middle" fontSize="10" fill="white">
        CMS
      </text>
    </SvgIcon>
  );
}
