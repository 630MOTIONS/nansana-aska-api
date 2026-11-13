export type RoleName = 'admin' | 'editor';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: RoleName;
};

// The few request fields the auth code reads. Set by AuthGuard.
export type AuthedRequest = {
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
  user?: AuthUser;
  session?: { id: string };
};
