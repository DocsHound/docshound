export enum AppRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export interface AppUser {
  id: string;
  role: AppRole;
}

export type Credentials = {
  [key: string]: string | null;
};

export interface Integration {
  name: string;
  desc: string;
  logoURI: string;
  bgColor: string;
}
