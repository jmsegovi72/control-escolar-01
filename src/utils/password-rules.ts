export type PasswordRules = {
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasAllowedSpecialChar: boolean;
  hasOnlyAllowedCharacters: boolean;
  hasValidLength: boolean;
};

export const allowedPasswordSpecialCharacters = '!@#$%&*_-+=?.';

export function getPasswordRules(password: string): PasswordRules {
  return {
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasAllowedSpecialChar: /[!@#$%&*_\-+=?.]/.test(password),
    hasOnlyAllowedCharacters: /^[A-Za-z0-9!@#$%&*_\-+=?.]*$/.test(password),
    hasValidLength: password.length >= 8 && password.length <= 12,
  };
}

export function isValidPassword(password: string): boolean {
  const rules = getPasswordRules(password);
  return Object.values(rules).every(Boolean);
}
