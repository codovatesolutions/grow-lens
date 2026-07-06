import { Button } from "../components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const plans = [
  { name: "Free", price: "$0", desc: "Get a feel for GrowthLens.", features: ["3 scans / month", "Plain-English reports", "Basic export"], cta: "Current plan", disabled: true },
  { name: "Pro", price: "$29", desc: "For owners and creators.", features: ["100 scans / month", "Outreach drafts + lead extraction", "Content calendars", "Unlimited exports"], cta: "Upgrade", highlight: true },
  { name: "Team", price: "$99", desc: "Agencies & analysts.", features: ["Unlimited scans", "Multi-seat workspace", "Shared lead lists", "Priority AI throughput"], cta: "Contact sales" },
];

export default function Billing() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Billing</div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mt-1">Plans & usage</h1>
        <p className="text-muted-foreground mt-2">Pay per scan or upgrade for unlimited growth lensing.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {plans.map(p => (
          <div key={p.name} className={`border rounded p-6 bg-card ${p.highlight ? "border-primary" : "border-border"}`} data-testid={`plan-${p.name.toLowerCase()}`}>
            <div className="flex items-baseline gap-2">
              <h3 className="font-display text-xl font-bold">{p.name}</h3>
              {p.highlight && <span className="text-[10px] uppercase tracking-widest text-primary">Popular</span>}
            </div>
            <div className="mt-3"><span className="font-display text-4xl font-black">{p.price}</span><span className="text-muted-foreground text-sm"> / mo</span></div>
            <p className="text-sm text-muted-foreground mt-2">{p.desc}</p>
            <ul className="mt-5 space-y-2 text-sm">
              {p.features.map(f => <li key={f} className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0"/>{f}</li>)}
            </ul>
            <Button
              className="w-full mt-6"
              variant={p.highlight ? "default" : "outline"}
              disabled={p.disabled}
              onClick={() => toast.info("Stripe billing is coming soon. Reach out to upgrade early.")}
              data-testid={`plan-${p.name.toLowerCase()}-cta`}
            >{p.cta}</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
