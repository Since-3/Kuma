import { create } from "zustand";

interface UserRegisterFormState {
  fullName: string;
  email: string;
  password: string;
  passwordConfirm: string;
  birthday: string;
  plz: string;
  place: string;
  street: string;
  gender: string;
  role: "user" | "admin" | "";
}

interface AdminRegisterFormState {
  tel: string;
  companyName: string;
  companyPlace: string;
  companyPLZ: string;
  companyStreet: string;
  companyMail: string;
  companyNumber: string;
}

interface AuthFormState extends UserRegisterFormState, AdminRegisterFormState {
  resetForm: () => void;
  setField: (field: string, value: string) => void;
}

export const useAuthFormStore = create<AuthFormState>((set) => ({
  // Common + User fields
  fullName: "",
  email: "",
  password: "",
  passwordConfirm: "",
  birthday: "",
  plz: "",
  place: "",
  street: "",
  gender: "",
  role: "",
  // Admin fields
  tel: "",
  companyName: "",
  companyPlace: "",
  companyPLZ: "",
  companyStreet: "",
  companyMail: "",
  companyNumber: "",

  setField: (field, value) => set((state) => ({ ...state, [field]: value })),

  resetForm: () =>
    set({
      fullName: "",
      email: "",
      password: "",
      passwordConfirm: "",
      birthday: "",
      plz: "",
      place: "",
      street: "",
      gender: "",
      role: "",
      tel: "",
      companyName: "",
      companyPlace: "",
      companyPLZ: "",
      companyStreet: "",
      companyMail: "",
      companyNumber: "",
    }),
}));
