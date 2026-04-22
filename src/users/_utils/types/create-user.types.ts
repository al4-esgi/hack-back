import { UserRoleEnumType } from "../user-role.enum";

export interface CreateUser {
  email: string;
  firstname: string;
  lastname: string;
  googleId: string;
  role?: UserRoleEnumType;
  photoUrl: string | null;
}
