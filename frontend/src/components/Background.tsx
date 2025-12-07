/* eslint-disable @next/next/no-img-element */
'use client';

import ImageBackground from '@/assets/images/background.png';

export default function Background() {
  return (
    <div className="fixed left-0 bottom-0 -z-10 opacity-60">
      <img alt="" width="9999" src={ImageBackground.src} />
    </div>
  );
}
