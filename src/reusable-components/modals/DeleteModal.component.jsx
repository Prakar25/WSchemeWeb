import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";

export default function Delete_Modal(props) {
  function close() {
    props.setOpen(false);
  }

  return (
    <Dialog
      open={props.open}
      as="div"
      className="relative z-30 focus:outline-none"
      onClose={close} // Fixed the incorrect prop
    >
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto bg-black/50 backdrop-blur-sm">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel
            className={`w-full ${
              props.isLarge ? "max-w-2xl" : "max-w-md"
            } rounded-xl bg-white p-6 shadow-lg`}
          >
            <DialogTitle
              as="h3"
              className="text-lg font-semibold text-gray-900"
            >
              {props?.title || "Delete"}
            </DialogTitle>

            <div className="mt-2">{props.message}</div>
            <div className="mt-2">{props.children}</div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="cursor-pointer w-full inline-flex justify-center border border-transparent shadow-sm px-2 py-1 md:px-4 md:py-2 bg-red-500 text-sm md:text-base font-medium text-white hover:bg-red-600 focus:outline-none focus:ring-0 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={props?.onDelete}
              >
                Delete
              </button>
              <button
                type="button"
                className="cursor-pointer mt-3 w-full inline-flex justify-center border border-gray-300 shadow-sm px-2 py-1 md:px-4 md:py-2 bg-white text-sm md:text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-0 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={() => props?.setOpen(false)}
              >
                Cancel
              </button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
