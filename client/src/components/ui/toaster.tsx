"use client";

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast
          key={id}
          {...props}
          className="bg-white border border-gray-200 shadow-lg rounded-md p-4 flex items-center justify-between"
        >
          <div className="flex flex-col gap-1">
            {title && (
              <ToastTitle className="text-gray-900 font-semibold">
                {title}
              </ToastTitle>
            )}
            {description && (
              <ToastDescription className="text-gray-700 text-sm">
                {description}
              </ToastDescription>
            )}
          </div>
          {action}
          <ToastClose className="text-gray-500 hover:text-gray-800" />
        </Toast>
      ))}

      <ToastViewport className="fixed top-5 right-5 flex flex-col gap-3 p-2 z-50" />
    </ToastProvider>
  );
}
