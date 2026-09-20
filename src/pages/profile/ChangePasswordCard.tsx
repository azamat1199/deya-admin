import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { AlertTriangle, Eye, EyeOff } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { usersApi } from "../../api/users";
import { getApiErrorMessage } from "../../api/client";
import { useAuth } from "../../context/useAuth";

// min(8) matches the create-user form's rule for consistency across the
// admin. It is NOT confirmed against this endpoint — the backend 401s
// before validating, so its real rule is unknown. A 400 from the server is
// shown verbatim on the field (see onSubmit), so the real rule surfaces on
// first use rather than being masked by this guess.
const schema = z
  .object({
    password: z.string().min(8, "passwordMin"),
    confirmPassword: z.string().min(1, "confirmPasswordRequired"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "passwordMismatch",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export function ChangePasswordCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { clearSession } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  // useWatch instead of watch(): watch() is not memo-safe and makes React
  // Compiler bail out of optimizing the whole component.
  const watchedValues = useWatch({ control });
  const password = watchedValues.password ?? "";
  const confirmPassword = watchedValues.confirmPassword ?? "";
  const canSubmit =
    password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

  const onSubmit = async (values: FormValues) => {
    // Double-submit guard: the button is disabled while submitting, and
    // this bails if a second call somehow lands anyway.
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Only `password` — the confirmation is never sent anywhere.
      await usersApi.setPassword({ password: values.password });

      // 200 has no body; nothing is parsed from it. From this point the
      // token is blacklisted server-side, so NO further request may be
      // made — not even logout(), which would 401 and trip the response
      // interceptor's hard redirect.
      //
      // The toast is fired BEFORE navigating: <Toaster /> is mounted in
      // main.tsx beside <App />, outside <Routes>, so it survives the
      // route change. Router state would not — clearSession() re-renders
      // ProtectedRoute, which redirects with its own state and would
      // clobber anything passed here.
      toast.success(t("profile.changePassword.successMessage"), {
        duration: 8000,
      });
      clearSession();
      navigate("/login", { replace: true });
    } catch (error) {
      // Values are deliberately left in the form on every failure path.
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // Session already gone — not a password problem, so no field error.
        toast.error(t("profile.changePassword.sessionExpired"));
        clearSession();
        navigate("/login", { replace: true });
        return;
      }

      // DRF field errors: {"password": ["..."]} shown verbatim on the
      // field, so the backend's real rule replaces our assumed one.
      const data = axios.isAxiosError(error)
        ? (error.response?.data as Record<string, unknown> | undefined)
        : undefined;
      const fieldError = data?.password;
      if (fieldError) {
        setError("password", {
          type: "server",
          message: Array.isArray(fieldError)
            ? fieldError.map(String).join(" ")
            : String(fieldError),
        });
      }
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Server messages arrive already-worded; only our own keys get translated.
  const fieldError = (message: string | undefined) =>
    message
      ? t(`profile.changePassword.${message}`, { defaultValue: message })
      : undefined;

  return (
    <Card className="p-6">
      <h2 className="text-base font-semibold text-slate-900 dark:text-white">
        {t("profile.changePassword.title")}
      </h2>

      <div className="mt-3 flex items-start gap-3 rounded-md border border-amber-300 p-3 dark:border-amber-800">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <p className="text-sm text-slate-700 dark:text-slate-300">
          {t("profile.changePassword.logoutWarning")}
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-4 flex max-w-sm flex-col gap-4"
      >
        <div className="relative">
          <Input
            label={t("profile.changePassword.newPassword")}
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            error={fieldError(errors.password?.message)}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute bottom-2.5 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label={t(
              showPassword
                ? "profile.changePassword.hidePassword"
                : "profile.changePassword.showPassword",
            )}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="relative">
          <Input
            label={t("profile.changePassword.confirmPassword")}
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            error={fieldError(errors.confirmPassword?.message)}
            {...register("confirmPassword")}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((v) => !v)}
            className="absolute bottom-2.5 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label={t(
              showConfirmPassword
                ? "profile.changePassword.hidePassword"
                : "profile.changePassword.showPassword",
            )}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="mt-2 flex justify-end">
          <Button type="submit" isLoading={isSubmitting} disabled={!canSubmit}>
            {t("profile.changePassword.submit")}
          </Button>
        </div>
      </form>
    </Card>
  );
}
