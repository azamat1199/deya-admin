import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ImageIcon, FileIcon, X, Loader2 } from "lucide-react";
import { uploadFile } from "../api/upload";

const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp|svg|avif)$/i;

interface FileUploadProps {
  label?: string;
  value: string | null;
  onChange: (url: string | null) => void;
  accept?: string;
  maxSizeMB?: number;
  error?: string | null;
  onUploadingChange?: (isUploading: boolean) => void;
}

export function FileUpload({
  label,
  value,
  onChange,
  accept = "image/*",
  maxSizeMB,
  error,
  onUploadingChange,
}: FileUploadProps) {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
      setUploadError(t("upload.tooLarge", { maxSizeMB }));
      return;
    }
    setUploadError(null);
    setIsUploading(true);
    onUploadingChange?.(true);
    try {
      const url = await uploadFile(file);
      onChange(url);
    } catch {
      setUploadError(t("upload.failed"));
    } finally {
      setIsUploading(false);
      onUploadingChange?.(false);
    }
  };

  const isImage = value ? IMAGE_EXTENSIONS.test(value) : accept.includes("image");
  const displayError = error ?? uploadError;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </span>
      )}
      <div
        className={`flex flex-col items-center justify-center gap-2 rounded-md border border-dashed p-4 ${
          displayError
            ? "border-red-400"
            : "border-slate-300 dark:border-slate-700"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {t("upload.uploading")}
            </span>
          </div>
        ) : value ? (
          <>
            <div className="relative">
              {isImage ? (
                <img
                  src={value}
                  alt=""
                  className="max-h-32 rounded object-contain"
                />
              ) : (
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-slate-700 underline hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                >
                  <FileIcon className="h-6 w-6 shrink-0" />
                  <span className="max-w-48 truncate">
                    {value.split("/").pop()}
                  </span>
                </a>
              )}
              <button
                type="button"
                onClick={() => onChange(null)}
                className="absolute -right-2 -top-2 rounded-full bg-slate-900 p-1 text-white hover:bg-slate-700"
                aria-label={t("upload.remove")}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-xs font-medium text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              {t("upload.replace")}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center gap-2"
          >
            <ImageIcon className="h-8 w-8 text-slate-400" />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {t("upload.choose")}
            </span>
          </button>
        )}
      </div>
      {displayError && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-red-600">{displayError}</p>
          {uploadError && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-xs font-medium text-slate-500 underline hover:text-slate-700"
            >
              {t("upload.retry")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
