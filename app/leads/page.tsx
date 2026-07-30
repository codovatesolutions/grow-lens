"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Shell from "@/components/Shell";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Users, Search, Download, ExternalLink, Mail, Phone, Building2 } from "lucide-react";

interface LeadItem {
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  source: string;
  notes?: string;
  scanId: string;
  target: string;
  date: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadLeads() {
      try {
        const { data: scans } = await api.get("/scans");
        const allLeads: LeadItem[] = [];
        (scans || []).forEach((scan: any) => {
          const resultLeads = scan.result?.leads || [];
          resultLeads.forEach((l: any) => {
            allLeads.push({
              name: l.name || "Contact",
              role: l.role || "Owner / Executive",
              email: l.email,
              phone: l.phone,
              source: l.source || scan.target,
              notes: l.notes || "Discovered during website audit",
              scanId: scan.id,
              target: scan.target,
              date: new Date(scan.created_at).toLocaleDateString(),
            });
          });
        });
        setLeads(allLeads);
      } catch (err: any) {
        toast.error("Failed to load leads from scans");
      } finally {
        setLoading(false);
      }
    }
    loadLeads();
  }, []);

  const filtered = leads.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.email && l.email.toLowerCase().includes(search.toLowerCase())) ||
      l.target.toLowerCase().includes(search.toLowerCase()) ||
      (l.role && l.role.toLowerCase().includes(search.toLowerCase()))
  );

  const exportCSV = () => {
    if (leads.length === 0) {
      toast.error("No leads available to export");
      return;
    }
    const headers = ["Name", "Role", "Email", "Phone", "Target Website", "Discovered Date", "Notes"];
    const rows = leads.map((l) => [
      `"${l.name}"`,
      `"${l.role || ""}"`,
      `"${l.email || ""}"`,
      `"${l.phone || ""}"`,
      `"${l.target}"`,
      `"${l.date}"`,
      `"${l.notes || ""}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e: string[]) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `growthlens_leads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exported leads to CSV");
  };

  return (
    <Shell>
      <div className="space-y-6" data-testid="leads-page">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" /> Lead Intelligence
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Contact info and decision-makers extracted automatically from scanned sites.
            </p>
          </div>
          <Button onClick={exportCSV} variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <Input
            placeholder="Search leads by name, email, or website..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-10 text-center space-y-3">
            <Building2 className="w-10 h-10 text-muted-foreground mx-auto" />
            <h3 className="font-display font-bold text-lg">No leads found</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Run new website scans to automatically extract emails, phone numbers, and decision maker contacts.
            </p>
            <Button asChild className="mt-2">
              <Link href="/scan/new">Run New Scan</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filtered.map((l, i) => (
              <Card key={i} className="p-5 flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-base">{l.name}</span>
                    {l.role && <Badge variant="secondary" className="text-[11px]">{l.role}</Badge>}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-primary" /> {l.target}
                    </span>
                    {l.email && (
                      <span className="flex items-center gap-1 font-mono text-foreground">
                        <Mail className="w-3.5 h-3.5 text-primary" /> {l.email}
                      </span>
                    )}
                    {l.phone && (
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3.5 h-3.5 text-primary" /> {l.phone}
                      </span>
                    )}
                  </div>
                  {l.notes && <p className="text-xs text-muted-foreground italic mt-2">&ldquo;{l.notes}&rdquo;</p>}
                </div>
                <Button variant="ghost" size="sm" asChild className="self-start md:self-auto">
                  <Link href={`/results/${l.scanId}`} className="flex items-center gap-1 text-xs">
                    View Scan <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
