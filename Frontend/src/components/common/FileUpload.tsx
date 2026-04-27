"use client";

import { useState } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface FileUploadProps {
  label?: string;
  value?: string;
  onChange?: (url: string) => void;
  onRemove?: () => void;
  placeholder?: string;
  className?: string;
  accept?: string;
}

export function FileUpload({
  label,
  value,
  onChange,
  onRemove,
  placeholder = "Paste an image URL (e.g. Cloudinary)",
  className,
}: FileUploadProps) {
  const [inputVal, setInputVal] = useState("");

  const handleAdd = () => {
    if (inputVal.trim()) {
      onChange?.(inputVal.trim());
      setInputVal("");
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <label className="text-sm font-medium text-gray-900">{label}</label>
      )}

      {value ? (
        <div className="relative w-full h-40 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Upload preview"
            className="w-full h-full object-cover"
          />
          {onRemove && (
            <button
              onClick={onRemove}
              className="absolute top-2 right-2 p-1 bg-white rounded-full shadow text-gray-600 hover:text-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="w-full h-40 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 bg-gray-50">
          <ImageIcon className="w-8 h-8" />
          <p className="text-xs">No image</p>
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="url"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
          <Upload className="w-4 h-4 mr-1" /> Set
        </Button>
      </div>
    </div>
  );
}
