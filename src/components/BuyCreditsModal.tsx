import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Coins, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

// Declare Razorpay for TypeScript
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
  description: string;
  popular?: boolean;
}

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  currentCredits?: number;
}

export const BuyCreditsModal: React.FC<BuyCreditsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentCredits = 0
}) => {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      fetchPackages();
      loadRazorpayScript();
    }
  }, [isOpen]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const fetchPackages = async () => {
    try {
      const data: any = await api.getCreditsPackages();
      setPackages(data.packages);
    } catch (err) {
      setError('Failed to load credit packages');
      console.error(err);
    }
  };

  const handlePurchase = async (packageId: string) => {
    setLoading(true);
    setError(null);
    setSelectedPackage(packageId);

    try {
      // Ensure Razorpay script is loaded
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error('Payment gateway not loaded. Please refresh and try again.');
      }

      // Step 1: Create order
      const orderData: any = await api.createPaymentOrder(packageId);

      // Step 2: Open Razorpay Checkout
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'MedMate',
        description: orderData.package_name,
        order_id: orderData.order_id,
        prefill: {
          email: orderData.customer_email || user?.email || '',
          name: orderData.customer_name || user?.username || '',
          contact: ''
        },
        handler: async function(response: any) {
          try {
            // Step 3: Verify payment
            const verifyData: any = await api.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verifyData.success) {
              toast({
                title: '🎉 Payment Successful!',
                description: `${verifyData.credits_added} credits added to your account.`,
              });
              if (onSuccess) onSuccess();
              onClose();
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (err: any) {
            setError(err.message || 'Payment verification failed');
            toast({
              title: 'Payment Error',
              description: err.message || 'Payment verification failed',
              variant: 'destructive',
            });
          } finally {
            setLoading(false);
            setSelectedPackage(null);
          }
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            setSelectedPackage(null);
          },
          escape: true,
          animation: true,
          confirm_close: true,
          backdropclose: true
        },
        theme: {
          color: '#10b981', // MedMate green color
          backdrop_color: 'rgba(0, 0, 0, 0.6)'
        },
        config: {
          display: {
            blocks: {
              banks: {
                name: 'Pay using UPI or Cards',
                instruments: [
                  {
                    method: 'upi'
                  },
                  {
                    method: 'card'
                  },
                  {
                    method: 'netbanking'
                  }
                ]
              }
            },
            preferences: {
              show_default_blocks: true
            }
          }
        },
        timeout: 300,
        remember_customer: false
      };

      const razorpay = new window.Razorpay(options);
      
      // Close the dialog before opening Razorpay to prevent conflicts
      onClose();
      
      // Small delay to ensure dialog is closed before opening Razorpay
      setTimeout(() => {
        razorpay.open();
      }, 100);

    } catch (err: any) {
      setError(err.message || 'Failed to initiate payment');
      toast({
        title: 'Error',
        description: err.message || 'Failed to initiate payment',
        variant: 'destructive',
      });
      setLoading(false);
      setSelectedPackage(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <Coins className="h-5 w-5 text-emerald-600" />
            Buy Credits
          </DialogTitle>
          <DialogDescription>
            Current Balance: <span className="font-semibold text-foreground">{currentCredits} Credits</span>
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}
        
        <div className="space-y-3 py-4">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`p-4 rounded-lg border ${
                pkg.popular 
                  ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20' 
                  : 'border-gray-300 dark:border-gray-600 bg-transparent'
              }`}
            >
              {pkg.popular && (
                <div className="mb-2">
                  <span className="inline-block px-2 py-0.5 bg-emerald-600 text-white text-xs font-semibold rounded">
                    Popular
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg text-foreground">{pkg.name}</h3>
                  <p className="text-sm font-medium text-foreground">{pkg.credits} credits</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground">₹{pkg.price}</div>
                </div>
              </div>
              <Button 
                onClick={() => handlePurchase(pkg.id)}
                disabled={loading && selectedPackage === pkg.id}
                className="w-full"
                variant={pkg.popular ? "default" : "outline"}
              >
                {loading && selectedPackage === pkg.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Purchase'
                )}
              </Button>
            </div>
          ))}
        </div>
        
        <div className="text-center text-xs text-muted-foreground pt-2 border-t">
          🔒 Secure payment powered by Razorpay
        </div>
      </DialogContent>
    </Dialog>
  );
};
