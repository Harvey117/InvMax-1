import Icon from "../components/Icon";

const FAQ = [
  ["What is InvMax?", "InvMax is a web-based inventory management app for sari-sari store owners, school canteen operators, and small retail shops in the Philippines. It uses EOQ and Knapsack algorithms for smarter reorder decisions."],
  ["How does EOQ work?", "EOQ (Economic Order Quantity) = √(2DS/H), where D = annual demand, S = ordering cost, H = holding cost per unit/year. It minimizes total ordering + holding costs."],
  ["What is the Budget Planner?", "Uses a 0-1 dynamic programming (Knapsack) algorithm to select the most profitable products you can restock within your fixed budget."],
  ["What triggers a Low Stock alert?", "When any product falls below its reorder threshold (≈ 2 weeks of demand, minimum 5 units), a warning appears in the top bar."],
  ["Where is my data stored?", "All data is stored in Supabase (PostgreSQL in the cloud), so it syncs across all your devices."],
  ["Can I use InvMax on mobile?", "Yes! InvMax is fully responsive and works on phones, tablets, and desktops."],
  ["How do I reset my password?", "Use the Supabase-provided 'Forgot password' flow, or update it in Profile → New Password."],
  ["What are the password requirements?", "At least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character (!@#$%)."],
];

export default function HelpPage() {
  return (
    <>
      <div className="page-title">Help & FAQ</div>
      <div className="page-sub">Frequently asked questions</div>
      {FAQ.map(([q, a]) => (
        <div className="card" style={{ marginBottom: 12 }} key={q}>
          <div style={{ padding: "14px 20px", color: "var(--teal)", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="help" size={15} /> {q}
          </div>
          <div className="sep" style={{ margin: 0 }} />
          <div style={{ padding: "12px 20px", color: "var(--text2)", fontSize: 13, lineHeight: 1.6 }}>{a}</div>
        </div>
      ))}
      <div className="card" style={{ marginTop: 4 }}>
        <div style={{ padding: "16px 20px" }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Contact Developer</div>
          <div style={{ color: "var(--text2)", fontSize: 13 }}>harveybautista2019@gmail.com</div>
        </div>
      </div>
    </>
  );
}
