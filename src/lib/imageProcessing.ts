/**
 * Biblioteca de processamento de imagens para relatórios
 * Funções para rotação, flip, redimensionamento e padronização
 */

export interface ImageMetadata {
  originalWidth: number;
  originalHeight: number;
  processedWidth: number;
  processedHeight: number;
  originalSizeBytes: number;
  processedSizeBytes: number;
  rotationApplied: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  processingApplied: boolean;
}

export interface ProcessedImageResult {
  blob: Blob;
  dataUrl: string;
  metadata: ImageMetadata;
}

/**
 * Padrão do sistema para fotos
 */
export const SYSTEM_IMAGE_SPECS = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.85,
  format: 'image/jpeg',
  maxSizeBytes: 2 * 1024 * 1024, // 2MB
} as const;

/**
 * Corrige orientação EXIF da imagem
 */
async function correctExifOrientation(img: HTMLImageElement): Promise<number> {
  // Por enquanto retorna 0 (sem rotação)
  // Em produção, seria necessário ler EXIF da imagem
  return 0;
}

/**
 * Carrega uma imagem a partir de um File ou Blob
 */
function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Rotaciona uma imagem
 * @param file - Arquivo de imagem
 * @param degrees - Graus de rotação (90, 180, 270)
 */
export async function rotateImage(
  file: File,
  degrees: 90 | 180 | 270
): Promise<ProcessedImageResult> {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Não foi possível obter contexto do canvas');
  }

  // Definir dimensões do canvas baseado na rotação
  if (degrees === 90 || degrees === 270) {
    canvas.width = img.height;
    canvas.height = img.width;
  } else {
    canvas.width = img.width;
    canvas.height = img.height;
  }

  // Aplicar rotação
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((degrees * Math.PI) / 180);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);

  // Converter para blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Erro ao criar blob'))),
      'image/jpeg',
      0.95
    );
  });

  const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

  URL.revokeObjectURL(img.src);

  return {
    blob,
    dataUrl,
    metadata: {
      originalWidth: img.width,
      originalHeight: img.height,
      processedWidth: canvas.width,
      processedHeight: canvas.height,
      originalSizeBytes: file.size,
      processedSizeBytes: blob.size,
      rotationApplied: degrees,
      flipHorizontal: false,
      flipVertical: false,
      processingApplied: true,
    },
  };
}

/**
 * Aplica flip horizontal ou vertical
 */
export async function flipImage(
  file: File,
  horizontal: boolean,
  vertical: boolean
): Promise<ProcessedImageResult> {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Não foi possível obter contexto do canvas');
  }

  canvas.width = img.width;
  canvas.height = img.height;

  ctx.save();
  
  if (horizontal) {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }
  
  if (vertical) {
    ctx.translate(0, canvas.height);
    ctx.scale(1, -1);
  }

  ctx.drawImage(img, 0, 0);
  ctx.restore();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Erro ao criar blob'))),
      'image/jpeg',
      0.95
    );
  });

  const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

  URL.revokeObjectURL(img.src);

  return {
    blob,
    dataUrl,
    metadata: {
      originalWidth: img.width,
      originalHeight: img.height,
      processedWidth: canvas.width,
      processedHeight: canvas.height,
      originalSizeBytes: file.size,
      processedSizeBytes: blob.size,
      rotationApplied: 0,
      flipHorizontal: horizontal,
      flipVertical: vertical,
      processingApplied: true,
    },
  };
}

/**
 * Redimensiona imagem mantendo aspect ratio
 */
export async function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.85
): Promise<ProcessedImageResult> {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Não foi possível obter contexto do canvas');
  }

  // Calcular novas dimensões mantendo aspect ratio
  let width = img.width;
  let height = img.height;

  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  canvas.width = width;
  canvas.height = height;

  // Desenhar imagem redimensionada
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Erro ao criar blob'))),
      'image/jpeg',
      quality
    );
  });

  const dataUrl = canvas.toDataURL('image/jpeg', quality);

  URL.revokeObjectURL(img.src);

  return {
    blob,
    dataUrl,
    metadata: {
      originalWidth: img.width,
      originalHeight: img.height,
      processedWidth: width,
      processedHeight: height,
      originalSizeBytes: file.size,
      processedSizeBytes: blob.size,
      rotationApplied: 0,
      flipHorizontal: false,
      flipVertical: false,
      processingApplied: true,
    },
  };
}

/**
 * Aplica padronização do sistema na imagem
 * Redimensiona para specs do sistema e otimiza qualidade
 */
export async function standardizeImage(file: File): Promise<ProcessedImageResult> {
  return resizeImage(
    file,
    SYSTEM_IMAGE_SPECS.maxWidth,
    SYSTEM_IMAGE_SPECS.maxHeight,
    SYSTEM_IMAGE_SPECS.quality
  );
}

/**
 * Formata tamanho de arquivo para exibição
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Calcula percentual de redução de tamanho
 */
export function calculateSizeReduction(originalSize: number, processedSize: number): number {
  return Math.round(((originalSize - processedSize) / originalSize) * 100);
}
