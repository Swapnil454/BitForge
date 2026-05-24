/**
 * Validates if a string is a valid hex color code.
 * Accepts #RGB, #RRGGBB, #RGBA, #RRGGBBAA formats.
 */
export function isValidHexColor(color: string): boolean {
  return /^#([0-9A-F]{3}){1,2}$/i.test(color) || /^#([0-9A-F]{4}){1,2}$/i.test(color);
}

/**
 * Calculates the relative luminance of a color based on the W3C WCAG 2.0 definition.
 * https://www.w3.org/TR/WCAG20/#relativeluminancedef
 * 
 * @param hex A hex color string (e.g. "#FFFFFF" or "#FFF")
 * @returns Luminance value between 0 (black) and 1 (white)
 */
export function getRelativeLuminance(hex: string): number {
  if (!isValidHexColor(hex)) {
    return 1; // Default to white luminance if invalid
  }

  let color = hex.replace("#", "");
  
  // Expand 3-digit hex to 6-digit
  if (color.length === 3) {
    color = color.split("").map(c => c + c).join("");
  }

  const r8bit = parseInt(color.substring(0, 2), 16);
  const g8bit = parseInt(color.substring(2, 4), 16);
  const b8bit = parseInt(color.substring(4, 6), 16);

  const rsRGB = r8bit / 255;
  const gsRGB = g8bit / 255;
  const bsRGB = b8bit / 255;

  const R = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const G = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const B = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Automatically determines if text should be light or dark based on the background color's luminance.
 * 
 * @param bgColorHex The background color in hex format
 * @returns "dark" or "light"
 */
export function getAutoTextColor(bgColorHex: string): "dark" | "light" {
  const luminance = getRelativeLuminance(bgColorHex);
  // WCAG recommendation: if luminance > 0.179, dark text provides better contrast.
  // We can use 0.179 as the threshold.
  return luminance > 0.179 ? "dark" : "light";
}

/**
 * Calculates the contrast ratio between two colors.
 */
export function getContrastRatio(color1: string, color2: string): number {
  const l1 = getRelativeLuminance(color1);
  const l2 = getRelativeLuminance(color2);
  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return (brightest + 0.05) / (darkest + 0.05);
}
