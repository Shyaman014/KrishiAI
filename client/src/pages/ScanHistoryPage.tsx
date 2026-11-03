import { useState } from 'react'
import {
  History,
  Search,
  Filter,
  Download,
  Eye,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog'
import { useToast } from '@/contexts/ToastContext'

interface HistoryItem {
  id: string
  date: string
  crop: string
  field: string
  disease: string
  confidence: number
  severity: 'healthy' | 'moderate' | 'high'
  status: 'Treated' | 'Monitoring' | 'Resolved'
  protocol: string
}

const historyRecords: HistoryItem[] = [
  {
    id: 'SC-8092',
    date: '03 Nov 2026, 10:45 AM',
    crop: 'Wheat (PBW 343)',
    field: 'North Plot #4',
    disease: 'Yellow Rust (Early Stage)',
    confidence: 94.8,
    severity: 'moderate',
    status: 'Monitoring',
    protocol: 'Propiconazole 25% EC @ 1ml/L foliar spray applied.',
  },
  {
    id: 'SC-8089',
    date: '02 Nov 2026, 04:20 PM',
    crop: 'Mustard (Pusa Bold)',
    field: 'East Plot #2',
    disease: 'Optimal / Healthy Foliage',
    confidence: 98.4,
    severity: 'healthy',
    status: 'Resolved',
    protocol: 'Routine check. No active pathogen identified.',
  },
  {
    id: 'SC-8084',
    date: '01 Nov 2026, 11:15 AM',
    crop: 'Potato (Kufri Jyoti)',
    field: 'South Plot #1',
    disease: 'Early Blight (Alternaria)',
    confidence: 91.2,
    severity: 'high',
    status: 'Treated',
    protocol: 'Mancozeb 75% WP @ 2.5g/L sprayed. Secondary evaluation scheduled.',
  },
  {
    id: 'SC-8078',
    date: '31 Oct 2026, 09:30 AM',
    crop: 'Chickpea (Desi)',
    field: 'West Basin',
    disease: 'Optimal / Healthy Foliage',
    confidence: 99.1,
    severity: 'healthy',
    status: 'Resolved',
    protocol: 'Canopy density verified normal.',
  },
  {
    id: 'SC-8071',
    date: '28 Oct 2026, 02:15 PM',
    crop: 'Wheat (PBW 343)',
    field: 'North Plot #2',
    disease: 'Aphid Colony (Initial Stage)',
    confidence: 88.5,
    severity: 'moderate',
    status: 'Treated',
    protocol: 'Thiamethoxam 25% WG @ 0.2g/L application completed.',
  },
]

export default function ScanHistoryPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState<'all' | 'healthy' | 'issues'>('all')
  const [selectedRecord, setSelectedRecord] = useState<HistoryItem | null>(null)

  const filtered = historyRecords.filter((rec) => {
    const matchesSearch =
      rec.crop.toLowerCase().includes(search.toLowerCase()) ||
      rec.field.toLowerCase().includes(search.toLowerCase()) ||
      rec.disease.toLowerCase().includes(search.toLowerCase()) ||
      rec.id.toLowerCase().includes(search.toLowerCase())

    if (!matchesSearch) return false

    if (severityFilter === 'healthy') return rec.severity === 'healthy'
    if (severityFilter === 'issues') return rec.severity !== 'healthy'
    return true
  })

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" size="sm">
              Permanent Field Diagnostic Log
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
            <History className="h-7 w-7 text-primary" />
            Scan History & Treatment Audit
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Archive of all AI diagnostic scans, confidence scores, and applied treatment plans
            across your cultivated acreage.
          </p>
        </div>

        <Button
          variant="outline"
          leftIcon={<Download className="h-4 w-4" />}
          onClick={() => toast.success('Exporting complete audit report as CSV...')}
        >
          Export CSV Log
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search by ID, crop, or disease..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <button
            onClick={() => setSeverityFilter('all')}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer ${
              severityFilter === 'all'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:bg-muted'
            }`}
          >
            All Scans ({historyRecords.length})
          </button>
          <button
            onClick={() => setSeverityFilter('issues')}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer ${
              severityFilter === 'issues'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:bg-muted'
            }`}
          >
            Pathologies Only
          </button>
          <button
            onClick={() => setSeverityFilter('healthy')}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer ${
              severityFilter === 'healthy'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:bg-muted'
            }`}
          >
            Healthy Foliage
          </button>
        </div>
      </div>

      {/* Scan Records Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Archived Field Diagnoses</CardTitle>
          <CardDescription>
            Showing {filtered.length} verified image diagnostic records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/80 text-muted-foreground uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 font-semibold">Scan ID</th>
                  <th className="py-3 px-3 font-semibold">Date & Time</th>
                  <th className="py-3 px-3 font-semibold">Crop & Plot</th>
                  <th className="py-3 px-3 font-semibold">Condition Diagnosed</th>
                  <th className="py-3 px-3 font-semibold text-center">Confidence</th>
                  <th className="py-3 px-3 font-semibold text-center">Severity</th>
                  <th className="py-3 px-3 font-semibold text-center">Action Status</th>
                  <th className="py-3 px-3 font-semibold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-3 font-mono font-semibold text-foreground">
                      {item.id}
                    </td>
                    <td className="py-3.5 px-3 text-muted-foreground">
                      {item.date}
                    </td>
                    <td className="py-3.5 px-3 font-medium text-foreground">
                      <span>{item.crop}</span>
                      <span className="text-[11px] text-muted-foreground block">{item.field}</span>
                    </td>
                    <td className="py-3.5 px-3 font-medium text-foreground">
                      {item.disease}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-primary">
                      {item.confidence}%
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <Badge
                        variant={
                          item.severity === 'healthy'
                            ? 'success'
                            : item.severity === 'moderate'
                            ? 'warning'
                            : 'destructive'
                        }
                        size="sm"
                        dot
                      >
                        {item.severity}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedRecord(item)}
                        leftIcon={<Eye className="h-3.5 w-3.5" />}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Record Details Dialog */}
      {selectedRecord && (
        <Dialog open={Boolean(selectedRecord)} onOpenChange={() => setSelectedRecord(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="default" size="sm">
                  {selectedRecord.id}
                </Badge>
                <span className="text-xs text-muted-foreground">{selectedRecord.date}</span>
              </div>
              <DialogTitle>{selectedRecord.crop} Inspection Record</DialogTitle>
              <DialogDescription>
                Plot Location: {selectedRecord.field}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="p-3.5 rounded-xl bg-muted/60 space-y-2 border border-border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Diagnosed Condition:</span>
                  <span className="font-bold text-foreground">{selectedRecord.disease}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Model Confidence:</span>
                  <span className="font-bold text-primary">{selectedRecord.confidence}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Remediation Status:</span>
                  <span className="font-bold">{selectedRecord.status}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-card border border-border space-y-1">
                <span className="font-semibold text-foreground block">
                  Logged Agronomic Protocol:
                </span>
                <p className="text-muted-foreground leading-relaxed">
                  {selectedRecord.protocol}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setSelectedRecord(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
