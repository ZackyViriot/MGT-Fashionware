import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Size Guide",
  description: "Find your perfect fit — size charts for shirts, hoodies, and more at MGT Fashion.",
};

const sizeCharts = [
  {
    garment: "T-Shirts",
    headers: ["Size", "Chest (in)", "Length (in)", "Sleeve (in)"],
    rows: [
      ["S", "36", "28", "8"],
      ["M", "40", "29", "8.5"],
      ["L", "44", "30", "9"],
      ["XL", "48", "31", "9.5"],
      ["2XL", "52", "32", "10"],
    ],
  },
  {
    garment: "Hoodies",
    headers: ["Size", "Chest (in)", "Length (in)", "Sleeve (in)"],
    rows: [
      ["S", "38", "26", "24"],
      ["M", "42", "27", "25"],
      ["L", "46", "28", "26"],
      ["XL", "50", "29", "27"],
      ["2XL", "54", "30", "28"],
    ],
  },
  {
    garment: "Long Sleeves",
    headers: ["Size", "Chest (in)", "Length (in)", "Sleeve (in)"],
    rows: [
      ["S", "36", "28", "24"],
      ["M", "40", "29", "25"],
      ["L", "44", "30", "26"],
      ["XL", "48", "31", "27"],
      ["2XL", "52", "32", "28"],
    ],
  },
];

export default function SizeGuidePage() {
  return (
    <section className="px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-heading font-bold text-3xl md:text-4xl tracking-tight mb-3">Size Guide</h1>
        <p className="text-sm text-muted mb-10">All measurements are approximate. When in doubt, size up for a more relaxed fit.</p>

        <div className="space-y-10">
          {sizeCharts.map((chart) => (
            <div key={chart.garment}>
              <h2 className="font-heading font-bold text-lg text-primary mb-4">{chart.garment}</h2>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface">
                      {chart.headers.map((h) => (
                        <th key={h} className="text-left px-4 py-3 font-semibold text-primary text-xs uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {chart.rows.map((row, i) => (
                      <tr key={i} className="border-t border-border">
                        {row.map((cell, j) => (
                          <td key={j} className={`px-4 py-3 ${j === 0 ? "font-medium text-primary" : "text-muted"}`}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
