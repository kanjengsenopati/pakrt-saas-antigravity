/**
 * Utility for document management and formatting.
 */
export class DocumentUtils {
  private static ROMAN_MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

  /**
   * Converts a month index (1-12) to Roman numerals.
   */
  static toRomanMonth(month: number): string {
    return this.ROMAN_MONTHS[month - 1] || month.toString();
  }

  /**
   * Formats a standard document serial number.
   * Pattern: {serial}/SP/{romanMonth}/{year}
   */
  static formatSerialNumber(serial: number, typeCode: string, date: Date = new Date()): string {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const serialStr = serial.toString().padStart(3, '0');
    const roman = this.toRomanMonth(month);
    
    return `${serialStr}/${typeCode}/${roman}/${year}`;
  }
}
