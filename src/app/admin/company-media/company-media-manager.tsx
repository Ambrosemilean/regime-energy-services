/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";

type CompanyMedia = {
  id: string;
  image_url: string;
  title: string | null;
  alt_text: string | null;
  description: string | null;
  display_order: number;
  is_active: boolean;
};

function findWeighbridgeMedia(media: CompanyMedia[]) {
  return (
    media.find((item) =>
      [item.title, item.alt_text]
        .filter(Boolean)
        .some((value) =>
          (value as string).toLowerCase().includes("weighbridge")
        )
    ) ?? null
  );
}

export default function CompanyMediaManager({
  media,
}: {
  media: CompanyMedia[];
}) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingError, setDeletingError] = useState("");

  // Weighbridge image — a dedicated single-image slot stored with the
  // title "Weighbridge" so the homepage featured section can find it.
  const weighbridgeImage = findWeighbridgeMedia(media);

  const [weighbridgeFile, setWeighbridgeFile] = useState<File | null>(null);
  const [weighbridgeUploading, setWeighbridgeUploading] = useState(false);
  const [weighbridgeError, setWeighbridgeError] = useState("");

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    setSuccess("");

    const files = Array.from(event.target.files || []);

    const validFiles = files.filter((file) => {
      const validType = [
        "image/jpeg",
        "image/png",
        "image/webp",
      ].includes(file.type);

      const validSize = file.size <= 5 * 1024 * 1024;

      return validType && validSize;
    });

    if (validFiles.length !== files.length) {
      setError(
        "Some files were skipped. Only JPG, PNG and WEBP images up to 5MB are allowed."
      );
    }

    setSelectedFiles((previousFiles) => {
      const existingFiles = new Set(
        previousFiles.map(
          (file) => `${file.name}-${file.size}-${file.lastModified}`
        )
      );

      const newFiles = validFiles.filter(
        (file) =>
          !existingFiles.has(`${file.name}-${file.size}-${file.lastModified}`)
      );

      return [...previousFiles, ...newFiles];
    });

    // Allow the same file to be selected again if needed
    event.target.value = "";
  }

  function removeSelectedFile(fileToRemove: File) {
    setSelectedFiles((previousFiles) =>
      previousFiles.filter(
        (file) =>
          !(
            file.name === fileToRemove.name &&
            file.size === fileToRemove.size &&
            file.lastModified === fileToRemove.lastModified
          )
      )
    );
  }

  function clearSelectedFiles() {
    setSelectedFiles([]);
    setError("");
    setSuccess("");
  }

  async function handleUpload() {
    if (selectedFiles.length === 0) {
      setError("Please select at least one image.");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();

      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/admin/company-media", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload images.");
      }

      setSelectedFiles([]);

      setSuccess(
        `${result.uploaded} image${result.uploaded === 1 ? "" : "s"
        } uploaded successfully.`
      );

      window.location.reload();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while uploading."
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingError("");
    setDeletingId(id);

    try {
      const response = await fetch(`/api/admin/company-media/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete the image.");
      }

      window.location.reload();
    } catch (err) {
      setDeletingError(
        err instanceof Error
          ? err.message
          : "Something went wrong while deleting."
      );
    } finally {
      setDeletingId(null);
    }
  }

  function handleWeighbridgeFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setWeighbridgeError("Only JPG, PNG and WEBP images are allowed.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setWeighbridgeError("The image must be 5MB or smaller.");
      event.target.value = "";
      return;
    }

    setWeighbridgeError("");
    setWeighbridgeFile(file);
  }

  /**
   * Uploading always replaces the existing weighbridge image: the new file
   * goes up first, then the old record (and its storage object) is deleted
   * so only one weighbridge image exists.
   */
  async function handleWeighbridgeUpload() {
    if (!weighbridgeFile) {
      setWeighbridgeError("Please choose an image first.");
      return;
    }

    setWeighbridgeUploading(true);
    setWeighbridgeError("");

    try {
      const formData = new FormData();
      formData.append("files", weighbridgeFile);
      formData.append("title", "Weighbridge");

      const response = await fetch("/api/admin/company-media", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload the image.");
      }

      if (weighbridgeImage) {
        await fetch(`/api/admin/company-media/${weighbridgeImage.id}`, {
          method: "DELETE",
        });
      }

      window.location.reload();
    } catch (err) {
      setWeighbridgeError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setWeighbridgeUploading(false);
    }
  }

  async function handleWeighbridgeDelete() {
    if (!weighbridgeImage) return;

    setWeighbridgeUploading(true);
    setWeighbridgeError("");

    try {
      const response = await fetch(
        `/api/admin/company-media/${weighbridgeImage.id}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete the image.");
      }

      window.location.reload();
    } catch (err) {
      setWeighbridgeError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setWeighbridgeUploading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Weighbridge image — feeds the homepage featured section */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">
          Weighbridge Image
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Shown in the &quot;Weighbridge Services&quot; section on the
          homepage. One image only — uploading a new one replaces the
          previous.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            {weighbridgeImage ? (
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <img
                  src={weighbridgeImage.image_url}
                  alt="Weighbridge"
                  className="h-52 w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-52 items-center justify-center rounded-lg bg-gray-100 text-sm text-gray-500">
                No weighbridge image uploaded
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center gap-4">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleWeighbridgeFileChange}
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm"
            />

            {weighbridgeFile && (
              <p className="text-sm text-gray-600">
                Selected: {weighbridgeFile.name}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleWeighbridgeUpload}
                disabled={weighbridgeUploading || !weighbridgeFile}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {weighbridgeUploading
                  ? "Working..."
                  : weighbridgeImage
                    ? "Update Image"
                    : "Upload Image"}
              </button>

              {weighbridgeImage && (
                <button
                  type="button"
                  onClick={handleWeighbridgeDelete}
                  disabled={weighbridgeUploading}
                  className="rounded-lg border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                >
                  Delete
                </button>
              )}
            </div>

            {weighbridgeError && (
              <p className="text-sm text-red-600">{weighbridgeError}</p>
            )}
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">
          Upload Company Images
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Upload multiple images for the Regime Energy Services website
          slideshow.
        </p>

        <div className="mt-6">
          <label
            htmlFor="company-images"
            className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center hover:border-blue-400 hover:bg-blue-50"
          >
            <div className="text-4xl">📷</div>

            <p className="mt-3 font-medium text-gray-700">
              Click to select company images
            </p>

            <p className="mt-1 text-sm text-gray-500">
              You can select multiple images at once
            </p>

            <p className="mt-1 text-sm text-gray-500">
              JPG, PNG or WEBP — maximum 5MB per image
            </p>

            <input
              id="company-images"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Selected files */}
        {selectedFiles.length > 0 && (
          <div className="mt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="font-medium text-gray-900">
                Selected Images ({selectedFiles.length})
              </h3>

              <button
                type="button"
                onClick={clearSelectedFiles}
                disabled={uploading}
                className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                Clear All
              </button>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {selectedFiles.map((file) => (
                <div
                  key={`${file.name}-${file.size}-${file.lastModified}`}
                  className="relative overflow-hidden rounded-lg border border-gray-200 bg-white"
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="h-32 w-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={() => removeSelectedFile(file)}
                    disabled={uploading}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white shadow hover:bg-red-700 disabled:opacity-50"
                    title="Remove image"
                  >
                    ×
                  </button>

                  <div className="p-3">
                    <p className="truncate text-sm font-medium text-gray-700">
                      {file.name}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="mt-6 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading
                ? "Uploading..."
                : `Upload ${selectedFiles.length} Image${selectedFiles.length === 1 ? "" : "s"
                }`}
            </button>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-5 rounded-lg bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}
      </div>

      {/* Existing Images */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Company Slideshow Images
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {media.length} image{media.length === 1 ? "" : "s"} currently
            uploaded.
          </p>
        </div>

        {deletingError && (
          <div className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {deletingError}
          </div>
        )}

        {media.length === 0 ? (
          <div className="mt-6 rounded-lg bg-gray-50 p-10 text-center">
            <p className="font-medium text-gray-700">
              No company images uploaded yet.
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Upload your first images above to begin building the website
              slideshow.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {media.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-xl border border-gray-200"
              >
                <img
                  src={item.image_url}
                  alt={item.alt_text || "Regime Energy Services"}
                  className="h-52 w-full object-cover"
                />

                <div className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                      Order {item.display_order}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${item.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                        }`}
                    >
                      {item.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <h3 className="mt-4 font-semibold text-gray-900">
                    {item.title || "Untitled Image"}
                  </h3>

                  {item.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                      {item.description}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId !== null}
                    className="mt-4 w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingId === item.id ? "Deleting..." : "Remove Image"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
