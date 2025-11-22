import QRCode from 'qrcode';

export async function generateQRCode(data: string, size: number = 300): Promise<Buffer> {
  const qrBuffer = await QRCode.toBuffer(data, {
    width: size,
    margin: 2,
    errorCorrectionLevel: 'H'
  });
  
  return qrBuffer;
}

export async function generateQRWithLabel(
  data: string,
  label: string,
  size: number = 300
): Promise<Buffer> {
  // For now, return QR without label text
  // Label can be added later with canvas or sharp with text overlay
  return await generateQRCode(data, size);
}

export async function generateQRDataUri(data: string, size: number = 300): Promise<string> {
  const buffer = await generateQRCode(data, size);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

