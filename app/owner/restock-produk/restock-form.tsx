"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { formatRupiah } from "../../pelanggan/data";
import { useAppFeedback } from "../../components/app-feedback";
import { OwnerPageHeading } from "../owner-ui";

type Product = {
  id: string;
  name: string;
  sellingPrice: number;
  stock: number;
  unit: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isProduct(value: unknown): value is Product {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.sellingPrice === "number" &&
    typeof value.stock === "number" &&
    typeof value.unit === "string"
  );
}

function getErrorMessage(value: unknown, fallback: string) {
  return isRecord(value) && typeof value.message === "string"
    ? value.message
    : fallback;
}

export default function OwnerRestockPage() {
  const { showToast } = useAppFeedback();

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<"Penambahan" | "Pengurangan">("Penambahan");
  const [adjustmentQuantity, setAdjustmentQuantity] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [adjustmentSaving, setAdjustmentSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [adjustmentError, setAdjustmentError] = useState("");

  const selectedProduct = products.find(
    (item) => item.id === selectedProductId,
  );

  const amount = Number(quantity);
  const unitPurchasePrice = Number(purchasePrice);
  const validQuantity = Number.isSafeInteger(amount) && amount > 0;
  const validPurchasePrice =
    Number.isSafeInteger(unitPurchasePrice) && unitPurchasePrice > 0;
  const subtotal =
    validQuantity && validPurchasePrice
      ? amount * unitPurchasePrice
      : 0;
  const adjustmentAmount = Number(adjustmentQuantity);
  const validAdjustmentQuantity =
    Number.isSafeInteger(adjustmentAmount) && adjustmentAmount > 0;
  const finalAdjustmentStock =
    selectedProduct && validAdjustmentQuantity
      ? adjustmentType === "Penambahan"
        ? selectedProduct.stock + adjustmentAmount
        : selectedProduct.stock - adjustmentAmount
      : null;

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const response = await fetch("/api/owner/restock", {
        cache: "no-store",
      });

      const result: unknown = await response.json();

      if (
        !response.ok ||
        !isRecord(result) ||
        !Array.isArray(result.products) ||
        !result.products.every(isProduct)
      ) {
        throw new Error(
          getErrorMessage(result, "Data produk tidak dapat dimuat."),
        );
      }

      setProducts(result.products);
    } catch (loadError) {
      setLoadError(
        loadError instanceof Error
          ? loadError.message
          : "Data produk tidak dapat dimuat.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadProducts);
  }, [loadProducts]);

  function chooseProduct(id: string) {
    setSelectedProductId(id);
    setQuantity("");
    setPurchasePrice("");
    setAdjustmentQuantity("");
    setAdjustmentReason("");
    setAdjustmentType("Penambahan");
    setError("");
    setAdjustmentError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!selectedProduct) {
      setError("Pilih produk yang akan direstock.");
      return;
    }

    if (!validQuantity) {
      setError("Jumlah stok harus berupa bilangan bulat positif.");
      return;
    }

    if (!validPurchasePrice) {
      setError("Harga beli satuan harus berupa bilangan bulat positif.");
      return;
    }

    if (!Number.isSafeInteger(subtotal) || subtotal > 9_999_999_999) {
      setError("Subtotal restock melebihi batas nominal yang diizinkan.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/owner/restock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: selectedProduct.id,
          quantity: amount,
          purchasePrice: unitPurchasePrice,
        }),
      });

      const result: unknown = await response.json();

      if (
        !response.ok ||
        !isRecord(result) ||
        result.success !== true ||
        !isRecord(result.restock) ||
        !isRecord(result.restock.product) ||
        typeof result.restock.product.id !== "string" ||
        typeof result.restock.product.stock !== "number" ||
        typeof result.restock.restockId !== "string" ||
        typeof result.restock.subtotal !== "number"
      ) {
        throw new Error(
          getErrorMessage(result, "Restock tidak dapat disimpan."),
        );
      }

      const updatedProductId = result.restock.product.id;
      const updatedStock = result.restock.product.stock;
      const restockId = result.restock.restockId;
      const savedSubtotal = result.restock.subtotal;

      setProducts((current) =>
        current.map((product) =>
          product.id === updatedProductId
            ? { ...product, stock: updatedStock }
            : product,
        ),
      );

      showToast(
        "Restock Berhasil Disimpan",
        `Restock ${restockId} tersimpan. Stok ${selectedProduct.name} bertambah ${amount} ${selectedProduct.unit}. Subtotal: ${formatRupiah(savedSubtotal)}.`,
        "success",
      );

      setQuantity("");
      setPurchasePrice("");
      setError("");
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Restock tidak dapat disimpan.";

      setError(message);
      showToast("Restock Gagal", message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function submitAdjustment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAdjustmentError("");

    if (!selectedProduct) {
      setAdjustmentError("Pilih produk yang akan disesuaikan stoknya.");
      return;
    }

    if (!validAdjustmentQuantity) {
      setAdjustmentError("Jumlah penyesuaian harus berupa bilangan bulat positif.");
      return;
    }

    if (adjustmentType === "Pengurangan" && adjustmentAmount > selectedProduct.stock) {
      setAdjustmentError("Pengurangan stok tidak boleh melebihi stok yang tersedia.");
      return;
    }

    if (!adjustmentReason.trim()) {
      setAdjustmentError("Masukkan alasan penyesuaian stok.");
      return;
    }

    if (finalAdjustmentStock !== null && finalAdjustmentStock < 0) {
      setAdjustmentError("Stok akhir tidak boleh bernilai negatif.");
      return;
    }

    setAdjustmentSaving(true);

    try {
      const response = await fetch("/api/owner/stock-adjustments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: selectedProduct.id,
          type: adjustmentType,
          quantity: adjustmentAmount,
          reason: adjustmentReason.trim(),
        }),
      });

      const result: unknown = await response.json();

      if (
        !response.ok ||
        !isRecord(result) ||
        result.success !== true ||
        !isRecord(result.adjustment) ||
        typeof result.adjustment.id !== "string" ||
        typeof result.adjustment.afterStock !== "number"
      ) {
        throw new Error(
          getErrorMessage(result, "Penyesuaian stok tidak dapat disimpan."),
        );
      }

      const updatedStock = result.adjustment.afterStock;
      setProducts((current) =>
        current.map((product) =>
          product.id === selectedProduct.id
            ? { ...product, stock: updatedStock }
            : product,
        ),
      );

      showToast(
        "Penyesuaian Stok Berhasil",
        `Penyesuaian ${adjustmentType.toLowerCase()} stok ${selectedProduct.name} tersimpan. Stok akhir: ${updatedStock} ${selectedProduct.unit}.`,
        "success",
      );

      setAdjustmentQuantity("");
      setAdjustmentReason("");
      setAdjustmentType("Penambahan");
      setAdjustmentError("");
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Penyesuaian stok tidak dapat disimpan.";

      setAdjustmentError(message);
      showToast("Penyesuaian Stok Gagal", message, "error");
    } finally {
      setAdjustmentSaving(false);
    }
  }

  return (
    <div className="cashier-page owner-page">
      <OwnerPageHeading
        title="Restock Produk"
        description="Pilih produk, lalu tambahkan jumlah stok dan harga belinya."
      />



      {loadError && (
        <div className="cashier-error-banner" role="alert">
          {loadError}
          <button
            className="cashier-text-link"
            onClick={() => void loadProducts()}
            type="button"
          >
            Coba lagi
          </button>
        </div>
      )}

      <section className="cashier-panel owner-table-panel">
        <div className="cashier-panel-heading">
          <div>
            <h2>Daftar Produk</h2>

          </div>
        </div>

        {loading ? (
          <div className="cashier-empty-state" aria-busy="true">
            <p>Memuat data produk...</p>
          </div>
        ) : products.length > 0 ? (
          <div className="cashier-table-scroll owner-table-scroll">
            <table className="cashier-table owner-table">
              <thead>
                <tr>
                  <th scope="col">Nama Produk</th>
                  <th scope="col">Stok</th>
                  <th scope="col">Satuan</th>
                  <th scope="col">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.stock}</td>
                    <td>{product.unit}</td>
                    <td>
                      <button
                        aria-pressed={selectedProductId === product.id}
                        className={`cashier-row-action owner-select-action${selectedProductId === product.id ? " is-selected" : ""}`}
                        onClick={() => chooseProduct(product.id)}
                        type="button"
                      >
                        Pilih
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="cashier-empty-state owner-empty-state">
            <p>Belum ada produk pada katalog. Tambahkan produk terlebih dahulu.</p>
          </div>
        )}
      </section>

      {selectedProduct && (
        <>
          <form
            className="cashier-form-panel owner-restock-form"
            onSubmit={submit}
            noValidate
          >
            <div className="owner-form-heading">
              <h2>Tambah Stok Produk</h2>
              <p>
                Produk terpilih: <strong>{selectedProduct.name}</strong>
              </p>
            </div>

            <div className="cashier-field">
              <label htmlFor="owner-restock-quantity">
                Jumlah Stok Ditambah
              </label>
              <input
                aria-invalid={Boolean(error && !validQuantity)}
                id="owner-restock-quantity"
                min="1"
                onChange={(event) => {
                  setQuantity(event.target.value);
                  setError("");
                }}
                placeholder="Contoh: 10"
                step="1"
                type="number"
                value={quantity}
              />
            </div>

            <div className="cashier-field">
              <label htmlFor="owner-restock-purchase-price">
                Harga Beli Satuan (Rp)
              </label>
              <input
                aria-invalid={Boolean(error && !validPurchasePrice)}
                id="owner-restock-purchase-price"
                min="1"
                onChange={(event) => {
                  setPurchasePrice(event.target.value);
                  setError("");
                }}
                placeholder="Contoh: 15000"
                step="1"
                type="number"
                value={purchasePrice}
              />
            </div>

            <p className="owner-stock-preview">
              Stok saat ini: {selectedProduct.stock} {selectedProduct.unit}
              {" · "}
              Harga jual katalog: {formatRupiah(selectedProduct.sellingPrice)}
            </p>

            <p className="owner-stock-preview">
              Estimasi subtotal pembelian:{" "}
              <strong>
                {formatRupiah(subtotal)}
              </strong>
            </p>

            {error && (
              <p className="cashier-error-banner" role="alert">
                {error}
              </p>
            )}

            <div className="cashier-form-actions">
              <button
                className="cashier-button cashier-button--primary"
                disabled={saving || !validQuantity || !validPurchasePrice}
                type="submit"
              >
                {saving ? "Menyimpan..." : "Simpan Stok"}
              </button>
            </div>
          </form>

          <form
            className="cashier-form-panel owner-restock-form"
            onSubmit={submitAdjustment}
            noValidate
          >
            <div className="owner-form-heading">
              <h2>Penyesuaian Stok</h2>
              <p>
                Produk terpilih: <strong>{selectedProduct.name}</strong>
              </p>
            </div>

            <div className="cashier-field">
              <label htmlFor="owner-stock-adjustment-type">Jenis Penyesuaian</label>
              <select
                id="owner-stock-adjustment-type"
                onChange={(event) => {
                  setAdjustmentType(event.target.value as "Penambahan" | "Pengurangan");
                  setAdjustmentError("");
                }}
                value={adjustmentType}
              >
                <option value="Penambahan">Penambahan</option>
                <option value="Pengurangan">Pengurangan</option>
              </select>
            </div>

            <div className="cashier-field">
              <label htmlFor="owner-stock-adjustment-quantity">
                Jumlah Penyesuaian
              </label>
              <input
                aria-invalid={Boolean(adjustmentError && !validAdjustmentQuantity)}
                id="owner-stock-adjustment-quantity"
                min="1"
                onChange={(event) => {
                  setAdjustmentQuantity(event.target.value);
                  setAdjustmentError("");
                }}
                placeholder="Contoh: 5"
                step="1"
                type="number"
                value={adjustmentQuantity}
              />
            </div>

            <div className="cashier-field cashier-field--full">
              <label htmlFor="owner-stock-adjustment-reason">Alasan Penyesuaian</label>
              <textarea
                id="owner-stock-adjustment-reason"
                maxLength={100}
                onChange={(event) => {
                  setAdjustmentReason(event.target.value);
                  setAdjustmentError("");
                }}
                placeholder="Contoh: Koreksi stok, barang rusak, atau penghapusan produk uji"
                rows={3}
                value={adjustmentReason}
              />
            </div>

            <p className="owner-stock-preview">
              Stok saat ini: {selectedProduct.stock} {selectedProduct.unit}
            </p>

            <p className="owner-stock-preview">
              Stok akhir setelah penyesuaian: <strong>
                {finalAdjustmentStock === null ? "—" : `${finalAdjustmentStock} ${selectedProduct.unit}`}
              </strong>
            </p>

            {adjustmentError && (
              <p className="cashier-error-banner" role="alert">
                {adjustmentError}
              </p>
            )}

            <div className="cashier-form-actions">
              <button
                className="cashier-button cashier-button--primary"
                disabled={adjustmentSaving || !validAdjustmentQuantity || !adjustmentReason.trim()}
                type="submit"
              >
                {adjustmentSaving ? "Menyimpan..." : "Konfirmasi Penyesuaian"}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
