import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ExifFrame - 사진의 EXIF 정보를 프레임과 함께",
  description: "사진의 EXIF 정보를 기반으로 깔끔한 화이트 프레임을 생성합니다. 토스 스타일의 미니멀한 이미지 워터마킹 툴.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ExifFrame",
  },
};

export const viewport: Viewport = {
  themeColor: "#3182F6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased font-pretendard">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#F2F4F6]">{children}</body>
    </html>
  );
}
