export enum AppRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export interface AppUser {
  id: string;
  role: AppRole;
}

export interface Integration {
  name: string;
  desc: string;
  logoURI: string;
  bgColor: string;
}
