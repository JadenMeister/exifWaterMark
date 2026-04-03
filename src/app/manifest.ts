import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ExifFrame PWA',
    short_name: 'ExifFrame',
    description: '사진의 EXIF 정보를 프레임과 함께 기록하세요.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F2F4F6',
    theme_color: '#3182F6',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    share_target: {
      action: '/?share=true',
      method: 'POST',
      enctype: 'multipart/form-data',
      params: {
        files: [
          {
            name: 'file',
            accept: ['image/*'],
          },
        ],
      },
    },
  };
}
