import { useState } from 'react';
import { RefreshCw, Smartphone, Monitor, Tablet, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

export default function AppPreview() {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);

  const getPreviewWidth = () => {
    switch (deviceMode) {
      case 'mobile':
        return 'max-w-[375px]';
      case 'tablet':
        return 'max-w-[768px]';
      case 'desktop':
      default:
        return 'w-full';
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Preview toolbar */}
      <div className="flex items-center justify-between px-3 h-8 border-b border-border/50 flex-shrink-0">
        {/* Device toggles */}
        <div className="flex items-center gap-1">
          <Button
            variant={deviceMode === 'desktop' ? 'secondary' : 'ghost'}
            size="icon"
            className="w-6 h-6 cursor-pointer"
            onClick={() => setDeviceMode('desktop')}
            title="Desktop view"
          >
            <Monitor className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant={deviceMode === 'tablet' ? 'secondary' : 'ghost'}
            size="icon"
            className="w-6 h-6 cursor-pointer"
            onClick={() => setDeviceMode('tablet')}
            title="Tablet view"
          >
            <Tablet className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant={deviceMode === 'mobile' ? 'secondary' : 'ghost'}
            size="icon"
            className="w-6 h-6 cursor-pointer"
            onClick={() => setDeviceMode('mobile')}
            title="Mobile view"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* URL bar */}
        <div className="flex-1 mx-3">
          <div className="flex items-center h-5 px-2.5 bg-secondary/40 rounded text-[10px] text-muted-foreground font-mono">
            <span className="text-green-500 mr-1.5">●</span>
            localhost:5173
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6 cursor-pointer"
            onClick={() => setRefreshKey((k) => k + 1)}
            title="Refresh preview"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6 cursor-pointer"
            title="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Preview content */}
      <div className="flex-1 overflow-hidden flex items-start justify-center p-4 bg-secondary/20">
        <div
          key={refreshKey}
          className={`${getPreviewWidth()} h-full bg-white rounded-lg shadow-lg overflow-hidden border border-border/50 transition-all duration-300`}
        >
          {/* Simulated app preview */}
          <div className="h-full overflow-auto">
            {/* App header */}
            <header className="flex items-center justify-between h-12 px-4 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-gray-900 flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">D</span>
                </div>
                <h1 className="text-sm font-semibold text-gray-900">Dashboard</h1>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-[10px] text-gray-600">🔔</span>
                </div>
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-[10px] text-gray-600">👤</span>
                </div>
              </div>
            </header>

            {/* Dashboard content */}
            <main className="p-4">
              {/* Metrics grid */}
              <div className={`grid gap-3 ${deviceMode === 'mobile' ? 'grid-cols-1' : deviceMode === 'tablet' ? 'grid-cols-2' : 'grid-cols-4'}`}>
                {[
                  { title: 'Total Revenue', value: '$45,231', change: '+20.1%', color: 'text-green-600' },
                  { title: 'Active Users', value: '2,350', change: '+12.5%', color: 'text-green-600' },
                  { title: 'Conversion Rate', value: '3.2%', change: '-2.4%', color: 'text-red-500' },
                  { title: 'Avg. Order Value', value: '$128', change: '+8.3%', color: 'text-green-600' },
                ].map((metric) => (
                  <div key={metric.title} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-gray-500 font-medium">{metric.title}</span>
                      <span className={`text-[9px] font-medium ${metric.color}`}>{metric.change}</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900">{metric.value}</div>
                    {/* Mini sparkline */}
                    <svg viewBox="0 0 100 24" className="w-full h-6 mt-2">
                      <polyline
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points="0,18 15,14 30,16 45,10 60,12 75,6 100,4"
                      />
                    </svg>
                  </div>
                ))}
              </div>

              {/* Chart area */}
              <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-gray-900">Revenue Overview</h3>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">7D</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-indigo-100 rounded text-indigo-700 font-medium">30D</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">90D</span>
                  </div>
                </div>
                {/* Chart placeholder */}
                <svg viewBox="0 0 400 120" className="w-full h-28">
                  <defs>
                    <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,90 C30,85 60,70 100,65 C140,60 170,75 200,55 C230,35 260,45 300,30 C340,15 370,20 400,10 L400,120 L0,120 Z"
                    fill="url(#chartGradient)"
                  />
                  <path
                    d="M0,90 C30,85 60,70 100,65 C140,60 170,75 200,55 C230,35 260,45 300,30 C340,15 370,20 400,10"
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Recent activity */}
              <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <h3 className="text-xs font-semibold text-gray-900 mb-3">Recent Activity</h3>
                <div className="space-y-2.5">
                  {[
                    { action: 'New order placed', user: 'John D.', time: '2 min ago', amount: '$234' },
                    { action: 'Payment received', user: 'Sarah K.', time: '5 min ago', amount: '$1,200' },
                    { action: 'Subscription renewed', user: 'Mike R.', time: '12 min ago', amount: '$49' },
                    { action: 'Refund processed', user: 'Lisa M.', time: '25 min ago', amount: '-$89' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-[9px] font-medium text-indigo-700">{item.user.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-gray-900">{item.action}</p>
                          <p className="text-[9px] text-gray-500">{item.user} · {item.time}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-medium ${item.amount.startsWith('-') ? 'text-red-500' : 'text-gray-900'}`}>
                        {item.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}