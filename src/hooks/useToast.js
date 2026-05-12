import { useCallback, useState } from "react";

export default function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, kind = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);
  return { toasts, show };
}
