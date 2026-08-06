import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { usersApi } from "../../api/users";
import { getApiErrorMessage, applyApiFieldErrors } from "../../api/client";
import { USER_ROLES } from "../../types/users";

const schema = z
  .object({
    username: z
      .string()
      .min(3, "usernameMin")
      .regex(/^[a-zA-Z0-9_.-]+$/, "usernameInvalid"),
    first_name: z.string().min(1, "firstNameRequired"),
    last_name: z.string().min(1, "lastNameRequired"),
    password: z.string().min(8, "passwordMin"),
    confirmPassword: z.string().min(1, "confirmPasswordRequired"),
    role: z.string().min(1, "roleRequired"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwordMismatch",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  username: "",
  first_name: "",
  last_name: "",
  password: "",
  confirmPassword: "",
  role: String(USER_ROLES[0].value),
};

export default function Users() {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  });

  const roleOptions = USER_ROLES.map((role) => ({
    value: String(role.value),
    label: t(`users.${role.labelKey}`),
  }));

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await usersApi.createUser({
        username: values.username,
        first_name: values.first_name,
        last_name: values.last_name,
        password: values.password,
        role: Number(values.role),
      });
      toast.success(t("users.createSuccess", { username: values.username }));
      reset(emptyValues);
    } catch (error) {
      applyApiFieldErrors<FormValues>(error, setError);
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldError = (message: string | undefined) =>
    message ? t(`users.${message}`, { defaultValue: message }) : undefined;

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-md p-6">
        <h1 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          {t("users.createUser")}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label={t("users.username")}
            error={fieldError(errors.username?.message)}
            {...register("username")}
          />

          <Input
            label={t("users.firstName")}
            error={fieldError(errors.first_name?.message)}
            {...register("first_name")}
          />

          <Input
            label={t("users.lastName")}
            error={fieldError(errors.last_name?.message)}
            {...register("last_name")}
          />

          <div className="relative">
            <Input
              label={t("users.password")}
              type={showPassword ? "text" : "password"}
              error={fieldError(errors.password?.message)}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute bottom-2.5 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label={t(
                showPassword ? "users.hidePassword" : "users.showPassword",
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
              label={t("users.confirmPassword")}
              type={showConfirmPassword ? "text" : "password"}
              error={fieldError(errors.confirmPassword?.message)}
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute bottom-2.5 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label={t(
                showConfirmPassword ? "users.hidePassword" : "users.showPassword",
              )}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          <Select
            label={t("users.role")}
            options={roleOptions}
            error={fieldError(errors.role?.message)}
            {...register("role")}
          />

          <Button type="submit" isLoading={isSubmitting} className="mt-2">
            {t("users.create")}
          </Button>
        </form>
      </Card>
    </div>
  );
}
