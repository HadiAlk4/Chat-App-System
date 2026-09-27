const PASSWORD_PATTERN = /^(?=.*[A-Z])[a-zA-Z0-9]{8,}$/;

export function isValidPassword(password) {
  return typeof password === "string" && PASSWORD_PATTERN.test(password);
}
