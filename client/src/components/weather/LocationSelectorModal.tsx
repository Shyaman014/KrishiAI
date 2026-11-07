import { useState } from 'react'
import { Search, MapPin, Navigation, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/button'
import apiClient from '@/lib/api'
import { ICityOption } from '@/hooks/useWeather'

interface LocationSelectorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectCity: (city: ICityOption) => void
  onRequestGps: () => void
  gpsStatus: string
  currentCityName?: string
}

export function LocationSelectorModal({
  open,
  onOpenChange,
  onSelectCity,
  onRequestGps,
  gpsStatus,
  currentCityName,
}: LocationSelectorModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<ICityOption[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const popularAgriculturalDistricts: ICityOption[] = [
    { name: 'Ludhiana', state: 'Punjab', country: 'IN', lat: 30.901, lon: 75.8573 },
    { name: 'Karnal', state: 'Haryana', country: 'IN', lat: 29.6857, lon: 76.9905 },
    { name: 'Guwahati', state: 'Assam', country: 'IN', lat: 26.1445, lon: 91.7362 },
    { name: 'Jorhat', state: 'Assam', country: 'IN', lat: 26.7509, lon: 94.2037 },
    { name: 'Pune', state: 'Maharashtra', country: 'IN', lat: 18.5204, lon: 73.8567 },
    { name: 'Nashik', state: 'Maharashtra', country: 'IN', lat: 19.9975, lon: 73.7898 },
    { name: 'Guntur', state: 'Andhra Pradesh', country: 'IN', lat: 16.3067, lon: 80.4365 },
    { name: 'Coimbatore', state: 'Tamil Nadu', country: 'IN', lat: 11.0168, lon: 76.9558 },
    { name: 'Indore', state: 'Madhya Pradesh', country: 'IN', lat: 22.7196, lon: 75.8577 },
    { name: 'Jaipur', state: 'Rajasthan', country: 'IN', lat: 26.9124, lon: 75.7873 },
  ]

  const handleSearch = async (val: string) => {
    setSearchTerm(val)
    if (val.trim().length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const res = await apiClient.get(`/api/weather/cities?q=${encodeURIComponent(val.trim())}`)
      setSearchResults(res.data?.data?.cities || [])
    } catch {
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelect = (city: ICityOption) => {
    onSelectCity(city)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Select Farm Location
          </DialogTitle>
          <DialogDescription>
            Choose your district or acquire exact GPS coordinates for hyper-local micro-climate forecasts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* GPS Quick Action */}
          <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Navigation className="h-4 w-4 text-primary" />
                Device GPS Geolocation
              </span>
              <p className="text-[11px] text-muted-foreground">
                Pinpoint real-time micro-climate at your plot
              </p>
            </div>
            <Button
              size="sm"
              isLoading={gpsStatus === 'requesting'}
              onClick={() => {
                onRequestGps()
                onOpenChange(false)
              }}
            >
              Use GPS
            </Button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search district or city (e.g. Ludhiana, Jorhat, Pune)..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
            )}
          </div>

          {/* Results or Popular Districts */}
          <div className="space-y-1 max-h-60 overflow-y-auto">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block px-2 pb-1">
              {searchResults.length > 0 ? 'Search Results' : 'Major Agricultural Regions'}
            </span>

            {(searchResults.length > 0 ? searchResults : popularAgriculturalDistricts).map(
              (city, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(city)}
                  className={`w-full p-2.5 rounded-xl text-left text-xs flex items-center justify-between transition-colors hover:bg-muted/50 ${
                    currentCityName && currentCityName.includes(city.name)
                      ? 'bg-primary/10 font-bold text-primary'
                      : 'text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>
                      {city.name}
                      {city.state ? `, ${city.state}` : ''}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{city.country}</span>
                </button>
              ),
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

