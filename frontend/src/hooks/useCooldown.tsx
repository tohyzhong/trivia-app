import { useEffect, useState } from "react";

const getCooldownRemaining = (key: string, cooldownMs: number): number => {
  const lastTime = localStorage.getItem(key);
  if (!lastTime) return 0;
  const elapsed = Date.now() - parseInt(lastTime, 10);
  return Math.max(cooldownMs - elapsed, 0);
};

export const useCooldown = (key: string, cooldownMs: number = 60000) => {
  const [remaining, setRemaining] = useState(
    getCooldownRemaining(key, cooldownMs)
  );

  useEffect(() => {
    if (remaining <= 0) return;

    const interval = setInterval(() => {
      const newRemaining = getCooldownRemaining(key, cooldownMs);
      setRemaining(newRemaining);
      if (newRemaining <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [remaining, key, cooldownMs]);

  const triggerCooldown = () => {
    localStorage.setItem(key, Date.now().toString());
    setRemaining(cooldownMs);
  };

  return { remaining, triggerCooldown };
};
