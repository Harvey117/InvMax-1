export const calcEOQ = (D, S, H) => {
  if (!D || !S || !H || D <= 0 || S <= 0 || H <= 0) return 0;
  return Math.sqrt((2 * D * S) / H);
};

export const fmtPeso = v =>
  `₱${Number(v).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const getLowStockThreshold = demand => Math.max(Math.ceil((demand || 0) / 26), 5);

export const getCostPrice = product => Number(product?.cost_price ?? product?.price ?? 0);

export const getSellingPrice = product => Number(product?.selling_price ?? product?.price ?? 0);

export const getProfitPerUnit = product => Math.max(0, getSellingPrice(product) - getCostPrice(product));

export const getProfitDensity = product => {
  const cost = getCostPrice(product);
  if (cost <= 0) return 0;
  return getProfitPerUnit(product) / cost;
};

export const getStockStatus = product => {
  const threshold = getLowStockThreshold(product.demand);
  if (product.stock <= threshold * 0.5) return { label: "Critical", color: "#ef4444" };
  if (product.stock <= threshold) return { label: "Low", color: "#f59e0b" };
  return { label: "OK", color: "#10b981" };
};

export const validatePassword = password => {
  const errors = [];
  if (password.length < 8) errors.push("8+ characters");
  if (!/[A-Z]/.test(password)) errors.push("1 uppercase");
  if (!/[a-z]/.test(password)) errors.push("1 lowercase");
  if (!/[0-9]/.test(password)) errors.push("1 number");
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("1 special char");
  return errors;
};
