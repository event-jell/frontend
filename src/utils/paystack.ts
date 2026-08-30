// Paystack inline payment integration helper

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: {
        key: string;
        email: string;
        amount: number; // in lowest currency subunit (kobo / cents)
        currency?: string;
        ref?: string;
        metadata?: Record<string, any>;
        callback?: (response: {
          reference: string;
          status: string;
          trans?: string;
          transaction?: string;
          message?: string;
        }) => void;
        onClose?: () => void;
      }) => {
        openIframe: () => void;
      };
    };
  }
}

export interface PaystackPaymentOptions {
  email: string;
  amount: number; // In main currency unit (e.g. 5000 for 5000 NGN or 25 for 25 USD)
  currency?: string;
  reference?: string;
  customerName?: string;
  metadata?: Record<string, any>;
  onSuccess: (response: { reference: string; status: string; transaction?: string }) => void;
  onClose?: () => void;
  onError?: (err: Error) => void;
}

let scriptLoadingPromise: Promise<boolean> | null = null;

export function loadPaystackScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.PaystackPop) return Promise.resolve(true);
  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise((resolve) => {
    const existing = document.getElementById('paystack-inline-js');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.id = 'paystack-inline-js';
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Paystack inline JS SDK');
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return scriptLoadingPromise;
}

export async function openPaystackModal(options: PaystackPaymentOptions): Promise<void> {
  const loaded = await loadPaystackScript();
  if (!loaded || !window.PaystackPop) {
    const err = new Error('Could not load Paystack checkout modal. Please check your internet connection.');
    if (options.onError) options.onError(err);
    else alert(err.message);
    return;
  }

  const publicKey =
    import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_60471f063a55f93e8f94f999bb3fd13f82c938b3';
  const currency = (options.currency || 'NGN').toUpperCase();
  const amountInKobo = Math.round(options.amount * 100);
  const reference = options.reference || `ej_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const handler = window.PaystackPop.setup({
    key: publicKey,
    email: options.email,
    amount: amountInKobo,
    currency,
    ref: reference,
    metadata: {
      custom_fields: options.customerName
        ? [{ display_name: 'Customer Name', variable_name: 'customer_name', value: options.customerName }]
        : [],
      ...(options.metadata || {}),
    },
    callback: (res) => {
      options.onSuccess({
        reference: res.reference || reference,
        status: res.status || 'success',
        transaction: res.transaction || res.trans,
      });
    },
    onClose: () => {
      if (options.onClose) options.onClose();
    },
  });

  handler.openIframe();
}
