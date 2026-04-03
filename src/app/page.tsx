'use client';

import { useState, useRef, useEffect } from 'react';
import { processExif, ExifData, BRAND_LOGOS } from '@/utils/exifProcessor';

type Ratio = '1:1' | '4:5' | '9:16';
type LayoutMode = 'bleed' | 'frame';

export default function Home() {
  const [exifData, setExifData] = useState<ExifData | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ratio, setRatio] = useState<Ratio>('4:5');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('frame');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const checkSharedImage = async () => {
      if (window.location.search.includes('share-target=true')) {
        const cache = await caches.open('shared-assets');
        const response = await cache.match('shared-image');
        if (response) {
          const blob = await response.blob();
          const file = new File([blob], 'shared-image.jpg', { type: 'image/jpeg' });
          handleFile(file);
          await cache.delete('shared-image');
          window.history.replaceState({}, '', '/');
        }
      }
    };
    checkSharedImage();
  }, []);

  const handleFile = async (file: File) => {
    setLoading(true);
    setImageUrl(URL.createObjectURL(file));
    try {
      const data = await processExif(file);
      setExifData(data);
    } catch (error) {
      console.error('Error processing EXIF:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  useEffect(() => {
    if (!imageUrl || !exifData || !canvasRef.current) return;

    const render = async () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = src;
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        });
      };

      try {
        const [mainImg, brandLogoImg] = await Promise.all([
          loadImage(imageUrl),
          exifData.brandLogo ? loadImage(exifData.brandLogo) : Promise.resolve(null),
        ]);

        const frameMargin = layoutMode === 'frame' ? 100 : 0;
        const baseWidth = 2200;
        const photoAreaWidth = baseWidth - (frameMargin * 2);
        const barHeight = 320;

        let photoAreaHeight = photoAreaWidth;
        if (ratio === '4:5') photoAreaHeight = photoAreaWidth * 1.25;
        if (ratio === '9:16') photoAreaHeight = photoAreaWidth * (16 / 9);

        // Canvas Total = Photo + Bar + Margins
        canvas.width = baseWidth;
        canvas.height = photoAreaHeight + barHeight + (layoutMode === 'frame' ? frameMargin * 2 : 0);

        // 1. Draw Background 
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Draw Photo
        const imgRatio = mainImg.width / mainImg.height;
        const targetRatio = photoAreaWidth / photoAreaHeight;

        let drawW, drawH, sx, sy;
        if (imgRatio > targetRatio) {
          drawH = mainImg.height;
          drawW = drawH * targetRatio;
          sx = (mainImg.width - drawW) / 2;
          sy = 0;
        } else {
          drawW = mainImg.width;
          drawH = drawW / targetRatio;
          sx = 0;
          sy = (mainImg.height - drawH) / 2;
        }

        const photoY = layoutMode === 'frame' ? frameMargin : 0;
        ctx.drawImage(mainImg, sx, sy, drawW, drawH, frameMargin, photoY, photoAreaWidth, photoAreaHeight);

        // 3. Data Bar Logic
        const barY = photoY + photoAreaHeight;
        const textMargin = layoutMode === 'frame' ? frameMargin + 40 : 100;
        const dividerX = baseWidth * 0.58;

        ctx.strokeStyle = '#E5E8EB';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(dividerX, barY + 80);
        ctx.lineTo(dividerX, barY + barHeight - (layoutMode === 'frame' ? 40 : 60));
        ctx.stroke();

        const iconSize = 130;
        const iconX = textMargin;
        const iconY = barY + (barHeight / 2) - (iconSize / 2);
        let contentX = textMargin;

        if (exifData.make?.toUpperCase().includes('FUJIFILM')) {
          const simName = (exifData.fujiFilmMode || 'PROVIA').toLowerCase();
          let iconPath = '/films/provia.webp';
          if (simName.includes('velvia')) iconPath = '/films/velvia.webp';
          else if (simName.includes('astia')) iconPath = '/films/astia.webp';
          else if (simName.includes('classic chrome')) iconPath = '/films/classic_chrome.webp';
          else if (simName.includes('classic neg')) iconPath = '/films/classic_neg.webp';
          else if (simName.includes('pro neg. hi')) iconPath = '/films/pro_neg_hi.webp';
          else if (simName.includes('pro neg. std')) iconPath = '/films/pro_neg_std.webp';
          else if (simName.includes('eterna')) iconPath = '/films/eterna.webp';
          else if (simName.includes('acros')) iconPath = '/films/acros.webp';
          else if (simName.includes('nostalgic neg')) iconPath = '/films/nostalgic_neg.webp';

          try {
            const filmIconImg = await loadImage(iconPath);
            ctx.drawImage(filmIconImg, iconX, iconY, iconSize, iconSize);
            contentX = iconX + iconSize + 40;
          } catch (e) {
            contentX = iconX;
          }
        }

        const blockTotalHeight = 125;
        const blockStartY = barY + (barHeight / 2) - (blockTotalHeight / 2);
        const isFuji = exifData.make?.toUpperCase().includes('FUJIFILM');
        const lineCount = isFuji ? 3 : 2;

        if (brandLogoImg) {
          const logoHeight = isFuji ? 35 : 44;
          const logoWidth = brandLogoImg.width * (logoHeight / brandLogoImg.height);
          ctx.drawImage(brandLogoImg, contentX, blockStartY, logoWidth, logoHeight);
        } else {
          ctx.textAlign = 'left';
          ctx.fillStyle = '#191F28';
          ctx.font = 'bold 44px Pretendard';
          ctx.fillText(exifData.make?.toUpperCase() || 'UNKNOWN', contentX, blockStartY + 40);
        }

        ctx.textAlign = 'left';
        ctx.fillStyle = '#191F28';
        ctx.font = 'bold 36px Pretendard';
        ctx.fillText(exifData.model?.toUpperCase() || '', contentX, lineCount === 3 ? blockStartY + 80 : blockStartY + 90);

        if (lineCount === 3) {
          ctx.fillStyle = '#4E5968';
          ctx.font = '500 32px Pretendard';
          ctx.fillText(exifData.fujiFilmMode?.toUpperCase() || 'PROVIA / STANDARD', contentX, blockStartY + 120);
        }

        ctx.textAlign = 'right';
        const rightX = baseWidth - textMargin;
        const rightStartY = barY + (barHeight / 2) - (95 / 2);

        ctx.fillStyle = '#191F28';
        ctx.font = 'bold 44px Pretendard';
        const settings = [
          exifData.focalLength,
          exifData.fNumber ? `f/${exifData.fNumber}` : null,
          exifData.exposureTime ? `${exifData.exposureTime}s` : null,
          exifData.iso ? `ISO ${exifData.iso}` : null
        ].filter(Boolean).join('   ');
        ctx.fillText(settings, rightX, rightStartY + 40);

        ctx.fillStyle = '#8B95A1';
        ctx.font = '500 36px Pretendard';
        ctx.fillText(exifData.lensModel || 'Standard Lens', rightX, rightStartY + 95);
      } catch (err) {
        console.error("Render failed:", err);
      }
    };

    render();
  }, [imageUrl, exifData, ratio, layoutMode]);

  const shareImage = async () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const file = new File([blob], `ExifFrame_${Date.now()}.jpg`, { type: 'image/jpeg' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'ExifFrame',
            text: 'Processed with ExifFrame',
          });
        } catch (error) {
          console.error('Error sharing:', error);
          downloadBlob(blob);
        }
      } else {
        downloadBlob(blob);
      }
    }, 'image/jpeg', 0.95);
  };

  const downloadBlob = (blob: Blob) => {
    const link = document.createElement('a');
    link.download = `ExifFrame_${Date.now()}.jpg`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <main className="min-h-screen bg-[#F2F4F6] py-12 px-4 sm:px-6 lg:px-8 font-sans transition-all">
      <div className="max-w-xl mx-auto space-y-8">
        <div className="text-center flex items-center justify-center gap-2">
          <div className="w-10 h-10 bg-[#3182F6] rounded-xl flex items-center justify-center">
            <div className="w-5 h-5 bg-white rounded-full border-2 border-white/20"></div>
          </div>
          <h1 className="text-2xl font-bold text-[#191F28] tracking-tight">ExifFrame PWA</h1>
        </div>

        <div className="bg-white p-6 sm:p-10 rounded-[40px] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.08)] border border-white space-y-8">
          {!imageUrl && (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#E5E8EB] rounded-[32px] p-4 transition-all hover:border-[#3182F6] hover:bg-[#F9FAFB] group">
              <label className="cursor-pointer w-full text-center py-24">
                <div className="text-5xl mb-6">📸</div>
                <span className="text-[#191F28] text-xl font-bold block mb-2">사진을 업로드하세요</span>
                <span className="text-[#8B95A1] block">EXIF 데이터를 자동으로 추출합니다</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            </div>
          )}

          {imageUrl && (
            <div className="space-y-8">
              <div className="flex flex-col gap-4">
                <div className="flex bg-[#F2F4F6] p-1.5 rounded-2xl overflow-hidden shadow-inner">
                  {(['1:1', '4:5', '9:16'] as Ratio[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRatio(r)}
                      className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${ratio === r ? 'bg-white text-[#3182F6] shadow-sm' : 'text-[#8B95A1] hover:text-[#4E5968]'
                        }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                <div className="flex bg-[#F2F4F6] p-1.5 rounded-2xl overflow-hidden shadow-inner">
                  {(['bleed', 'frame'] as LayoutMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setLayoutMode(m)}
                      className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${m === layoutMode ? 'bg-white text-[#3182F6] shadow-sm' : 'text-[#8B95A1] hover:text-[#4E5968]'
                        }`}
                    >
                      {m === 'bleed' ? '꽉 채우기' : '여백 주기'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative w-full overflow-hidden rounded-[32px] bg-[#F9FAFB] shadow-md">
                <canvas ref={canvasRef} className="w-full h-auto block" />
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <label className="flex-1 cursor-pointer bg-[#F2F4F6] text-[#4E5968] py-4 rounded-2xl font-bold text-center hover:bg-[#E5E8EB] transition-all">
                    사진 변경
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                  <button
                    onClick={shareImage}
                    className="flex-[2] bg-[#3182F6] text-white py-4 rounded-2xl font-bold hover:bg-[#1B64DA] transition-all shadow-lg shadow-blue-200"
                  >
                    사진 저장 및 공유하기
                  </button>
                </div>
                <p className="text-center text-[#8B95A1] text-sm">
                  Tip: 위 공유 버튼을 눌러 사진첩에 바로 저장할 수 있습니다.
                </p>
              </div>

              <div className="space-y-6">
                {exifData?.make?.toUpperCase().includes('FUJIFILM') && (
                  <div className="space-y-4">
                    <p className="text-sm font-semibold text-[#4E5968] flex items-center gap-2 px-1">
                      <span className="w-2 h-2 bg-[#00AA46] rounded-full animate-pulse"></span>
                      필름 시뮬레이션을 선택해 보세요
                    </p>
                    <div className="flex overflow-x-auto gap-5 pb-6 scrollbar-hide -mx-1 px-1">
                      {[
                        { name: 'Provia', icon: '/films/provia.webp', desc: 'Standard' },
                        { name: 'Velvia', icon: '/films/velvia.webp', desc: 'Vivid' },
                        { name: 'Astia', icon: '/films/astia.webp', desc: 'Soft' },
                        { name: 'Classic Chrome', icon: '/films/classic_chrome.webp', desc: 'Documentary' },
                        { name: 'Pro Neg. Hi', icon: '/films/pro_neg_hi.webp', desc: 'Studio Hi' },
                        { name: 'Pro Neg. Std', icon: '/films/pro_neg_std.webp', desc: 'Studio Std' },
                        { name: 'Classic Neg.', icon: '/films/classic_neg.webp', desc: 'Retro' },
                        { name: 'Eterna', icon: '/films/eterna.webp', desc: 'Cinema' },
                        { name: 'Acros', icon: '/films/acros.webp', desc: 'Black & White' },
                        { name: 'Nostalgic Neg.', icon: '/films/nostalgic_neg.webp', desc: 'Warmer' },
                      ].map((film) => (
                        <button
                          key={film.name}
                          onClick={() => setExifData(prev => prev ? { ...prev, fujiFilmMode: film.name } : null)}
                          className="flex-shrink-0 w-32 group text-left"
                        >
                          <div className={`aspect-square w-full rounded-2xl mb-2 shadow-sm group-hover:scale-105 transition-transform duration-200 overflow-hidden border ${exifData?.fujiFilmMode === film.name ? 'border-[#00AA46] ring-2 ring-[#00AA46]/20' : 'border-[#E5E8EB]'}`}>
                            <img src={film.icon} alt={film.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="px-1">
                            <p className="text-[13px] font-bold text-[#191F28] truncate">{film.name}</p>
                            <p className="text-[11px] text-[#8B95A1]">{film.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 p-6 bg-[#F9FAFB] rounded-3xl">
                  <InfoItem label="기기" value={`${exifData?.make} ${exifData?.model}`} />
                  <InfoItem label="조리개" value={exifData?.fNumber ? `f/${exifData.fNumber}` : '-'} />
                  <InfoItem label="셔터속도" value={exifData?.exposureTime ? `${exifData.exposureTime}s` : '-'} />
                  <InfoItem label="ISO" value={exifData?.iso} />
                  <InfoItem label="필름" value={exifData?.fujiFilmMode || '미감지 (선택 필요)'} />
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white p-8 rounded-[32px] shadow-2xl flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-[5px] border-[#F2F4F6] border-t-[#3182F6] mb-4"></div>
                <p className="font-bold text-[#191F28]">데이터 처리 중...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="mt-12 text-center text-[#8B95A1] text-sm px-4">
        <p>© 2024 ExifFrame.</p>
      </footer>
    </main>
  );
}

function InfoItem({ label, value }: { label: string; value?: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[#8B95A1] text-xs font-bold uppercase tracking-tight">{label}</p>
      <p className="font-semibold text-[#191F28] truncate">{value || 'Unknown'}</p>
    </div>
  );
}
