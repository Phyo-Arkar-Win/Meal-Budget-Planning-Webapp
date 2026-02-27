// client/src/types/auth.ts

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  username: string;
  email: string;
  password: string;
  gender: string;
  age: number | string;
  weight: number | string;
  height: number | string;
}