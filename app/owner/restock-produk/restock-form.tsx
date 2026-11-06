"use client";

import { useState, type FormEvent } from "react";
import { formatRupiah } from "../../pelanggan/data";
import { useOwnerPrototype } from "../owner-context";
import { OwnerPageHeading, OwnerPrototypeNote } from "../owner-ui";

export default function OwnerRestockPage() {
  const { catalog, addStock, announce } = useOwnerPrototype();
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");
  const products = catalog.filter((item) => item.kind === "Produk");
  const selectedProduct = products.find((item) => item.id === selectedProductId);

  function chooseProduct(id: string) {
    setSelectedProductId(id);
    setQuantity("");
    setError("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(quantity);
    if (!selectedProduct) {
      setError("Pilih produk yang akan direstock.");
      return;
    }
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      setError("Jumlah stok harus berupa bilangan bulat positif.");
      return;
    }
    if (!addStock(selectedProduct.id, amount)) {
      setError("Stok tidak dapat diperbarui. Periksa produk dan jumlah yang dimasukkan.");
      return;
    }
    announce(`Stok ${selectedProduct.name} berhasil ditambah ${amount} unit pada prototipe.`);
    setQuantity("");
    setError("");
  }

  return (
    <div className="cashier-page owner-page">
      <OwnerPageHeading
        title="Restock Produk"
        description="Pilih produk, lalu tambahkan jumlah stoknya."
      />
      <OwnerPrototypeNote>
        Perubahan stok disimpan pada prototipe browser. Riwayat restock tidak membuat transaksi penjualan.
      </OwnerPrototypeNote>
      <section className="cashier-panel owner-table-panel">
        <div className="cashier-panel-heading">
          <div>
            <h2>Daftar Produk</h2>
            <p>Produk dan stok bersumber dari katalog Owner yang sama.</p>
          </div>
        </div>
        {products.length > 0 ? (
          <div className="cashier-table-scroll owner-table-scroll">
            <table className="cashier-table owner-table">
              <thead>
                <tr>
                  <th scope="col">Nama Produk</th>
                  <th scope="col">Stok</th>
                  <th scope="col">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.stock ?? 0}</td>
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
        <form className="cashier-form-panel owner-restock-form" onSubmit={submit} noValidate>
          <div className="owner-form-heading">
            <h2>Tambah Stok Produk</h2>
            <p>Produk terpilih: <strong>{selectedProduct.name}</strong></p>
          </div>
          <div className="cashier-field">
            <label htmlFor="owner-restock-quantity">Jumlah Stok Ditambah</label>
            <input
              aria-describedby={error ? "owner-restock-error" : undefined}
              aria-invalid={Boolean(error)}
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
            {error && <span className="cashier-field-error" id="owner-restock-error">{error}</span>}
          </div>
          <p className="owner-stock-preview">
            Stok saat ini: {selectedProduct.stock ?? 0}
            {selectedProduct.price !== null && ` · Harga katalog: ${formatRupiah(selectedProduct.price)}`}
          </p>
          <div className="cashier-form-actions">
            <button className="cashier-button cashier-button--primary" type="submit">
              Simpan Stok
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
