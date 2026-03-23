export const validateMobile = (mobile: string): boolean => {
  return /^1[3-9]\d{9}$/.test(mobile)
}

export const validatePassword = (password: string): boolean => {
  return password.length >= 6 && password.length <= 20
}

export const validateCode = (code: string): boolean => {
  return /^\d{6}$/.test(code)
}

export const validateNickname = (nickname: string): boolean => {
  return nickname.length >= 2 && nickname.length <= 20
}