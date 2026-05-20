import { useRef, useState } from "react";
import { supabase } from "../services/supabase";
import { TASK_PHOTO_MAX_DIMENSION, TASK_PHOTO_JPEG_QUALITY } from "../lib/constants";

async function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;
      const scale = Math.min(1, TASK_PHOTO_MAX_DIMENSION / Math.max(width, height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => resolve(new File([blob], "photo.jpg", { type: "image/jpeg" })),
        "image/jpeg",
        TASK_PHOTO_JPEG_QUALITY
      );
    };
    img.src = url;
  });
}

function TaskPhotoUploader({ task, onUploadComplete, onCancel }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function handleFileChange(e) {
    const raw = e.target.files?.[0];
    if (!raw) return;
    setError("");
    const objUrl = URL.createObjectURL(raw);
    setPreview(objUrl);
    setFile(raw);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const compressed = await compressImage(file);
      const path = `${task.child_id}/${task.id}-${Date.now()}.jpg`;
      const { error: storageError } = await supabase.storage
        .from("task-photos")
        .upload(path, compressed, { contentType: "image/jpeg", upsert: true });

      if (storageError) throw storageError;

      const { data: { publicUrl } } = supabase.storage
        .from("task-photos")
        .getPublicUrl(path);

      onUploadComplete(publicUrl);
    } catch (err) {
      console.error("Upload error:", err);
      setError("No se pudo subir la foto. Intenta nuevamente.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ marginTop: 8 }}>
      {!preview ? (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <button className="btn-upload-photo" onClick={() => inputRef.current.click()}>
            📷 Elegir foto
          </button>
        </>
      ) : (
        <>
          <img
            src={preview}
            alt="Vista previa"
            style={{ width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 10, marginBottom: 8 }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-complete-task" onClick={handleUpload} disabled={uploading}>
              {uploading ? "Subiendo…" : "Enviar foto"}
            </button>
            <button className="btn-cancel-inline" onClick={onCancel}>Cancelar</button>
          </div>
        </>
      )}
      {error && <p style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>{error}</p>}
    </div>
  );
}

export default TaskPhotoUploader;
