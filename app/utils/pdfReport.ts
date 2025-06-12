import { printToFileAsync } from "expo-print";
import { shareAsync } from "expo-sharing";

// Fungsi utama untuk ekspor PDF laporan
export async function exportPDFReport({
  year,
  month,
  orders,
  expenses,
}: {
  year: number;
  month: number | null;
  orders: any[];
  expenses: any[];
}) {
  const monthName =
    month !== null
      ? new Date(0, month).toLocaleString("id-ID", { month: "long" })
      : "Semua Bulan";

  const formatRupiah = (num: number) =>
    `Rp ${num.toLocaleString("id-ID", { minimumFractionDigits: 0 })}`;

  const formatDate = (d: Date) =>
    d.toLocaleDateString("id-ID", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  // Filter pemasukan
  const incomeItems = orders.filter((o) => {
    if (!o.createdAt || o.payment !== "paid") return false;
    const d = o.createdAt instanceof Date ? o.createdAt : o.createdAt.toDate?.();
    if (!d) return false;
    if (d.getFullYear() !== year) return false;
    if (month !== null && d.getMonth() !== month) return false;
    return true;
  });

  // Filter pengeluaran
  const expenseItems = expenses.filter((e) => {
    if (!e.date) return false;
    const d = e.date instanceof Date ? e.date : e.date.toDate?.();
    if (!d) return false;
    if (d.getFullYear() !== year) return false;
    if (month !== null && d.getMonth() !== month) return false;
    return true;
  });

  // Perhitungan total
  const income = incomeItems.reduce((sum, o) => sum + (+o.total || 0), 0);
  const expense = expenseItems.reduce((sum, e) => sum + (+e.amount || 0), 0);
  const profit = income - expense;

  // Tabel pemasukan
  const incomeTableRows = incomeItems
    .map((o, i) => {
      const date = formatDate(
        o.createdAt instanceof Date ? o.createdAt : o.createdAt.toDate?.()
      );
      return `<tr>
        <td>${i + 1}</td>
        <td>${date}</td>
        <td>${o.orderNumber || "-"}</td>
        <td>${o.customerName || "-"}</td>
        <td>${formatRupiah(+o.total || 0)}</td>
      </tr>`;
    })
    .join("");

  // Tabel pengeluaran
  const expenseTableRows = expenseItems
    .map((e, i) => {
      const date = formatDate(
        e.date instanceof Date ? e.date : e.date.toDate?.()
      );
      return `<tr>
        <td>${i + 1}</td>
        <td>${date}</td>
        <td>${e.category || "-"}</td>
        <td>${e.description || "-"}</td>
        <td>${formatRupiah(+e.amount || 0)}</td>
      </tr>`;
    })
    .join("");

  // HTML untuk PDF
  const html = `
    <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          h1, h2 { text-align: center; margin-bottom: 5px; }
          .header { text-align: center; margin-bottom: 20px; }
          .header p { margin: 2px; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background-color: #f0f0f0; }
          .section { margin-top: 30px; }
          .summary-box {
            margin-top: 30px;
            padding: 15px;
            background-color: #f9f9f9;
            border: 1px solid #ddd;
            font-size: 14px;
          }
          .summary-box p { margin: 5px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>IFA CELL & LAUNDRY</h1>
          <p>Jln. Bumi Tamalanrea Permai No.18</p>
          <p>Tamalanrea, Makassar, Sulawesi Selatan 90245</p>
          <p>Telp: 0821-9482-2418</p>
          <p><strong>Periode:</strong> ${monthName} ${year}</p>
        </div>

        <div class="section">
          <h2>Rincian Pemasukan</h2>
          <table>
            <thead>
              <tr><th>No</th><th>Tanggal</th><th>No Order</th><th>Nama Pelanggan</th><th>Total</th></tr>
            </thead>
            <tbody>
              ${
                incomeTableRows ||
                `<tr><td colspan="5">Tidak ada data pemasukan</td></tr>`
              }
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Rincian Pengeluaran</h2>
          <table>
            <thead>
              <tr><th>No</th><th>Tanggal</th><th>Kategori</th><th>Deskripsi</th><th>Total</th></tr>
            </thead>
            <tbody>
              ${
                expenseTableRows ||
                `<tr><td colspan="5">Tidak ada data pengeluaran</td></tr>`
              }
            </tbody>
          </table>
        </div>

        <div class="summary-box">
          <p><strong>Total Pemasukan:</strong> ${formatRupiah(income)}</p>
          <p><strong>Total Pengeluaran:</strong> ${formatRupiah(expense)}</p>
          <p><strong>Laba Bersih:</strong> ${formatRupiah(profit)}</p>
        </div>
      </body>
    </html>
  `;

  const file = await printToFileAsync({ html, base64: false });
  await shareAsync(file.uri);
}
