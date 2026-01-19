import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";

export default function GenericModal(props) {
  function close() {
    props.setOpen(false);
  }

  return (
    <Dialog
      open={props.open}
      as="div"
      className="relative z-[10000] focus:outline-none"
      onClose={close} // Fixed the incorrect prop
    >
      <div className="fixed inset-0 z-[9999] w-screen overflow-y-auto bg-black/50 backdrop-blur-sm">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel className={`w-[80vw] rounded-xl bg-white p-6 shadow-lg z-[10001]`}>
            <DialogTitle
              as="h3"
              className="text-lg font-semibold text-gray-900"
            >
              {props.title}
            </DialogTitle>

            <div className="mt-2">{props.children}</div>

            {/* <div className="mt-4 flex justify-end">
              <button
                className="inline-flex items-center gap-2 rounded-md bg-gray-700 py-1.5 px-3 text-sm font-semibold text-white shadow-inner focus:outline-none hover:bg-gray-600"
                onClick={close}
              >
                Close
              </button>
            </div> */}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
