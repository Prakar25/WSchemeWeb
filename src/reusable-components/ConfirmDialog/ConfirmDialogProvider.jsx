/* eslint-disable react/prop-types */
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogPopup,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../AlertDialog";

const ConfirmDialogContext = createContext(null);

export function useConfirm() {
  const ctx = useContext(ConfirmDialogContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmDialogProvider");
  return ctx.confirm;
}

/**
 * confirm({ title, description, confirmText, cancelText, tone })
 * Returns Promise<boolean>.
 */
export default function ConfirmDialogProvider({ children }) {
  const [open, setOpen] = useState(false);
  const resolverRef = useRef(null);
  const pendingRef = useRef(false);

  const [options, setOptions] = useState({
    title: "Please confirm",
    description: "Are you sure you want to continue?",
    confirmText: "Yes, continue",
    cancelText: "Cancel",
    tone: "danger", // danger | neutral
  });

  const cleanup = useCallback(() => {
    setOpen(false);
    pendingRef.current = false;
    resolverRef.current = null;
  }, []);

  const resolve = useCallback(
    (value) => {
      const resolver = resolverRef.current;
      cleanup();
      resolver?.(value);
    },
    [cleanup]
  );

  const confirm = useCallback((next = {}) => {
    if (pendingRef.current) return Promise.resolve(false);
    pendingRef.current = true;
    setOptions((prev) => ({
      ...prev,
      ...next,
      confirmText: next.confirmText ?? prev.confirmText,
      cancelText: next.cancelText ?? prev.cancelText,
      tone: next.tone ?? prev.tone,
    }));
    setOpen(true);
    return new Promise((res) => {
      resolverRef.current = res;
    });
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  const actionClasses =
    options.tone === "neutral"
      ? "bg-[#68d388] hover:bg-[#58c378] focus:ring-[#68d388]/50"
      : "bg-[#d85a30] hover:bg-[#c54d28] focus:ring-[#d85a30]/50";

  return (
    <ConfirmDialogContext.Provider value={value}>
      {children}
      <AlertDialog open={open} onClose={() => resolve(false)}>
        <AlertDialogPopup from="bottom" className="sm:max-w-[480px]">
          <AlertDialogHeader>
            <AlertDialogTitle>{options.title}</AlertDialogTitle>
            {options.description ? (
              <AlertDialogDescription>{options.description}</AlertDialogDescription>
            ) : null}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => resolve(false)}>{options.cancelText}</AlertDialogCancel>
            <AlertDialogAction className={actionClasses} onClick={() => resolve(true)}>
              {options.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </ConfirmDialogContext.Provider>
  );
}

