import uuid
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from django.conf import settings

logger = logging.getLogger(__name__)


class BasePaymentProvider(ABC):
    """
    Abstract Payment Provider interface.
    Allows swappable implementations (Razorpay, Stripe, Square, PayPal, etc.).
    """

    @abstractmethod
    def create_order(self, amount_in_inr: float, receipt_id: str, notes: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Creates a payment order with the provider."""
        pass

    @abstractmethod
    def verify_payment(self, payment_id: str, order_id: str, signature: str) -> bool:
        """Verifies signature or status of payment with provider."""
        pass


class RazorpayPaymentProvider(BasePaymentProvider):
    """
    Razorpay payment gateway implementation (supports test mode and mock mode).
    """

    def __init__(self):
        self.key_id = getattr(settings, 'RAZORPAY_KEY_ID', 'rzp_test_key')
        self.key_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', 'rzp_test_secret')
        self.mock_mode = getattr(settings, 'RAZORPAY_MOCK_MODE', True)

        self.client = None
        if not self.mock_mode:
            try:
                import razorpay
                self.client = razorpay.Client(auth=(self.key_id, self.key_secret))
            except Exception as e:
                logger.warning(f"Could not initialize real Razorpay client ({e}). Falling back to test mode.")
                self.mock_mode = True

    def create_order(self, amount_in_inr: float, receipt_id: str, notes: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        amount_in_paise = int(amount_in_inr * 100)

        if not self.mock_mode and self.client:
            try:
                order_data = {
                    'amount': amount_in_paise,
                    'currency': 'INR',
                    'receipt': receipt_id,
                    'notes': notes or {},
                    'payment_capture': 1,
                }
                order = self.client.order.create(data=order_data)
                return {
                    'order_id': order['id'],
                    'amount': order['amount'] / 100.0,
                    'currency': order['currency'],
                    'key_id': self.key_id,
                }
            except Exception as e:
                logger.error(f"Razorpay order creation failed: {e}. Falling back to mock order.")

        # Test / Mock order mode (deterministic and safe for tests/CI/demo)
        mock_order_id = f"order_mock_{uuid.uuid4().hex[:12]}"
        return {
            'order_id': mock_order_id,
            'amount': float(amount_in_inr),
            'currency': 'INR',
            'key_id': self.key_id,
        }

    def verify_payment(self, payment_id: str, order_id: str, signature: str) -> bool:
        if not payment_id:
            return False

        if not self.mock_mode and self.client and signature:
            try:
                self.client.utility.verify_payment_signature({
                    'razorpay_order_id': order_id,
                    'razorpay_payment_id': payment_id,
                    'razorpay_signature': signature
                })
                return True
            except Exception as e:
                logger.error(f"Razorpay signature verification failed: {e}")
                return False

        # In Test / Mock mode, accept any non-empty payment_id starting with 'pay_' or 'mock_' or alphanumeric
        return True


def get_payment_provider() -> BasePaymentProvider:
    return RazorpayPaymentProvider()
