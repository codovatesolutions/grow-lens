"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ScoreGauge from "@/components/ScoreGauge";
import { FileText, ArrowLeft, ExternalLink, ShieldAlert, CheckCircle2, Award } from "lucide-react";

export default function PublicScanReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPublicReport() {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
        const endpoint = `${backendUrl}/api/public/scans/${id}`;
        const { data } = await axios.get(endpoint);
        setReport(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Public report not found or is unavailable.");
      } finally {
        setLoading(false);
      }
    }
    loadPublicReport();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <Card className="p-8 text-center max-w-md space-y-4">
          <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
          <h1 className="font-display font-bold text-xl">Public Report Unavailable</h1>
          <p className="text-sm text-muted-foreground">{error || "This public audit report does not exist or has been removed."}</p>
          <Button asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const subscores = report.subscores || {};

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold">
            <img src="/logolensgrowth.jpeg" alt="Logo" className="w-6 h-6 rounded border border-border" />
            <span>GrowthLens AI<span className="text-primary">.</span></span>
          </Link>
          <Badge variant="outline" className="font-mono text-xs uppercase px-3 py-1">
            Public Audit Report
          </Badge>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Banner Card */}
        <Card className="p-6 md:p-8 bg-gradient-to-br from-primary/5 via-card to-card border-primary/20 space-y-6">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                <span>SCANNED URL</span>
                <span>&bull;</span>
                <span>{new Date(report.created_at).toLocaleDateString()}</span>
              </div>
              <h1 className="font-display text-2xl md:text-3xl font-black flex items-center gap-2">
                {report.target}
                <a href={report.target.startsWith('http') ? report.target : `https://${report.target}`} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                  <ExternalLink className="w-5 h-5" />
                </a>
              </h1>
              <p className="text-sm text-muted-foreground max-w-xl">{report.summary}</p>
            </div>

            <div className="flex items-center gap-4 border-l border-border pl-6">
              <ScoreGauge score={report.score || 0} size={90} />
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Overall Score</div>
                <div className="font-display text-2xl font-black">{report.score || 0}/100</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Subscores Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(subscores).map(([k, v]: [string, any]) => (
            <Card key={k} className="p-4 text-center space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{k}</div>
              <div className="font-display text-xl font-bold text-primary">{typeof v === 'object' ? (v.mine ?? 0) : v}/100</div>
            </Card>
          ))}
        </div>

        {/* Strengths & Key Fixes */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Strengths */}
          <Card className="p-6 space-y-4">
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Key Strengths Detected
            </h2>
            <ul className="space-y-2">
              {(report.strengths || []).map((s: string, idx: number) => (
                <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">&bull;</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Top Fixes */}
          <Card className="p-6 space-y-4">
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" /> High-Priority Fixes
            </h2>
            <ul className="space-y-3">
              {(report.top_fixes || []).map((f: any, idx: number) => (
                <li key={idx} className="space-y-1 border-b border-border/50 pb-2 last:border-0">
                  <div className="text-xs font-semibold text-foreground">{f.title}</div>
                  <div className="text-[11px] text-muted-foreground">{f.why}</div>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Audit Disclaimer */}
        <Card className="p-4 bg-muted/30 text-center text-xs text-muted-foreground">
          {report.disclaimer || "This public report is an AI growth audit generated by GrowthLens AI."}
        </Card>
      </main>
    </div>
  );
}
