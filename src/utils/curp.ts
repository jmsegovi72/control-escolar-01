export const CURP_REGEX =
  /^[A-Z][AEIOU][A-Z]{2}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[HM](AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[0-9A-Z]\d$/;

export const CURP_STATE_MAP: Record<string, string> = {
  AS: 'Aguascalientes',
  BC: 'Baja California',
  BS: 'Baja California Sur',
  CC: 'Campeche',
  CS: 'Chiapas',
  CH: 'Chihuahua',
  CL: 'Coahuila de Zaragoza',
  CM: 'Colima',
  DF: 'Ciudad de México',
  DG: 'Durango',
  GT: 'Guanajuato',
  GR: 'Guerrero',
  HG: 'Hidalgo',
  JC: 'Jalisco',
  MC: 'Estado de México',
  MN: 'Michoacán',
  MS: 'Morelos',
  NT: 'Nayarit',
  NL: 'Nuevo León',
  OC: 'Oaxaca',
  PL: 'Puebla',
  QT: 'Querétaro',
  QR: 'Quintana Roo',
  SP: 'San Luis Potosí',
  SL: 'Sinaloa',
  SR: 'Sonora',
  TC: 'Tabasco',
  TS: 'Tamaulipas',
  TL: 'Tlaxcala',
  VZ: 'Veracruz',
  YN: 'Yucatán',
  ZS: 'Zacatecas',
  NE: 'Extranjero',
};

export const CURP_STATE_OPTIONS = Object.entries(CURP_STATE_MAP).map(
  ([code, name]) => ({ value: code, label: name }),
);

export type CurpData = {
  gender: 'H' | 'M';
  birthDate: Date;
  nationality: 'M' | 'NE';
  stateCode: string;
};

export function extractDataFromCURP(curp: string): CurpData {
  const gender = curp.charAt(10) as 'H' | 'M';
  const year = curp.substring(4, 6);
  const month = curp.substring(6, 8);
  const day = curp.substring(8, 10);
  const currentYY = new Date().getFullYear() % 100;
  const fullYear = Number(year) <= currentYY ? `20${year}` : `19${year}`;
  const birthDate = new Date(`${fullYear}-${month}-${day}`);
  if (isNaN(birthDate.getTime())) {
    throw new Error('La CURP contiene una fecha inválida.');
  }
  const stateCode = curp.substring(11, 13);
  const nationality: 'M' | 'NE' = stateCode === 'NE' ? 'NE' : 'M';
  return { gender, birthDate, nationality, stateCode };
}

export function deriveCurpDisplay(
  curp: string,
  optionMale: string,
  optionFemale: string,
  optionForeigner: string,
  optionMexican: string,
): {
  gender: string;
  birthDate: string;
  nationality: string;
  stateName: string;
} {
  if (!curp || curp.length < 13)
    return { gender: '', birthDate: '', nationality: '', stateName: '' };
  const g = curp.charAt(10);
  const yr = curp.substring(4, 6);
  const mo = curp.substring(6, 8);
  const dy = curp.substring(8, 10);
  const sc = curp.substring(11, 13);
  const fy =
    Number(yr) <= new Date().getFullYear() % 100 ? `20${yr}` : `19${yr}`;
  return {
    gender: g === 'H' ? optionMale : g === 'M' ? optionFemale : '',
    birthDate: `${dy}/${mo}/${fy}`,
    nationality: sc === 'NE' ? optionForeigner : optionMexican,
    stateName: CURP_STATE_MAP[sc] ?? '',
  };
}
