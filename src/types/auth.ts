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

export interface AdminRegisterFormData {
  fullName: string;
  email: string;
  tel: string;
  password: string;
  passwordConfirm: string;
  plz: string;
  place: string;
  street: string;
  companyName: string;
  companyPlace: string;
  companyPLZ: string;
  companyStreet: string;
  companyMail: string;
  companyNumber: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}
