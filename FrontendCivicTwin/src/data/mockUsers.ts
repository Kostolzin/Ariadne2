export interface MockUser {
  username: string;
  email: string;
  password: string;
}

export const MOCK_USERS: MockUser[] = [
  {
    username: "Eleni",
    email: "eleni@example.com",
    password: "ariadne123",
  },
];

export function findMockUser(
  identifier: string,
  password: string,
): MockUser | null {
  const id = identifier.trim().toLowerCase();
  const match = MOCK_USERS.find(
    (u) =>
      (u.email.toLowerCase() === id || u.username.toLowerCase() === id) &&
      u.password === password,
  );
  return match ?? null;
}
