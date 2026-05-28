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
  {
    username: "Yannis",
    email: "yannis@example.com",
    password: "labyrinth42",
  },
  {
    username: "Maria",
    email: "maria@example.com",
    password: "athens2026",
  },
  {
    username: "Kostas",
    email: "kostas@example.com",
    password: "piraeus2026",
  },
  {
    username: "Sofia",
    email: "sofia@example.com",
    password: "thread999",
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
