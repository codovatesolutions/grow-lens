"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Shell from "@/components/Shell";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { FileText, ExternalLink, Share2, Download, Award, ShieldAlert, BarChart3, Plus } from "lucide-react";

export default function ReportsPage() {
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        const { data } = await api.get("/scans");
        setScans(data || []);
      } catch (err: any) {
        toast.error("Failed to load audit reports");
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const copyShareLink = (scanId: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const publicUrl = `${origin}/results/${scanId}`;
    navigator.clipboard.writeText(publicUrl);
    toast.success("Public report link copied to clipboard!");
  };

  const avgScore = scans.length > 0 ? Math.round(scans.reduce((acc, s) => acc + (s.score || 0), 0) / scans.length) : 0;

  return (
    <Shell>
      <div className="space-y-6" data-testid="reports-page">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" /> Executive Audit Reports
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Shareable site audit reports, score distributions, and executive summaries.
            </p>
          </div>
          <Button asChild className="flex items-center gap-2">
            <Link href="/scan/new">
              <Plus className="w-4 h-4" /> Create New Scan
            </Link>
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 space-y-1">
            <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Scans</div>
            <div className="font-display text-2xl font-black">{scans.length}</div>
          </Card>
          <Card className="p-4 space-y-1">
            <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Average Score</div>
            <div className="font-display text-2xl font-black text-primary">{avgScore}/100</div>
          </Card>
          <Card className="p-4 space-y-1">
            <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Business Audits</div>
            <div className="font-display text-2xl font-black">{scans.filter((s) => s.mode === "business").length}</div>
          </Card>
          <Card className="p-4 space-y-1">
            <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Creator Scans</div>
            <div className="font-display text-2xl font-black">{scans.filter((s) => s.mode === "creator").length}</div>
          </Card>
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : scans.length === 0 ? (
          <Card className="p-10 text-center space-y-3">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto" />
            <h3 className="font-display font-bold text-lg">No audit reports generated</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Run your first website audit scan to generate downloadable and shareable executive reports.
            </p>
            <Button asChild className="mt-2">
              <Link href="/scan/new">Run Audit Scan</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {scans.map((scan) => {
              const res = scan.result || {};
              const fixCount = (res.top_fixes || []).length;
              const vulnCount = (res.security_vulnerabilities || []).length;
              return (
                <Card key={scan.id} className="p-5 flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="uppercase font-mono text-[10px]">
                        {scan.mode}
                      </Badge>
                      <Badge
                        className={`text-xs ${
                          scan.status === "complete"
                            ? "bg-emerald-500 text-white"
                            : scan.status === "processing"
                            ? "bg-amber-500 text-white"
                            : "bg-red-500 text-white"
                        }`}
                      >
                        {scan.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{new Date(scan.created_at).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-display font-bold text-lg">{scan.target}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>Overall Score: <strong className="text-foreground">{scan.score || 0}/100</strong></span>
                      {fixCount > 0 && <span>&bull; {fixCount} Top Fixes</span>}
                      {vulnCount > 0 && <span>&bull; <span className="text-red-500 font-semibold">{vulnCount} Vulnerability Risks</span></span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start md:self-auto">
                    <Button variant="outline" size="sm" onClick={() => copyShareLink(scan.id)} className="flex items-center gap-1.5 text-xs">
                      <Share2 className="w-3.5 h-3.5" /> Share Report
                    </Button>
                    <Button size="sm" asChild>
                      <Link href={`/results/${scan.id}`} className="flex items-center gap-1.5 text-xs">
                        View Report &rarr;
                      </Link>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Shell>
  );
}
