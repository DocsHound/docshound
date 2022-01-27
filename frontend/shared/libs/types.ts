export enum AppRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export interface AppUser {
  id: string;
  role: AppRole;
}
