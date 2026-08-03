"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import type { ProfileResponse } from "@/lib/square/types";

interface SectionStatus {
  personal: "idle" | "saving" | "success" | "error";
  address: "idle" | "saving" | "success" | "error";
  password: "idle" | "saving" | "success" | "error";
}

interface FormData {
  givenName: string;
  familyName: string;
  emailAddress: string;
  phoneNumber: string;
  addressLine1: string;
  locality: string;
  administrativeDistrictLevel1: string;
  postalCode: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface FieldError {
  [key: string]: string;
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  wide?: boolean;
  disabled?: boolean;
  error?: string;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  wide = false,
  disabled = false,
  error,
}: FieldProps) {
  const inputClass =
    "h-8 w-full min-w-0 rounded-lg border bg-[#F5F5F8] px-4 py-1 text-base outline-none placeholder:text-neutral-400 focus-visible:border-[#7B4FA2] focus-visible:ring-0 disabled:opacity-50 md:text-sm";
  const labelClass = "text-sm font-medium text-[#0E0E2C] mb-1.5 block";
  const errorClass = "text-xs text-[#E53333] mt-1";

  return (
    <div className={wide ? "col-span-full" : ""}>
      <label className={labelClass}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        aria-invalid={!!error}
      />
      {error && <p className={errorClass}>{error}</p>}
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: SectionStatus[keyof SectionStatus];
}) {
  if (status === "success") {
    return (
      <span className="ml-3 text-xs font-medium text-[#33A052]">Saved</span>
    );
  }
  if (status === "error") {
    return (
      <span className="ml-3 text-xs font-medium text-[#E53333]">Error</span>
    );
  }
  if (status === "saving") {
    return (
      <span className="ml-3 text-xs font-medium text-[#9090A8]">Saving...</span>
    );
  }
  return null;
}

function buildInitialFormData(data: ProfileResponse): FormData {
  const sp = data.squareProfile;
  return {
    givenName: sp.givenName ?? "",
    familyName: sp.familyName ?? "",
    emailAddress: sp.emailAddress ?? "",
    phoneNumber: sp.phoneNumber ?? "",
    addressLine1: sp.address.addressLine1 ?? "",
    locality: sp.address.locality ?? "",
    administrativeDistrictLevel1: sp.address.administrativeDistrictLevel1 ?? "",
    postalCode: sp.address.postalCode ?? "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  };
}

export function EditProfileForm({
  profileData,
}: {
  profileData: ProfileResponse;
}) {
  const router = useRouter();
  const { user } = useUser();

  const initialData = useMemo(
    () => buildInitialFormData(profileData),
    [profileData],
  );

  const [formData, setFormData] = useState<FormData>(initialData);
  const [errors, setErrors] = useState<FieldError>({});
  const [sectionStatus, setSectionStatus] = useState<SectionStatus>({
    personal: "idle",
    address: "idle",
    password: "idle",
  });
  const [apiMessages, setApiMessages] = useState<{
    squareError?: string | null;
    clerkError?: string | null;
    passwordError?: string | null;
  }>({});

  const isDirty = useMemo(() => {
    const keys = Object.keys(initialData) as (keyof FormData)[];
    return keys.some((k) => formData[k] !== initialData[k]);
  }, [formData, initialData]);

  const hasPasswordFields =
    formData.currentPassword ||
    formData.newPassword ||
    formData.confirmPassword;

  const isPersonalDirty =
    formData.givenName !== initialData.givenName ||
    formData.familyName !== initialData.familyName ||
    formData.emailAddress !== initialData.emailAddress ||
    formData.phoneNumber !== initialData.phoneNumber;

  const isAddressDirty =
    formData.addressLine1 !== initialData.addressLine1 ||
    formData.locality !== initialData.locality ||
    formData.administrativeDistrictLevel1 !==
      initialData.administrativeDistrictLevel1 ||
    formData.postalCode !== initialData.postalCode;

  const isPasswordDirty = hasPasswordFields;

  function updateField(field: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validate(): FieldError {
    const errs: FieldError = {};

    if (isPersonalDirty) {
      if (
        formData.emailAddress &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailAddress)
      ) {
        errs.emailAddress = "Invalid email address";
      }
      if (
        formData.phoneNumber &&
        !/^(\+\d{7,15}|\(\d{3}\)\s\d{3}[-.]\d{4}|\d{3}[-.]\d{3}[-.]\d{4})$/.test(
          formData.phoneNumber,
        )
      ) {
        errs.phoneNumber = "Enter a valid phone number";
      }
    }

    if (isPasswordDirty) {
      if (!formData.currentPassword) {
        errs.currentPassword = "Current password is required";
      }
      if (formData.newPassword && formData.newPassword.length < 8) {
        errs.newPassword = "Password must be at least 8 characters";
      }
      if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
        errs.confirmPassword = "Passwords do not match";
      }
      if (!formData.confirmPassword) {
        errs.confirmPassword = "Please confirm your new password";
      }
    }

    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setApiMessages({});
    setSectionStatus({
      personal: isPersonalDirty ? "saving" : "idle",
      address: isAddressDirty ? "saving" : "idle",
      password: isPasswordDirty ? "saving" : "idle",
    });

    let squareError: string | null = null;
    let clerkError: string | null = null;
    let passwordError: string | null = null;

    // 1. Update Square (personal info + address) and sync to Clerk
    if (isPersonalDirty || isAddressDirty) {
      const body: Record<string, unknown> = {};

      if (isPersonalDirty) {
        body.givenName = formData.givenName;
        body.familyName = formData.familyName;
        body.emailAddress = formData.emailAddress;
        body.phoneNumber = formData.phoneNumber;
      }

      if (isAddressDirty) {
        body.address = {
          addressLine1: formData.addressLine1,
          locality: formData.locality,
          administrativeDistrictLevel1: formData.administrativeDistrictLevel1,
          postalCode: formData.postalCode,
        };
      }

      try {
        const res = await fetch("/api/account/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const result = await res.json();

        if (!result.success) {
          squareError = result.squareError || "Failed to save profile";
          setSectionStatus((prev) => ({
            ...prev,
            personal: isPersonalDirty ? "error" : prev.personal,
            address: isAddressDirty ? "error" : prev.address,
          }));
        } else {
          if (isPersonalDirty) {
            setSectionStatus((prev) => ({ ...prev, personal: "success" }));
          }
          if (isAddressDirty) {
            setSectionStatus((prev) => ({ ...prev, address: "success" }));
          }
        }

        if (result.clerkError) {
          clerkError = result.clerkError;
        }
      } catch {
        squareError = "Network error. Please try again.";
        setSectionStatus((prev) => ({
          ...prev,
          personal: isPersonalDirty ? "error" : prev.personal,
          address: isAddressDirty ? "error" : prev.address,
        }));
      }
    }

    // 2. Change password via Clerk client SDK
    if (isPasswordDirty && user) {
      try {
        await user.updatePassword({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        });
        setSectionStatus((prev) => ({ ...prev, password: "success" }));
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Password change failed";

        if (msg.toLowerCase().includes("incorrect") || msg.toLowerCase().includes("invalid")) {
          setErrors((prev) => ({
            ...prev,
            currentPassword: "Current password is incorrect",
          }));
          passwordError = "Current password is incorrect";
        } else {
          passwordError = msg;
        }
        setSectionStatus((prev) => ({ ...prev, password: "error" }));
      }
    }

    setApiMessages({ squareError, clerkError, passwordError });
  }

  const isSaving =
    sectionStatus.personal === "saving" ||
    sectionStatus.address === "saving" ||
    sectionStatus.password === "saving";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[20px] border border-[#CDCDD8] bg-white p-10 shadow-[0_4px_16px_rgba(14,14,44,0.04)]"
    >
      {/* Section 1: Personal Information */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="font-heading text-lg font-bold text-[#0E0E2C]">
            Personal Information
          </h2>
          <StatusBadge status={sectionStatus.personal} />
        </div>
        <div className="border-b border-[#E8E8EF] mb-6" />

        <div className="grid grid-cols-2 gap-6 mb-6">
          <Field
            label="First Name"
            value={formData.givenName}
            onChange={(v) => updateField("givenName", v)}
            placeholder="Alex"
            autoComplete="given-name"
            disabled={isSaving}
            error={errors.givenName}
          />
          <Field
            label="Last Name"
            value={formData.familyName}
            onChange={(v) => updateField("familyName", v)}
            placeholder="Thompson"
            autoComplete="family-name"
            disabled={isSaving}
            error={errors.familyName}
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Field
            label="Email Address"
            value={formData.emailAddress}
            onChange={(v) => updateField("emailAddress", v)}
            type="email"
            placeholder="alex.t@email.com"
            autoComplete="email"
            disabled={isSaving}
            error={errors.emailAddress}
          />
          <Field
            label="Phone Number"
            value={formData.phoneNumber}
            onChange={(v) => updateField("phoneNumber", v)}
            type="tel"
            placeholder="(309) 555-0142"
            autoComplete="tel"
            disabled={isSaving}
            error={errors.phoneNumber}
          />
        </div>
      </div>

      {/* Section 2: Default Shipping Address */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="font-heading text-lg font-bold text-[#0E0E2C]">
            Default Shipping Address
          </h2>
          <StatusBadge status={sectionStatus.address} />
        </div>
        <div className="border-b border-[#E8E8EF] mb-6" />

        <div className="mb-6">
          <Field
            label="Street Address"
            value={formData.addressLine1}
            onChange={(v) => updateField("addressLine1", v)}
            placeholder="123 Main Street, Apt 4B"
            autoComplete="street-address"
            wide
            disabled={isSaving}
            error={errors.addressLine1}
          />
        </div>

        <div className="grid grid-cols-3 gap-6">
          <Field
            label="City"
            value={formData.locality}
            onChange={(v) => updateField("locality", v)}
            placeholder="Washington"
            autoComplete="address-level2"
            disabled={isSaving}
            error={errors.locality}
          />
          <Field
            label="State"
            value={formData.administrativeDistrictLevel1}
            onChange={(v) => updateField("administrativeDistrictLevel1", v)}
            placeholder="IL"
            autoComplete="address-level1"
            disabled={isSaving}
            error={errors.administrativeDistrictLevel1}
          />
          <Field
            label="Zip Code"
            value={formData.postalCode}
            onChange={(v) => updateField("postalCode", v)}
            placeholder="61571"
            autoComplete="postal-code"
            disabled={isSaving}
            error={errors.postalCode}
          />
        </div>
      </div>

      {/* Section 3: Change Password */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="font-heading text-lg font-bold text-[#0E0E2C]">
            Change Password
          </h2>
          <StatusBadge status={sectionStatus.password} />
        </div>
        <div className="border-b border-[#E8E8EF] mb-6" />

        <div className="grid grid-cols-3 gap-6">
          <Field
            label="Current Password"
            value={formData.currentPassword}
            onChange={(v) => updateField("currentPassword", v)}
            type="password"
            autoComplete="current-password"
            disabled={isSaving}
            error={errors.currentPassword}
          />
          <Field
            label="New Password"
            value={formData.newPassword}
            onChange={(v) => updateField("newPassword", v)}
            type="password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            disabled={isSaving}
            error={errors.newPassword}
          />
          <Field
            label="Confirm New Password"
            value={formData.confirmPassword}
            onChange={(v) => updateField("confirmPassword", v)}
            type="password"
            placeholder="Repeat your new password"
            autoComplete="new-password"
            disabled={isSaving}
            error={errors.confirmPassword}
          />
        </div>
      </div>

      {/* API Messages */}
      {apiMessages.squareError && (
        <div className="mb-6 rounded-lg border border-[#E53333]/20 bg-[#E53333]/5 px-4 py-3 text-sm text-[#E53333]">
          Failed to save profile: {apiMessages.squareError}. Please try again.
        </div>
      )}
      {apiMessages.clerkError && (
        <div className="mb-6 rounded-lg border border-[#F5A623]/20 bg-[#F5A623]/5 px-4 py-3 text-sm text-[#C47F10]">
          Profile saved but some sync features are delayed. Changes will sync automatically.
        </div>
      )}

      {/* Clerk profile unavailable banner */}
      {profileData.clerkError && !apiMessages.squareError && (
        <div className="mb-6 rounded-lg border border-[#F5A623]/20 bg-[#F5A623]/5 px-4 py-3 text-sm text-[#C47F10]">
          Some profile sync features are temporarily unavailable. Your changes will sync automatically.
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-6 pt-4 border-t border-[#E8E8EF]">
        <Button
          type="submit"
          variant="primary"
          disabled={!isDirty || isSaving}
          className="px-6 py-3.5 h-auto text-[14px] font-bold"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/account")}
          disabled={isSaving}
          className="px-6 py-3.5 h-auto text-[14px] font-bold"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
