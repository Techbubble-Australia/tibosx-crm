export type AppAlertOptions = {
  title?: string;
  message: string;
};

export type AppConfirmOptions = AppAlertOptions & {
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type Handlers = {
  alert: (options: AppAlertOptions) => void;
  confirm: (options: AppConfirmOptions) => Promise<boolean>;
};

let handlers: Handlers | null = null;

export function registerAppAlertHandlers(next: Handlers | null) {
  handlers = next;
}

export function appAlert(message: string, title?: string) {
  if (handlers) {
    handlers.alert({ message, title });
    return;
  }
  window.alert(title ? `${title}\n\n${message}` : message);
}

export async function appConfirm(message: string, options?: Omit<AppConfirmOptions, "message">): Promise<boolean> {
  if (handlers) {
    return handlers.confirm({ message, ...options });
  }
  return window.confirm(message);
}
