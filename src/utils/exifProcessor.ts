import ExifReader from 'exifreader';

export interface ExifData {
  make?: string;
  model?: string;
  fNumber?: string;
  exposureTime?: string;
  iso?: string;
  focalLength?: string;
  lensModel?: string;
  dateTime?: string;
  fujiFilmMode?: string;
  brandLogo?: string;
}

const mapFujiFilmMode = (tags: any): string | undefined => {
  // Check for manufacturer confirmation
  const isFuji = tags['InternalSerialNumber'] || tags['Make']?.description?.toUpperCase().includes('FUJIFILM');
  if (!isFuji) return undefined;

  // Comprehensive Mapping of Fujifilm Simulation Values
  const fujiMap: Record<string, string> = {
    '0': 'Standard (Provia)',
    '256': 'Standard (Provia)',
    '272': 'Astia / Soft',
    '288': 'Astia / Soft',
    '512': 'Velvia / Vivid',
    '768': 'Pro Neg. Std',
    '769': 'Pro Neg. Hi', 
    '784': 'Pro Neg. Hi',
    '1024': 'Classic Chrome',
    '1280': 'Eterna / Cinema',
    '1296': 'Eterna Bleach Bypass',
    '1536': 'Classic Negative',
    '1792': 'Bleach Bypass',
    '2048': 'Nostalgic Negative',
    '2304': 'Eterna Bleach Bypass',
  };

  // 1. Prioritized search for specific known simulation tags
  // We MUST exclude FocalLength tags even if they contain the word "Film"
  const targetTags = ['FilmMode', 'Film Mode', 'FujiFilmMode', 'Simulation'];
  for (const tagName of targetTags) {
    const tag = tags[tagName];
    if (tag && !tagName.toLowerCase().includes('focal')) {
      const desc = tag.description;
      const val = tag.value?.[0] || tag.value;
      if (desc && isNaN(Number(desc)) && desc !== 'Unknown' && desc !== 'None') {
        return desc.split(' (')[0].trim();
      }
      if (val !== undefined && fujiMap[val.toString()]) {
        return fujiMap[val.toString()];
      }
    }
  }

  // 2. Fallback recursive search but with strict exclusion
  for (const key in tags) {
    const lowerKey = key.toLowerCase();
    // EXCLUDE FocalLength and other non-simulation tags
    if (lowerKey.includes('focal') || lowerKey.includes('serial') || lowerKey.includes('date')) continue;

    if (lowerKey.includes('film') || lowerKey.includes('simulation')) {
      const tag = tags[key];
      const desc = tag.description;
      const val = tag.value?.[0] || tag.value;

      if (desc && isNaN(Number(desc)) && desc !== 'Unknown' && desc !== 'None') {
        return desc.split(' (')[0].trim();
      }
      if (val !== undefined && fujiMap[val.toString()]) {
        return fujiMap[val.toString()];
      }
    }
  }

  // 3. No fallback name if not detected - let UI handle the default or user selection
  return undefined;
};

export const BRAND_LOGOS: Record<string, string> = {
  'SONY': '/logos/sony.png',
  'Apple': '/logos/apple.png',
  'FUJIFILM': '/logos/fujifilm.png',
  'NIKON': '/logos/nikon.png',
  'Canon': '/logos/canon.png',
};

export async function processExif(file: File): Promise<ExifData> {
  const tags = await ExifReader.load(file, { expanded: true });
  
  // Flatten all group tags into one object for easier searching
  const flatTags: any = {};
  for (const group in tags) {
    const groupTags = (tags as any)[group];
    if (groupTags) {
      for (const tagName in groupTags) {
        flatTags[tagName] = groupTags[tagName];
      }
    }
  }

  const make = flatTags['Make']?.description || '';
  const model = flatTags['Model']?.description || '';
  
  // Find brand logo
  let brandLogo = '';
  for (const [brand, path] of Object.entries(BRAND_LOGOS)) {
    if (make.toUpperCase().includes(brand.toUpperCase())) {
      brandLogo = path;
      break;
    }
  }

  const fNumberRaw = flatTags['FNumber']?.description || '';
  const fNumber = fNumberRaw.replace(/^f\//i, '');

  const data: ExifData = {
    make,
    model,
    fNumber,
    exposureTime: flatTags['ExposureTime']?.description,
    iso: flatTags['ISOSpeedRatings']?.description,
    focalLength: flatTags['FocalLength']?.description,
    lensModel: flatTags['LensModel']?.description || flatTags['LensInfo']?.description || flatTags['Lens']?.description,
    dateTime: flatTags['DateTimeOriginal']?.description || flatTags['DateTime']?.description,
    brandLogo,
  };

  // Only attempt film simulation if it's Fujifilm
  if (make.toUpperCase().includes('FUJIFILM') || flatTags['InternalSerialNumber']) {
    data.fujiFilmMode = mapFujiFilmMode(flatTags);
  }

  return data;
}
