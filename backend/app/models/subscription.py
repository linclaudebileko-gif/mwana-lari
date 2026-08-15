from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from ..database import Base

class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(String(50), primary_key=True) # 'plan_free', 'plan_family_monthly', 'plan_family_annual', 'plan_school_annual'
    name = Column(String(100), nullable=False)
    tier = Column(String(50), nullable=False) # 'FREE', 'FAMILY', 'SCHOOL'
    billing_period = Column(String(20), default="MONTHLY") # 'LIFETIME', 'MONTHLY', 'ANNUAL'
    price_xaf = Column(Integer, default=0) # Price in FCFA
    price_eur = Column(Float, default=0.0) # Price in EUR
    max_children = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    description = Column(Text, nullable=True)
    features_json = Column(Text, nullable=True) # Comma-separated or JSON list of perks
    created_at = Column(DateTime, default=datetime.utcnow)

class UserSubscription(Base):
    __tablename__ = "user_subscriptions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    plan_id = Column(String(50), ForeignKey("subscription_plans.id"), nullable=False)
    status = Column(String(50), default="ACTIVE") # 'ACTIVE', 'EXPIRED', 'CANCELED'
    payment_method = Column(String(50), default="FREE") # 'MTN_MOMO', 'AIRTEL_MONEY', 'STRIPE_CARD', 'FREE'
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=True)
    transaction_reference = Column(String(100), nullable=True)
    auto_renew = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    plan = relationship("SubscriptionPlan")

class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    plan_id = Column(String(50), ForeignKey("subscription_plans.id"), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="XAF") # 'XAF', 'EUR', 'USD'
    provider = Column(String(50), nullable=False) # 'MTN_MOMO', 'AIRTEL_MONEY', 'STRIPE'
    phone_number = Column(String(50), nullable=True)
    status = Column(String(50), default="PENDING") # 'SUCCESS', 'PENDING', 'FAILED'
    transaction_ref = Column(String(100), unique=True, nullable=False)
    provider_transaction_id = Column(String(100), nullable=True)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
