export interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  passwordConfirm: string;
  birthday: string;
  plz: string;
  place: string;
  street: string;
  gender: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}
