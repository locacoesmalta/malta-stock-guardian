import { useState } from "react";

interface ConfirmOptions {
  title: string;
  description: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export const useConfirm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  const confirm = (opts: ConfirmOptions) => {
    setOptions(opts);
    setIsOpen(true);
  };

  const handleConfirm = async () => {
    if (options?.onConfirm) {
      await options.onConfirm();
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    if (options?.onCancel) {
      options.onCancel();
    }
    setIsOpen(false);
  };

  return {
    isOpen,
    confirm,
    handleConfirm,
    handleCancel,
    options,
  };
};
