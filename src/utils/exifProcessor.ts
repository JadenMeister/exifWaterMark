import ExifReader from 'exifreader';
import getRecipe from 'fuji-recipes'
import { parse as parseExifr } from 'exifr'; // exifr 추가


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

// --- Fujifilm Proprietary Constants ---
const FUJIFILM_EXIF_TAGS: Record<number, string> = {
  0: "Exif.Fujifilm.Version",
  16: "Exif.Fujifilm.SerialNumber",
  4096: "Exif.Fujifilm.Quality",
  4097: "Exif.Fujifilm.Sharpness",
  4098: "Exif.Fujifilm.WhiteBalance",
  4099: "Exif.Fujifilm.Color",
  4100: "Exif.Fujifilm.Tone",
  4101: "Exif.Fujifilm.ColorTemperature",
  4102: "Exif.Fujifilm.Contrast",
  4106: "Exif.Fujifilm.WhiteBalanceFineTune",
  4107: "Exif.Fujifilm.NoiseReduction",
  4110: "Exif.Fujifilm.HighIsoNoiseReduction",
  4111: "Exif.Fujifilm.Clarity",
  4112: "Exif.Fujifilm.FlashMode",
  4113: "Exif.Fujifilm.FlashStrength",
  4128: "Exif.Fujifilm.Macro",
  4129: "Exif.Fujifilm.FocusMode",
  4130: "Exif.Fujifilm.FocusArea",
  4131: "Exif.Fujifilm.FocusPoint",
  4139: "Exif.Fujifilm.FocusPrioritySetting",
  4141: "Exif.Fujifilm.FocusSetting",
  4142: "Exif.Fujifilm.ContinuousFocusSetting",
  4144: "Exif.Fujifilm.SlowSync",
  4145: "Exif.Fujifilm.PictureMode",
  4146: "Exif.Fujifilm.ExposureCount",
  4147: "Exif.Fujifilm.EXRAuto",
  4148: "Exif.Fujifilm.EXRMode",
  4160: "Exif.Fujifilm.ShadowTone",
  4161: "Exif.Fujifilm.HighlightTone",
  4164: "Exif.Fujifilm.DigitalZoom",
  4165: "Exif.Fujifilm.LensModulationOptimizer",
  4167: "Exif.Fujifilm.GrainEffectRoughness",
  4168: "Exif.Fujifilm.ColorChromeEffect",
  4169: "Exif.Fujifilm.MonochromaticColorWC",
  4171: "Exif.Fujifilm.MonochromaticColorMG",
  4172: "Exif.Fujifilm.GrainEffectSize",
  4173: "Exif.Fujifilm.CropMode",
  4174: "Exif.Fujifilm.ColorChromeFXBlue",
  4176: "Exif.Fujifilm.ShutterType",
  4352: "Exif.Fujifilm.Continuous",
  4353: "Exif.Fujifilm.SequenceNumber",
  4355: "Exif.Fujifilm.DriveSetting",
  4357: "Exif.Fujifilm.PixelShiftShots",
  4435: "Exif.Fujifilm.PanoramaAngle",
  4436: "Exif.Fujifilm.PanoramaDirection",
  4609: "Exif.Fujifilm.AdvancedFilter",
  4624: "Exif.Fujifilm.FinePixColor",
  4864: "Exif.Fujifilm.BlurWarning",
  4865: "Exif.Fujifilm.FocusWarning",
  4866: "Exif.Fujifilm.ExposureWarning",
  5120: "Exif.Fujifilm.DynamicRange",
  5121: "Exif.Fujifilm.FilmMode",
  5122: "Exif.Fujifilm.DynamicRangeSetting",
  5123: "Exif.Fujifilm.DevelopmentDynamicRange",
  5124: "Exif.Fujifilm.MinFocalLength",
  5125: "Exif.Fujifilm.MaxFocalLength",
  5126: "Exif.Fujifilm.MaxApertureAtMinFocal",
  5127: "Exif.Fujifilm.MaxApertureAtMaxFocal",
  5131: "Exif.Fujifilm.AutoDynamicRange",
  5154: "Exif.Fujifilm.ImageStabilization",
  5157: "Exif.Fujifilm.SceneRecognition",
  5169: "Exif.Fujifilm.Rating",
  5174: "Exif.Fujifilm.ImageGeneration",
  5176: "Exif.Fujifilm.ImageNumber",
  5187: "Exif.Fujifilm.DRangePriority",
  5188: "Exif.Fujifilm.DRangePriorityFixed",
  5189: "Exif.Fujifilm.DRangePriorityAuto",
  16389: "Exif.Fujifilm.FaceElementSelected",
  16640: "Exif.Fujifilm.FacesDetected",
  16643: "Exif.Fujifilm.FacePositions",
  16896: "Exif.Fujifilm.NumberFaceElements",
  16897: "Exif.Fujifilm.FaceElementTypes",
  16899: "Exif.Fujifilm.FaceElementPositions",
  17026: "Exif.Fujifilm.FaceRecInfo",
  32768: "Exif.Fujifilm.FileSource",
  32770: "Exif.Fujifilm.OrderNumber",
  32771: "Exif.Fujifilm.FrameNumber",
  61440: "Exif.Fujifilm.FujiIFD",
  61441: "Exif.Fujifilm.RawImageFullWidth",
  61442: "Exif.Fujifilm.RawImageFullHeight",
  61443: "Exif.Fujifilm.BitsPerSample",
  61447: "Exif.Fujifilm.StripOffsets",
  61448: "Exif.Fujifilm.StripByteCounts",
  61450: "Exif.Fujifilm.BlackLevel",
  61451: "Exif.Fujifilm.GeometricDistortionParams",
  61452: "Exif.Fujifilm.WB_GRBLevelsStandard",
  61453: "Exif.Fujifilm.WB_GRBLevelsAuto",
  61454: "Exif.Fujifilm.WB_GRBLevels",
  61455: "Exif.Fujifilm.ChromaticAberrationParams",
  61456: "Exif.Fujifilm.VignettingParams",
};

const FUJIFILM_TYPE_SIZES: Record<number, number> = {
  1: 1, // BYTE
  2: 1, // ASCII
  3: 2, // SHORT
  4: 4, // LONG
  5: 8, // RATIONAL (two LONGs)
  7: 1, // UNDEFINED
  9: 4, // SLONG
  10: 8, // SRATIONAL
};

const FUJIFILM_EXIF_VALUE_MAP: Record<string, any> = {
  "Exif.Fujifilm.Quality": {
    "NORMAL ": "Normal",
    "FINE   ": "Fine",
    "BASIC  ": "Basic",
  },
  "Exif.Fujifilm.Sharpness": {
    128: "Soft",
    130: "Standard",
    132: "Hard",
  },
  "Exif.Fujifilm.WhiteBalance": {
    0: "Auto",
    1: "Auto (White Priority)",
    2: "Auto (Ambience Priority)",
    256: "Daylight",
    512: "Cloudy",
    768: "Daylight Fluorescent",
    769: "Day White Fluorescent",
    770: "White Fluorescent",
    771: "Warm White Fluorescent",
    772: "Living Room Warm White Fluorescent",
    1024: "Incandescent",
    1280: "Flash",
    1536: "Underwater",
    3840: "Kelvin",
    3841: "Custom1",
    3842: "Custom2",
    3843: "Custom3",
    3844: "Custom4",
    3845: "Custom5",
    10000: "Custom Kelvin",
  },
  "Exif.Fujifilm.Color": {
    0: "Standard Saturation",
    128: "Medium High",
    192: "High",
    224: "Very High",
    256: "Chrome",
    512: "Black & White",
    769: "B&W + Yellow Filter",
    770: "B&W + Red Filter",
    771: "B&W + Green Filter",
    784: "B&W Sepia",
    1280: "Acros",
    1281: "Acros + Red Filter",
    1282: "Acros + Yellow Filter",
    1283: "Acros + Green Filter",
  },
  "Exif.Fujifilm.Tone": {
    0: "Standard",
    128: "Low",
    256: "High",
  },
  "Exif.Fujifilm.Contrast": {
    0: "Normal",
    1: "High",
    2: "Low",
  },
  "Exif.Fujifilm.WhiteBalanceFineTune": (value: any) => {
    if (Array.isArray(value) && value.length >= 2) {
      const [r, b] = value.map((v) => v / 20);
      const rFormatted = r > 0 ? `+${r}` : r;
      const bFormatted = b > 0 ? `+${b}` : b;
      return `R ${rFormatted}, B ${bFormatted}`;
    } else {
      return value;
    }
  },
  "Exif.Fujifilm.NoiseReduction": {
    0: "Off",
    128: "Low",
    256: "Normal",
    384: "High",
  },
  "Exif.Fujifilm.HighIsoNoiseReduction": {
    0: "Off",
    128: "Weak",
    256: "Normal",
    384: "Strong",
  },
  "Exif.Fujifilm.Clarity": (v: number) => (v / 1000).toFixed(1),
  "Exif.Fujifilm.HighlightTone": (v: number) => (v / 16).toFixed(1),
  "Exif.Fujifilm.ShadowTone": (v: number) => (v / 16).toFixed(1),
  "Exif.Fujifilm.PictureMode": {
    0: "Auto",
    1: "Portrait",
    2: "Landscape",
    3: "Macro",
    4: "Sports",
    5: "Night Scene",
    6: "Program AE",
    7: "Natural Light",
    8: "Anti-blur",
    9: "Beach & Snow",
    10: "Sunset",
    11: "Museum",
    12: "Party",
    13: "Flower",
    14: "Text",
    15: "Natural Light & Flash",
    16: "Beach",
    17: "Snow",
    18: "Fireworks",
    19: "Underwater",
    256: "Standard",
    257: "Chrome",
    258: "B&W",
    272: "Astia",
    512: "Provia",
    513: "Velvia",
    514: "Classic Chrome",
    768: "Pro Neg. Standard",
    769: "Pro Neg. Hi",
    1024: "Monochrome",
    1025: "Monochrome + Yellow Filter",
    1026: "Monochrome + Red Filter",
    1027: "Monochrome + Green Filter",
    1280: "Sepia",
  },
  "Exif.Fujifilm.DynamicRange": {
    1: "Standard",
    3: "200%",
    4: "400%",
  },
  "Exif.Fujifilm.DynamicRangeSetting": {
    1: "Auto",
    3: "200%",
    4: "400%",
  },
  "Exif.Fujifilm.ColorChromeEffect": {
    0: "Off",
    32: "Weak",
    64: "Strong",
  },
  "Exif.Fujifilm.ColorChromeFXBlue": {
    0: "Off",
    32: "Weak",
    64: "Strong",
  },
  "Exif.Fujifilm.GrainEffectRoughness": {
    0: "Off",
    32: "Weak",
    64: "Strong",
  },
  "Exif.Fujifilm.GrainEffectSize": {
    0: "Off",
    16: "Small",
    32: "Large",
  },
  "Exif.Fujifilm.FilmMode": {
    0: "Provia/Standard",
    256: " Studio Portrait",
    272: " Studio Portrait Enhanced Saturation",
    288: " Studio Portrait Smooth Skin Tone (Astia)",
    304: " Studio Portrait Increased Sharpness",
    512: " Fujichrome (Velvia)",
    768: " Studio Portrait EX",
    1024: " Velvia",
    1280: " Pro Neg. Standard",
    1281: " Pro Neg. Hi",
    1536: " Classic Chrome",
    1792: " Eterna",
    2048: " Classic Negative",
    2304: "Bleach Bypass",
    2560: "Nostalgic Negative",
    2816: "Reala Ace",
  },
};



function parseFujifilmExif(makerNote: ArrayBuffer | Uint8Array | undefined): Record<string, any> | undefined {

  if (!makerNote) return undefined;

  const uint8Array = makerNote instanceof Uint8Array ? makerNote : new Uint8Array(makerNote);
  const header = String.fromCharCode(...uint8Array.slice(0, 8));
  if (header !== "FUJIFILM") {
    console.log("Not a Fujifilm MakerNote header:", header);
    return undefined;
  }



  const view = new DataView(uint8Array.buffer, uint8Array.byteOffset, uint8Array.byteLength);

  // Fujifilm's IFD offset is stored in bytes 8-11 (Little Endian)
  const ifdStart = view.getUint32(8, true);
  const result: Record<string, any> = {};

  try {
    const tagCount = view.getUint16(ifdStart, true);
    let offset = ifdStart + 2;

    for (let i = 0; i < tagCount; i++) {
      if (offset + 12 > uint8Array.length) break;

      const tag = view.getUint16(offset, true);
      const type = view.getUint16(offset + 2, true);
      const count = view.getUint32(offset + 4, true);
      const valueOrOffset = view.getUint32(offset + 8, true);

      if (!(type in FUJIFILM_TYPE_SIZES)) {
        offset += 12;
        continue;
      }

      const key = FUJIFILM_EXIF_TAGS[tag] || `Unknown_0x${tag.toString(16)}`;
      const size = FUJIFILM_TYPE_SIZES[type];
      const totalBytes = size * count;

      let value: any;
      if (totalBytes <= 4) {
        // Value is stored directly in the 4-byte field
        switch (type) {
          case 3: value = view.getUint16(offset + 8, true); break;
          case 4: value = view.getUint32(offset + 8, true); break;
          case 9: value = view.getInt32(offset + 8, true); break;
          case 2:
            value = String.fromCharCode(...uint8Array.slice(offset + 8, offset + 8 + count)).replace(/\0/g, "").trim();
            break;
          default: value = valueOrOffset;
        }
      } else {
        // Value is a pointer. In Fujifilm, it's relative to the START of the MakerNote.
        const absolutePointer = valueOrOffset;
        if (absolutePointer + totalBytes > uint8Array.length) {
          offset += 12;
          continue;
        }

        if (type === 2) {
          value = String.fromCharCode(...uint8Array.slice(absolutePointer, absolutePointer + count)).replace(/\0/g, "").trim();
        } else if (type === 3) {
          value = [];
          for (let j = 0; j < count; j++) value.push(view.getUint16(absolutePointer + j * 2, true));
        } else if (type === 4) {
          value = [];
          for (let j = 0; j < count; j++) value.push(view.getUint32(absolutePointer + j * 4, true));
        } else {
          value = Array.from(uint8Array.slice(absolutePointer, absolutePointer + totalBytes));
        }
      }

      result[key] = value;
      offset += 12;
    }
  } catch (err) {
    console.error("Error parsing Fujifilm IFD:", err);
  }

  return result;
}

function normalizeFujifilmExif(exifData: Record<string, any> | undefined): Record<string, any> | undefined {
  if (!exifData) return undefined;
  const normalized: Record<string, any> = {};
  for (const tag in exifData) {
    const value = exifData[tag];
    const mapping = FUJIFILM_EXIF_VALUE_MAP[tag];
    if (mapping) {
      normalized[tag] = typeof mapping === "function" ? mapping(value) : (mapping[value] || value);
    } else {
      normalized[tag] = value;
    }
  }
  return normalized;
}

const FUJI_SIMULATION_KEYWORDS = [
  "Provia", "Velvia", "Astia", "Classic Chrome", "PRO Neg. Std", "PRO Neg. Hi",
  "Classic Negative", "Classic Neg", "Nostalgic Negative", "Nostalgic Neg", "Eterna", "Bleach Bypass", "Acros", "Sepia", "Reala Ace"
];

function findFilmSimulationByKeyword(tags: any): string | undefined {
  // 모든 그룹을 뒤짐
  for (const groupName in tags) {
    const group = tags[groupName];
    if (!group || typeof group !== 'object') continue;

    for (const tagName in group) {
      const tag = group[tagName];
      const desc = tag?.description;
      if (typeof desc === 'string') {
        const lowerDesc = desc.toLowerCase();
        for (const keyword of FUJI_SIMULATION_KEYWORDS) {
          if (lowerDesc.includes(keyword.toLowerCase())) {
            // 키워드가 "Classic Neg" 처럼 짧은 별칭이면 "Classic Negative"로 치환해서 리턴하면 더 보기 좋음
            if (keyword === "Classic Neg") return "Classic Negative";
            if (keyword === "Nostalgic Neg") return "Nostalgic Negative";
            return keyword;
          }
        }
      }
    }
  }
  return undefined;
}

export const BRAND_LOGOS: Record<string, string> = {
  'SONY': '/logos/sony.png',
  'Apple': '/logos/apple.png',
  'FUJIFILM': '/logos/fujifilm.png',
  'NIKON': '/logos/nikon.png',
  'Canon': '/logos/canon.png',
};

export async function processExif(file: File): Promise<ExifData> {
  const tags = await ExifReader.load(file, { expanded: true });
  
  // Try all possible ways to get the MakerNote binary
  let rawMakerNote: Uint8Array | undefined;
  try {
    const buffer = await file.arrayBuffer();
    const exifrResult = await parseExifr(buffer, { makerNote: true });
    if (exifrResult?.makerNote) {
      // exifr returns number[] or Uint8Array. Convert to Uint8Array for consistency.
      rawMakerNote = new Uint8Array(exifrResult.makerNote);
    }
  } catch (e) {
    console.warn('exifr makerNote extract failed:', e);
  }

  // Fallback buffer extraction from ExifReader if exifr failed
  if (!rawMakerNote) {
    const makerNoteGroup = (tags as any).makernote || (tags as any).makerNote || (tags as any).MakerNote;
    const val = makerNoteGroup?.value || (makerNoteGroup instanceof Uint8Array ? makerNoteGroup : undefined);
    if (val) rawMakerNote = new Uint8Array(val);
  }

  const flatTags: any = {};
  for (const group in tags) {
    const groupTags = (tags as any)[group];
    if (groupTags && typeof groupTags === 'object') {
      for (const tagName in groupTags) {
        if (!flatTags[tagName]) flatTags[tagName] = groupTags[tagName];
      }
    }
  }

  const make = flatTags['Make']?.description || '';
  const model = flatTags['Model']?.description || '';
  let brandLogo = '';
  for (const [brand, path] of Object.entries(BRAND_LOGOS)) {
    if (make.toUpperCase().includes(brand.toUpperCase())) {
      brandLogo = path;
      break;
    }
  }

  const fNumberRaw = flatTags['FNumber']?.description || '';
  const fNumber = fNumberRaw.replace(/^f\//i, '');
  const focalLengthRaw = flatTags['FocalLength']?.description || '';
  const focalLength = focalLengthRaw.replace(/\.\d+/g, '');

  const data: ExifData = {
    make,
    model,
    fNumber,
    exposureTime: flatTags['ExposureTime']?.description,
    iso: flatTags['ISOSpeedRatings']?.description,
    focalLength,
    lensModel: flatTags['LensModel']?.description || flatTags['LensInfo']?.description || flatTags['Lens']?.description,
    dateTime: flatTags['DateTimeOriginal']?.description || flatTags['DateTime']?.description,
    brandLogo,
  };

  // --- Specialized Fujifilm Processing ---
  if (make.toUpperCase().includes('FUJIFILM')) {
    console.log('--- Fujifilm Detection Sync (HBD) ---');
    
    // Priority 1: fuji-recipes library
    if (rawMakerNote) {
      try {
        // Convert Uint8Array to number[] to satisfy library types
        const recipe = getRecipe(Array.from(rawMakerNote));
        if (recipe && (recipe as any).FilmMode) {
          data.fujiFilmMode = (recipe as any).FilmMode.toString().trim();
          console.log('Success (Recipes):', data.fujiFilmMode);
        }
      } catch (e) {
        console.warn('fuji-recipes failed:', e);
      }
    }

    // Priority 2: Manual Binary Parser (Our internal logic)
    if (!data.fujiFilmMode && rawMakerNote) {
      const parsedFuji = parseFujifilmExif(rawMakerNote);
      const normalizedFuji = normalizeFujifilmExif(parsedFuji);
      if (normalizedFuji) {
        data.fujiFilmMode = (normalizedFuji["Exif.Fujifilm.FilmMode"] || normalizedFuji["Exif.Fujifilm.PictureMode"])?.toString().trim();
        if (data.fujiFilmMode) console.log('Success (Binary):', data.fujiFilmMode);
      }
    }

    // Priority 3: Deep Keyword Search (Fallback)
    if (!data.fujiFilmMode) {
      data.fujiFilmMode = findFilmSimulationByKeyword(tags);
      if (data.fujiFilmMode) console.log('Success (Keyword):', data.fujiFilmMode);
    }
  }

  return data;
}
