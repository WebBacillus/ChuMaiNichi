const STORAGE_KEY = "dashboard_password";

export function getPassword(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setPassword(password: string): void {
  localStorage.setItem(STORAGE_KEY, password);
}

export function clearPassword(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function authHeaders(): Record<string, string> {
  const pwd = getPassword();
  if (pwd) return { Authorization: `Bearer ${pwd}` };
  return {};
}
