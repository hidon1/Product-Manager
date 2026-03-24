/**
 * Firebase Cloud Functions — Product Manager (מוצרלה)
 *
 * Two functions:
 *  1. generateProductsJson  — triggered on products/{productId} writes.
 *     Collects all active products sorted by sortOrder and writes
 *     public-json/{clientId}/products.json to Firebase Storage.
 *
 *  2. generateStyleJson — triggered on storefront/settings writes.
 *     Writes public-json/{clientId}/product-style.json to Firebase Storage.
 *
 * Deploy:
 *   firebase deploy --only functions
 */

const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");

initializeApp();

const db = getFirestore();

/**
 * Build the product payload with the required data structure.
 * Normalises variants so each group has name + options as a plain string array.
 *
 * @param {string} id - Firestore document ID
 * @param {object} data - Firestore document data
 * @returns {object}
 */
function buildProductPayload(id, data) {
  const variants = (data.variants || [])
    .filter((group) => group?.name && (group.options || []).length)
    .map((group) => ({
      name: group.name,
      options: (group.options || [])
        .map((option) =>
          typeof option === "string"
            ? option
            : option?.label ?? option?.value ?? ""
        )
        .filter(Boolean),
    }));

  return {
    id,
    name: data.name || "",
    description: data.description || "",
    price: Number(data.price || 0),
    salePrice: data.salePrice != null ? Number(data.salePrice) : null,
    active: data.active !== false,
    category: data.category || "",
    imageUrl: data.imageUrl || "",
    imagePath: data.imagePath || "",
    sortOrder: Number(data.sortOrder || 0),
    createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : null,
    updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : null,
    variants,
  };
}

/**
 * Build the product-style payload with the required data structure.
 *
 * @param {object} data - Firestore storefront/settings document data
 * @returns {object}
 */
function buildStylePayload(data) {
  return {
    cardBackground: data.cardBackground || "#ffffff",
    textColor: data.textColor || "#111827",
    buttonColor: data.buttonColor || "#111827",
    buttonTextColor: data.buttonTextColor || "#ffffff",
    borderRadius: Number(data.borderRadius || 24),
    cardPadding: Number(data.cardPadding || 18),
    imageHeight: Number(data.imageHeight || 220),
    textAlign: data.textAlign || "right",
    layout: data.layout || "grid",
    desktopColumns: Number(data.desktopColumns || 4),
    mobileColumns: Number(data.mobileColumns || 2),
    animationStyle: data.animationStyle || "none",
    animationDuration: Number(data.animationDuration || 0.8),
    cardShadow: data.cardShadow || "",
    buttonStyle: data.buttonStyle || "rounded",
  };
}

/**
 * Fetch all active products for a client, sort by sortOrder, and write
 * public-json/{clientId}/products.json to the default Storage bucket.
 *
 * @param {string} clientId - Firebase UID of the account owner
 */
async function generateProductsJson(clientId) {
  const snapshot = await db
    .collection("users")
    .doc(clientId)
    .collection("products")
    .get();

  const products = snapshot.docs
    .map((d) => buildProductPayload(d.id, d.data()))
    .filter((p) => p.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const bucket = getStorage().bucket();
  const file = bucket.file(`public-json/${clientId}/products.json`);

  await file.save(JSON.stringify(products, null, 2), {
    contentType: "application/json",
    metadata: {
      cacheControl: "public, max-age=60",
    },
  });

  // Make the file publicly readable via its GCS URL
  await file.makePublic();
}

/**
 * Write public-json/{clientId}/product-style.json to the default Storage bucket.
 *
 * @param {string} clientId - Firebase UID of the account owner
 * @param {object} data - Firestore storefront/settings document data
 */
async function generateStyleJson(clientId, data) {
  const style = buildStylePayload(data);
  const bucket = getStorage().bucket();
  const file = bucket.file(`public-json/${clientId}/product-style.json`);

  await file.save(JSON.stringify(style, null, 2), {
    contentType: "application/json",
    metadata: {
      cacheControl: "public, max-age=60",
    },
  });

  // Make the file publicly readable via its GCS URL
  await file.makePublic();
}

/**
 * Cloud Function: triggered on any write to a product document.
 * Regenerates the complete active-products JSON for the affected client.
 */
exports.generateProductsJson = onDocumentWritten(
  "users/{clientId}/products/{productId}",
  async (event) => {
    const { clientId } = event.params;
    try {
      await generateProductsJson(clientId);
      console.log(`products.json updated for client ${clientId}`);
    } catch (err) {
      console.error(`Failed to update products.json for client ${clientId}:`, err);
    }
  }
);

/**
 * Cloud Function: triggered on any write to the storefront settings document.
 * Regenerates the product-style JSON for the affected client.
 */
exports.generateStyleJson = onDocumentWritten(
  "users/{clientId}/storefront/settings",
  async (event) => {
    const { clientId } = event.params;
    const data = event.data?.after?.data();
    if (!data) {
      console.log(`Style document deleted for client ${clientId} — skipping JSON update`);
      return;
    }
    try {
      await generateStyleJson(clientId, data);
      console.log(`product-style.json updated for client ${clientId}`);
    } catch (err) {
      console.error(`Failed to update product-style.json for client ${clientId}:`, err);
    }
  }
);
