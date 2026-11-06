"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type Ref,
} from "react";
import BarberChairIllustration from "./barber-chair-illustration";
import SiteHeader from "./site-header";

export type AuthPageVariant = "customer" | "employee" | "register";
type FieldName =
  | "identity"
  | "password"
  | "fullName"
  | "email"
  | "phone"
  | "confirmation"
  | "role"
  | "terms";
type FormValues = Record<
  "identity" | "password" | "fullName" | "email" | "phone" | "confirmation",
  string
>;
type ValidationErrors = Partial<Record<FieldName, string>>;
type Notice = { kind: "error" | "success"; message: string };

type AuthPageProps = {
  variant: AuthPageVariant;
};

const emptyValues: FormValues = {
  identity: "",
  password: "",
  fullName: "",
  email: "",
  phone: "",
  confirmation: "",
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidIndonesianPhone(value: string) {
  const normalized = value.replace(/[\s()-]/g, "");
  return /^(?:08\d{8,11}|\+628\d{8,11})$/.test(normalized);
}

function validateIdentity(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) return `${label} wajib diisi.`;
  if (trimmed.includes("@")) {
    return isValidEmail(trimmed) ? undefined : "Format email tidak valid.";
  }
  return isValidIndonesianPhone(trimmed) ? undefined : "Nomor HP tidak valid.";
}

function validateForm(
  variant: AuthPageVariant,
  values: FormValues,
  selectedRole: string | null,
  termsAccepted: boolean,
): ValidationErrors {
  const errors: ValidationErrors = {};

  if (variant === "customer" || variant === "employee") {
    const identityError = validateIdentity(values.identity, "Email atau nomor HP");
    if (identityError) errors.identity = identityError;

    if (!values.password.trim()) errors.password = "Password wajib diisi.";

    if (variant === "employee" && !selectedRole) {
      errors.role = "Silakan pilih peran terlebih dahulu.";
    }

    return errors;
  }

  const fullName = values.fullName.trim();
  if (!fullName) errors.fullName = "Nama lengkap wajib diisi.";
  else if (fullName.length < 2) {
    errors.fullName = "Nama lengkap minimal 2 karakter.";
  }

  if (!values.email.trim()) errors.email = "Email wajib diisi.";
  else if (!isValidEmail(values.email)) {
    errors.email = "Format email tidak valid.";
  }

  if (!values.phone.trim()) errors.phone = "Nomor HP wajib diisi.";
  else if (!isValidIndonesianPhone(values.phone)) {
    errors.phone = "Nomor HP tidak valid.";
  }

  if (!values.password) errors.password = "Password wajib diisi.";
  else if (values.password.length < 8) {
    errors.password = "Password minimal 8 karakter.";
  }

  if (!values.confirmation) {
    errors.confirmation = "Konfirmasi password wajib diisi.";
  } else if (values.confirmation !== values.password) {
    errors.confirmation = "Konfirmasi password tidak sesuai.";
  }

  if (!termsAccepted) {
    errors.terms = "Anda harus menyetujui syarat dan ketentuan.";
  }

  return errors;
}

function firstErrorField(errors: ValidationErrors): FieldName | undefined {
  const order: FieldName[] = [
    "identity",
    "role",
    "fullName",
    "email",
    "phone",
    "password",
    "confirmation",
    "terms",
  ];
  return order.find((field) => errors[field]);
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p className="field-error" id={id}>
      {message}
    </p>
  ) : null;
}

function TextField({
  id,
  name,
  label,
  placeholder,
  value,
  variant,
  error,
  onChange,
  inputRef,
  type = "text",
  autoComplete,
}: {
  id: string;
  name: keyof FormValues;
  label: string;
  placeholder: string;
  value: string;
  variant: AuthPageVariant;
  error?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  inputRef: Ref<HTMLInputElement>;
  type?: "text" | "email" | "tel";
  autoComplete: string;
}) {
  const errorId = `${id}-error`;

  return (
    <div className={`auth-field auth-field--${variant}`}>
      <label htmlFor={id}>{label}</label>
      <input
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        className={error ? "input-invalid" : undefined}
        id={id}
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        ref={inputRef}
        type={type}
        value={value}
      />
      <FieldError id={errorId} message={error} />
    </div>
  );
}

function PasswordField({
  id,
  name,
  label,
  placeholder,
  variant,
  autoComplete,
  value,
  error,
  onChange,
  inputRef,
}: {
  id: string;
  name: "password" | "confirmation";
  label: string;
  placeholder: string;
  variant: AuthPageVariant;
  autoComplete: string;
  value: string;
  error?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  inputRef: Ref<HTMLInputElement>;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const errorId = `${id}-error`;

  return (
    <div className={`auth-field auth-field--${variant}`}>
      <label htmlFor={id}>{label}</label>
      <div className={`password-input-wrap${error ? " input-invalid" : ""}`}>
        <input
          aria-describedby={error ? errorId : undefined}
          aria-invalid={Boolean(error)}
          autoComplete={autoComplete}
          id={id}
          name={name}
          onChange={onChange}
          placeholder={placeholder}
          ref={inputRef}
          type={isVisible ? "text" : "password"}
          value={value}
        />
        <button
          aria-label={isVisible ? "Sembunyikan password" : "Tampilkan password"}
          className="password-toggle"
          onClick={() => setIsVisible(!isVisible)}
          type="button"
        >
          <Image src="/eye.svg" alt="" width={30} height={30} />
        </button>
      </div>
      <FieldError id={errorId} message={error} />
    </div>
  );
}

function isAllEmpty(values: FormValues, termsAccepted: boolean) {
  return (
    Object.values(values).every((value) => !value.trim()) && !termsAccepted
  );
}

export default function AuthPage({ variant }: AuthPageProps) {
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const inputRefs = useRef<Partial<Record<FieldName, HTMLElement | null>>>(
    {},
  );
  const isCustomer = variant === "customer";
  const isEmployee = variant === "employee";
  const isRegister = variant === "register";

  function updateValues(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    if (!(name in emptyValues)) return;
    const field = name as keyof FormValues;
    const nextValues = { ...values, [field]: value };
    setValues(nextValues);

    if (submitted) {
      const nextErrors = validateForm(
        variant,
        nextValues,
        selectedRole,
        termsAccepted,
      );
      setErrors(nextErrors);
      setNotice(
        Object.keys(nextErrors).length
          ? {
              kind: "error",
              message: "Periksa kembali data yang Anda masukkan.",
            }
          : null,
      );
    }
  }

  function validateAndShowResult(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);

    const nextErrors = validateForm(
      variant,
      values,
      selectedRole,
      termsAccepted,
    );
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      const isEmpty = isAllEmpty(values, termsAccepted);
      setNotice({
        kind: "error",
        message:
          isRegister && isEmpty
            ? "Mohon lengkapi semua data sebelum mendaftar."
            : isCustomer && isEmpty
              ? "Mohon lengkapi semua data yang wajib diisi."
              : "Periksa kembali data yang Anda masukkan.",
      });
      const firstInvalid = firstErrorField(nextErrors);
      if (firstInvalid) inputRefs.current[firstInvalid]?.focus();
      return;
    }

    setNotice({
      kind: "success",
      message: isRegister
        ? "Formulir berhasil divalidasi. Fitur registrasi belum terhubung ke server."
        : "Data valid, tetapi fitur login belum tersedia.",
    });
  }

  function changeRole(role: string) {
    setSelectedRole(role);
    if (!submitted) return;

    const nextErrors = validateForm(variant, values, role, termsAccepted);
    setErrors(nextErrors);
    setNotice(
      Object.keys(nextErrors).length
        ? {
            kind: "error",
            message: "Periksa kembali data yang Anda masukkan.",
          }
        : null,
    );
  }

  function changeTerms(event: ChangeEvent<HTMLInputElement>) {
    const accepted = event.target.checked;
    setTermsAccepted(accepted);
    if (!submitted) return;

    const nextErrors = validateForm(variant, values, selectedRole, accepted);
    setErrors(nextErrors);
    setNotice(
      Object.keys(nextErrors).length
        ? {
            kind: "error",
            message: "Periksa kembali data yang Anda masukkan.",
          }
        : null,
    );
  }

  return (
    <>
      <SiteHeader
        activePage={isRegister ? "register" : "login"}
        variant={isEmployee ? "employee" : "account"}
      />
      <main className={`auth-main auth-main--${variant}`}>
        <div className={`auth-form-shell auth-form-shell--${variant}`}>
          <div className={`auth-heading auth-heading--${variant}`}>
            <h1>BarberShop</h1>
            {isRegister ? (
              <div>
                <p>Daftar Akun Pelanggan</p>
                <p>Silahkan isi data berikut untuk membuat akun</p>
              </div>
            ) : (
              <p>Masuk ke Akun Anda</p>
            )}
          </div>

          {isCustomer && (
            <button className="customer-role" type="button" aria-pressed="true">
              Pelanggan
            </button>
          )}

          {isEmployee && (
            <div className="employee-roles-wrap">
              <div
                className="employee-roles"
                role="group"
                aria-label="Pilih peran"
                aria-describedby={errors.role ? "role-error" : undefined}
              >
                {["Kasir", "Kapster", "Owner"].map((role, index) => (
                  <button
                    aria-pressed={selectedRole === role}
                    className={
                      selectedRole === role
                        ? "employee-role employee-role--selected"
                        : "employee-role"
                    }
                    key={role}
                    onClick={() => changeRole(role)}
                    ref={
                      index === 0
                        ? (element) => {
                            inputRefs.current.role = element;
                          }
                        : undefined
                    }
                    type="button"
                  >
                    {role}
                  </button>
                ))}
              </div>
              <FieldError id="role-error" message={errors.role} />
            </div>
          )}

          {notice && (
            <p
              className={`form-notice form-notice--${notice.kind}`}
              role="alert"
              aria-live="polite"
            >
              {notice.message}
            </p>
          )}

          {isCustomer && (
            <form
              className="auth-form auth-form--customer"
              noValidate
              onSubmit={validateAndShowResult}
            >
              <div className="auth-fields auth-fields--customer">
                <TextField
                  autoComplete="username"
                  error={errors.identity}
                  id="customer-identity"
                  inputRef={(element) => {
                    inputRefs.current.identity = element;
                  }}
                  label="Email / Nomor HP"
                  name="identity"
                  onChange={updateValues}
                  placeholder="Masukan email atau nomor HP"
                  value={values.identity}
                  variant="customer"
                />
                <PasswordField
                  autoComplete="current-password"
                  error={errors.password}
                  id="customer-password"
                  inputRef={(element) => {
                    inputRefs.current.password = element;
                  }}
                  label="Password"
                  name="password"
                  onChange={updateValues}
                  placeholder="Masukan password"
                  value={values.password}
                  variant="customer"
                />
                <span className="forgot-password">Lupa Password?</span>
              </div>
              <button className="auth-submit auth-submit--customer" type="submit">
                Login
              </button>
              <p className="auth-registration">
                <span>Belum punya akun?</span>
                <Link href="/register">Daftar Sekarang</Link>
              </p>
            </form>
          )}

          {isEmployee && (
            <form
              className="auth-form auth-form--employee"
              noValidate
              onSubmit={validateAndShowResult}
            >
              <div className="auth-fields auth-fields--employee">
                <TextField
                  autoComplete="username"
                  error={errors.identity}
                  id="employee-identity"
                  inputRef={(element) => {
                    inputRefs.current.identity = element;
                  }}
                  label="Email / Nomor HP"
                  name="identity"
                  onChange={updateValues}
                  placeholder="Masukan email atau nomor HP"
                  value={values.identity}
                  variant="employee"
                />
                <PasswordField
                  autoComplete="current-password"
                  error={errors.password}
                  id="employee-password"
                  inputRef={(element) => {
                    inputRefs.current.password = element;
                  }}
                  label="Password"
                  name="password"
                  onChange={updateValues}
                  placeholder="Masukan password"
                  value={values.password}
                  variant="employee"
                />
              </div>
              <button className="auth-submit auth-submit--employee" type="submit">
                Login
              </button>
            </form>
          )}

          {isRegister && (
            <form
              className="auth-form auth-form--register"
              noValidate
              onSubmit={validateAndShowResult}
            >
              <div className="auth-fields auth-fields--register">
                <TextField
                  autoComplete="name"
                  error={errors.fullName}
                  id="full-name"
                  inputRef={(element) => {
                    inputRefs.current.fullName = element;
                  }}
                  label="Nama Lengkap"
                  name="fullName"
                  onChange={updateValues}
                  placeholder="Contoh: Abdul Hariz"
                  value={values.fullName}
                  variant="register"
                />
                <TextField
                  autoComplete="email"
                  error={errors.email}
                  id="register-email"
                  inputRef={(element) => {
                    inputRefs.current.email = element;
                  }}
                  label="Email"
                  name="email"
                  onChange={updateValues}
                  placeholder="Contoh: nama@email.com"
                  type="email"
                  value={values.email}
                  variant="register"
                />
                <TextField
                  autoComplete="tel"
                  error={errors.phone}
                  id="phone"
                  inputRef={(element) => {
                    inputRefs.current.phone = element;
                  }}
                  label="Nomor HP"
                  name="phone"
                  onChange={updateValues}
                  placeholder="Contoh: 081234567890"
                  type="tel"
                  value={values.phone}
                  variant="register"
                />
                <PasswordField
                  autoComplete="new-password"
                  error={errors.password}
                  id="register-password"
                  inputRef={(element) => {
                    inputRefs.current.password = element;
                  }}
                  label="Password"
                  name="password"
                  onChange={updateValues}
                  placeholder="Minimal 8 karakter"
                  value={values.password}
                  variant="register"
                />
                <PasswordField
                  autoComplete="new-password"
                  error={errors.confirmation}
                  id="confirm-password"
                  inputRef={(element) => {
                    inputRefs.current.confirmation = element;
                  }}
                  label="Konfirmasi Password"
                  name="confirmation"
                  onChange={updateValues}
                  placeholder="Masukkan kembali password"
                  value={values.confirmation}
                  variant="register"
                />
              </div>
              <div className="terms-field">
                <input
                  aria-describedby={errors.terms ? "terms-error" : undefined}
                  aria-invalid={Boolean(errors.terms)}
                  checked={termsAccepted}
                  className={errors.terms ? "input-invalid" : undefined}
                  id="terms"
                  name="terms"
                  onChange={changeTerms}
                  ref={(element) => {
                    inputRefs.current.terms = element;
                  }}
                  type="checkbox"
                />
                <label htmlFor="terms">
                  Saya Setuju dengan Syarat dan Ketentuan
                </label>
                <FieldError id="terms-error" message={errors.terms} />
              </div>
              <button className="auth-submit auth-submit--register" type="submit">
                Daftar
              </button>
            </form>
          )}
        </div>

        <BarberChairIllustration className="auth-visual" />
      </main>
    </>
  );
}
