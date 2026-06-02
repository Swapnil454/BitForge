import QRCode from "qrcode";

export async function generateQrImageDataUrl(payload) {
  return await QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 180,
  });
}
