/**
 * AlertDialog - Animate-ui style Alert Dialog
 * Uses Headless UI Dialog + Framer Motion for animations.
 * Usage matches animate-ui API:
 *
 * <AlertDialog>
 *   <AlertDialogTrigger render={<Button>Open</Button>} />
 *   <AlertDialogPopup from="bottom">
 *     <AlertDialogHeader>
 *       <AlertDialogTitle>Title</AlertDialogTitle>
 *       <AlertDialogDescription>Description</AlertDialogDescription>
 *     </AlertDialogHeader>
 *     <AlertDialogFooter>
 *       <AlertDialogCancel>Cancel</AlertDialogCancel>
 *       <AlertDialogAction>Continue</AlertDialogAction>
 *     </AlertDialogFooter>
 *   </AlertDialogPopup>
 * </AlertDialog>
 */
import * as React from "react";
import { createContext, useContext } from "react";
import { Dialog, DialogPanel, DialogTitle, Description } from "@headlessui/react";
import { motion } from "framer-motion";

const AlertDialogContext = createContext(null);

function useAlertDialog() {
  const ctx = useContext(AlertDialogContext);
  if (!ctx) throw new Error("AlertDialog components must be used inside AlertDialog");
  return ctx;
}

export function AlertDialog({ children, ...props }) {
  const isControlled = typeof props.open === "boolean";
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = isControlled ? props.open : uncontrolledOpen;
  const setOpen = isControlled ? props.onClose : setUncontrolledOpen;
  return (
    <AlertDialogContext.Provider value={{ open, setOpen }}>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        className="relative z-[20000]"
        {...props}
      >
        {children}
      </Dialog>
    </AlertDialogContext.Provider>
  );
}

export function AlertDialogTrigger({ children, render }) {
  const { setOpen } = useAlertDialog();
  const trigger = render ? (
    React.cloneElement(render, { onClick: () => setOpen(true) })
  ) : (
    <button type="button" onClick={() => setOpen(true)} className="cursor-pointer">
      {children}
    </button>
  );
  return trigger;
}

const FROM_VARIANTS = {
  top: { initial: { y: -20, opacity: 0 }, animate: { y: 0, opacity: 1 } },
  bottom: { initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 } },
  left: { initial: { x: -20, opacity: 0 }, animate: { x: 0, opacity: 1 } },
  right: { initial: { x: 20, opacity: 0 }, animate: { x: 0, opacity: 1 } },
};

export function AlertDialogPopup({ children, from = "bottom", className = "", ...props }) {
  const variant = FROM_VARIANTS[from] || FROM_VARIANTS.bottom;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="fixed inset-0 z-[20000] bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-[20000] flex min-h-full items-center justify-center p-4">
        <DialogPanel
          as={motion.div}
          initial={variant.initial}
          animate={variant.animate}
          transition={{ type: "spring", stiffness: 150, damping: 25 }}
          className={`w-full max-w-lg rounded-xl bg-white p-6 shadow-xl ${className}`.trim()}
          {...props}
        >
          {children}
        </DialogPanel>
      </div>
    </>
  );
}

export function AlertDialogHeader({ className = "", ...props }) {
  return <div className={`flex flex-col space-y-2 text-center sm:text-left ${className}`.trim()} {...props} />;
}

export function AlertDialogTitle({ className = "", ...props }) {
  return (
    <DialogTitle className={`text-lg font-semibold leading-none text-gray-900 ${className}`.trim()} {...props} />
  );
}

export function AlertDialogDescription({ className = "", ...props }) {
  return (
    <Description className={`text-sm text-gray-500 ${className}`.trim()} {...props} />
  );
}

export function AlertDialogFooter({ className = "", ...props }) {
  return (
    <div
      className={`mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2 ${className}`.trim()}
      {...props}
    />
  );
}

export function AlertDialogCancel({ children, className = "", ...props }) {
  const { setOpen } = useAlertDialog();
  return (
    <button
      type="button"
      onClick={() => setOpen(false)}
      className={`inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#d85a30]/20 ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

export function AlertDialogAction({ children, className = "", onClick, ...props }) {
  const { setOpen } = useAlertDialog();
  const handleClick = (e) => {
    onClick?.(e);
    setOpen(false);
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex justify-center rounded-lg bg-[#d85a30] px-4 py-2 text-sm font-medium text-white hover:bg-[#c54d28] focus:outline-none focus:ring-2 focus:ring-[#d85a30]/50 ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
