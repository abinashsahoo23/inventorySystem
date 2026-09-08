const STORAGE_KEY = "loggedInUser";

export function getCurrentUser() {
  try {
    return JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "null"
    );
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(user)
  );
}

export function clearCurrentUser() {
  localStorage.removeItem(STORAGE_KEY);
}

export function isLoggedIn() {
  return Boolean(getCurrentUser());
}