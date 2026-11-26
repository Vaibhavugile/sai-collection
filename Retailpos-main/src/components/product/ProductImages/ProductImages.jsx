
import { useRef } from "react";
import "./ProductImages.css";

export default function ProductImages({ product, setProduct }) {
  const inputRef = useRef(null);

  const handleImages = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const images = files.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      file,
      preview: URL.createObjectURL(file),
      isCover: false,
    }));

    setProduct((prev) => {
      const existingImages = prev.images || [];
      const combined = [...existingImages, ...images];

      if (!combined.some((image) => image.isCover)) {
        combined[0] = { ...combined[0], isCover: true };
      }

      return { ...prev, images: combined };
    });

    // Allow selecting the same file again later.
    e.target.value = "";
  };

  const removeImage = (id) => {
    setProduct((prev) => {
      const removed = prev.images.find((image) => image.id === id);

      if (removed?.file && removed.preview) {
        URL.revokeObjectURL(removed.preview);
      }

      let updated = prev.images.filter((image) => image.id !== id);

      if (updated.length && !updated.some((image) => image.isCover)) {
        updated = updated.map((image, index) => ({
          ...image,
          isCover: index === 0,
        }));
      }

      return { ...prev, images: updated };
    });
  };

  const setCover = (id) => {
    setProduct((prev) => ({
      ...prev,
      images: prev.images.map((image) => ({
        ...image,
        isCover: image.id === id,
      })),
    }));
  };

  return (
    <div className="product-card">
      <div className="product-card-header">
        <h2>Product Images</h2>
        <p>Upload, remove or change your product images.</p>
      </div>

      <div className="product-card-body">
        <div
          className="upload-box"
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
        >
          <h3>+ Upload Images</h3>
          <p>Click here to choose images</p>
          <span>PNG • JPG • WEBP</span>

          <input
            ref={inputRef}
            hidden
            multiple
            accept="image/*"
            type="file"
            onChange={handleImages}
          />
        </div>

        {product.images?.length > 0 && (
          <div className="image-grid">
            {product.images.map((img) => (
              <div className="image-card" key={img.id}>
                {img.isCover && (
                  <div className="cover-badge">Cover</div>
                )}

                <img
                  src={img.preview || img.url}
                  alt="Product"
                />

                <div className="image-actions">
                  {!img.isCover && (
                    <button
                      type="button"
                      onClick={() => setCover(img.id)}
                    >
                      Set Cover
                    </button>
                  )}

                  <button
                    className="delete-btn"
                    type="button"
                    onClick={() => removeImage(img.id)}
                  >
                    Delete
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
