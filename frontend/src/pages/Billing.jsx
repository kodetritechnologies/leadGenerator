import React, { useEffect, useState } from 'react';
import { CreditCard, CheckCircle, Receipt, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function Billing() {
  const { user, refreshUser } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/billing/invoices');
      if (res.success) {
        setInvoices(res.data.invoices);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleCheckout = async (plan) => {
    if (!window.confirm(`Simulate Stripe checkout flow for the ${plan} plan?`)) return;
    setCheckoutLoading(true);
    try {
      const res = await api.post('/billing/checkout', { plan });
      if (res.success) {
        alert(res.message);
        refreshUser();
        fetchInvoices();
      }
    } catch (err) {
      alert(err.message || 'Payment simulation failed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const plans = [
    {
      name: 'starter',
      price: '$29',
      billing: 'per month',
      credits: '500 AI credits / mo',
      features: ['Automated Lead Scraper', '500 AI audits', 'AI Chat Assistant', 'Email Pitch writer', 'Shared CRM pipeline']
    },
    {
      name: 'professional',
      price: '$79',
      billing: 'per month',
      credits: '2,000 AI credits / mo',
      features: ['Everything in Starter', '2,000 AI audits', 'Gemini Pro Proposals writer', 'Real-time sync hooks', 'Priority API limits']
    },
    {
      name: 'enterprise',
      price: '$249',
      billing: 'per month',
      credits: '10,000 AI credits / mo',
      features: ['Everything in Pro', '10,000 AI audits', 'Custom email outreach webhooks', 'Dedicated database support', 'Teammates auto seats']
    }
  ];

  if (loading) {
    return <div className="space-y-4 animate-pulse"><div className="h-10 w-44 bg-muted rounded" /><div className="h-64 bg-muted rounded-xl border" /></div>;
  }

  return (
    <div className="space-y-8 text-xs">
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Subscriptions</h1>
        <p className="text-sm text-muted-foreground mt-1">Upgrade your credits, choose premium templates, and audit transaction invoices.</p>
      </div>

      {/* Current Subscription details */}
      <div className="p-5 border rounded-xl bg-card flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm capitalize">{user?.subscription?.plan} Subscription</span>
              <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${user?.subscription?.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                {user?.subscription?.status === 'active' ? 'Active' : 'Unsubscribed'}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {user?.subscription?.status === 'active' 
                ? `Subscription period ends on ${new Date(user?.subscription?.currentPeriodEnd).toLocaleDateString()}`
                : 'Upgrade subscription below to reload credits immediately.'
              }
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-[10px] text-muted-foreground uppercase font-bold">Credit Balance</p>
          <p className="text-xl font-bold text-foreground mt-0.5">{user?.aiCredits} credits</p>
        </div>
      </div>

      {/* Subscription Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => {
          const isActive = user?.subscription?.plan === p.name;
          return (
            <div 
              key={p.name}
              className={`p-6 border rounded-xl bg-card flex flex-col justify-between shadow-sm relative overflow-hidden ${isActive ? 'ring-1 ring-primary border-primary' : 'hover:border-primary/20'}`}
            >
              {isActive && (
                <span className="absolute top-0 right-0 bg-primary text-primary-foreground font-black tracking-wider text-[8px] px-3 py-1 rounded-bl uppercase">
                  ACTIVE
                </span>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-base capitalize text-foreground">{p.name}</h3>
                  <div className="flex items-baseline space-x-1.5 mt-2">
                    <span className="text-2xl font-black font-heading text-foreground">{p.price}</span>
                    <span className="text-muted-foreground text-[10px]">{p.billing}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded font-bold text-[9px] inline-block mt-2">{p.credits}</span>
                </div>

                <ul className="space-y-2 border-t pt-4 text-muted-foreground">
                  {p.features.map((f, idx) => (
                    <li key={idx} className="flex items-center space-x-2">
                      <CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                disabled={checkoutLoading || isActive}
                onClick={() => handleCheckout(p.name)}
                className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all shadow-sm mt-8 ${isActive ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/95'}`}
              >
                {isActive ? 'Current Plan' : `Upgrade to ${p.name}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Invoice list */}
      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-muted/10 flex items-center">
          <Receipt className="w-4 h-4 mr-2" />
          <h3 className="font-semibold text-sm">Invoice History</h3>
        </div>

        {invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b bg-muted/20 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y text-muted-foreground">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-foreground">{inv.invoiceNumber}</td>
                    <td className="py-3.5 px-4">{new Date(inv.paidAt).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-foreground font-bold">${inv.amount}.00</td>
                    <td className="py-3.5 px-4 uppercase">{inv.paymentMethod}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full font-bold flex items-center w-fit">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        <span>{inv.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground italic text-center py-6">No previous invoices found.</p>
        )}
      </div>

    </div>
  );
}
