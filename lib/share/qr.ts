import QRCode from "qrcode"

export const SCORECARD_QR = {
  errorCorrectionLevel: "M" as const,
  margin: 4,
  width: 1024,
  color: { dark: "#000000", light: "#ffffff" },
}

export function scorecardQrDataUrl(url: string) {
  return QRCode.toDataURL(url, SCORECARD_QR)
}

export function scorecardQrPng(url: string) {
  return QRCode.toBuffer(url, { ...SCORECARD_QR, type: "png" })
}
