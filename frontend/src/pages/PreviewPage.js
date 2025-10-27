import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy, ExternalLink, ArrowLeft, Share2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PreviewPage = () => {
  const { configId } = useParams();
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (configId) {
      fetchConfig();
    }
  }, [configId]);

  const fetchConfig = async () => {
    try {
      const response = await axios.get(`${API}/config/${configId}`);
      setConfig(response.data);
    } catch (error) {
      toast.error("Failed to load configuration");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="pulse text-4xl mb-4">⏳</div>
          <p className="text-gray-400">Loading configuration...</p>
        </div>
      </div>
    );
  }

  if (!config) return null;

  const widgetUrl = `${BACKEND_URL}/api/widget/${configId}`;
  const previewUrl = `${window.location.origin}/preview/${configId}`;
  
  const iframeCode = `<iframe src="${widgetUrl}" width="100%" height="400" frameborder="0" style="border-radius: 16px;"></iframe>`;
  
  const standaloneCode = `<!-- CS Server Widget - Standalone Version -->
<div id="cs-server-widget-${configId}"></div>
<script>
(function() {
  const containerId = 'cs-server-widget-${configId}';
  const apiUrl = '${API}/server-status/${configId}';
  const refreshInterval = ${config.refresh_interval} * 1000;
  
  async function fetchData() {
    try {
      const response = await fetch(apiUrl);
      const result = await response.json();
      
      const container = document.getElementById(containerId);
      if (!result.success) {
        container.innerHTML = '<div style="color: #ff4444; padding: 20px; text-align: center;">❌ Server offline or unavailable</div>';
        return;
      }
      
      const data = result.data;
      const cfg = result.config;
      
      let html = '<div style="font-family: ' + cfg.font_family + '; background: ' + (cfg.dark_mode ? 'rgba(15, 15, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)') + '; border-radius: 16px; padding: 20px; border: 1px solid ' + cfg.accent_color + '40; backdrop-filter: blur(12px); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);">';
      
      if (data.hostname) {
        html += '<div style="font-size: 18px; font-weight: 600; margin-bottom: 16px; color: ' + cfg.accent_color + ';">' + data.hostname + '</div>';
      }
      
      html += '<div style="display: grid; gap: 12px;">';
      
      if (data.map) {
        html += '<div style="display: flex; justify-content: space-between; padding: 10px; background: ' + (cfg.dark_mode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)') + '; border-radius: 8px; border-left: 3px solid ' + cfg.accent_color + ';"><span style="opacity: 0.7;">🗺️ Map</span><span style="font-weight: 600;">' + data.map + '</span></div>';
      }
      
      if (data.current_players !== undefined) {
        const maxPlayers = data.max_players !== undefined ? '/' + data.max_players : '';
        html += '<div style="display: flex; justify-content: space-between; padding: 10px; background: ' + (cfg.dark_mode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)') + '; border-radius: 8px; border-left: 3px solid ' + cfg.accent_color + ';"><span style="opacity: 0.7;">👥 Players</span><span style="font-weight: 600;">' + data.current_players + maxPlayers + '</span></div>';
      }
      
      if (data.game) {
        html += '<div style="display: flex; justify-content: space-between; padding: 10px; background: ' + (cfg.dark_mode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)') + '; border-radius: 8px; border-left: 3px solid ' + cfg.accent_color + ';"><span style="opacity: 0.7;">🎮 Game</span><span style="font-weight: 600;">' + data.game + '</span></div>';
      }
      
      if (data.ping !== undefined) {
        html += '<div style="display: flex; justify-content: space-between; padding: 10px; background: ' + (cfg.dark_mode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)') + '; border-radius: 8px; border-left: 3px solid ' + cfg.accent_color + ';"><span style="opacity: 0.7;">📡 Ping</span><span style="font-weight: 600;">' + data.ping + 'ms</span></div>';
      }
      
      html += '</div></div>';
      container.innerHTML = html;
    } catch (error) {
      console.error('Failed to fetch server data:', error);
    }
  }
  
  fetchData();
  setInterval(fetchData, refreshInterval);
})();
</script>`;

  return (
    <div className="min-h-screen p-4 sm:p-8 relative z-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            data-testid="back-to-home-btn"
            onClick={() => navigate("/")}
            variant="ghost"
            className="mb-4 text-gray-400 hover:text-[#00ff88]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <h1 className="text-4xl sm:text-5xl font-bold neon-glow" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Your Widget is Ready! 🎉
          </h1>
          <p className="text-gray-400 mt-2">Copy the embed code and paste it into your website</p>
        </div>

        {/* Share Preview Link */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-lg font-semibold text-[#00ff88]">📤 Shareable Preview Link</Label>
            <Button
              data-testid="copy-preview-link-btn"
              onClick={() => copyToClipboard(previewUrl, "Preview link")}
              variant="ghost"
              size="sm"
              className="text-[#00ff88] hover:text-[#00d4ff]"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Copy Link
            </Button>
          </div>
          <div className="code-block text-xs">
            {previewUrl}
          </div>
        </div>

        {/* Embed Code Tabs */}
        <div className="glass-card p-6 mb-6">
          <Tabs defaultValue="iframe" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="iframe" data-testid="iframe-tab">🖼️ iFrame Embed</TabsTrigger>
              <TabsTrigger value="standalone" data-testid="standalone-tab">📄 Standalone HTML</TabsTrigger>
            </TabsList>
            
            <TabsContent value="iframe" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold text-[#00ff88]">iFrame Embed Code</Label>
                <Button
                  data-testid="copy-iframe-btn"
                  onClick={() => copyToClipboard(iframeCode, "iFrame code")}
                  variant="ghost"
                  size="sm"
                  className="text-[#00ff88] hover:text-[#00d4ff]"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Code
                </Button>
              </div>
              <div className="code-block text-xs">
                {iframeCode}
              </div>
              <p className="text-sm text-gray-400">
                ✓ Easiest option - just paste this code wherever you want the widget to appear
              </p>
            </TabsContent>
            
            <TabsContent value="standalone" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold text-[#00ff88]">Standalone HTML Code</Label>
                <Button
                  data-testid="copy-standalone-btn"
                  onClick={() => copyToClipboard(standaloneCode, "Standalone code")}
                  variant="ghost"
                  size="sm"
                  className="text-[#00ff88] hover:text-[#00d4ff]"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Code
                </Button>
              </div>
              <div className="code-block text-xs" style={{ maxHeight: "300px", overflowY: "auto" }}>
                {standaloneCode}
              </div>
              <p className="text-sm text-gray-400">
                ✓ Self-contained code - no iFrame needed, fetches data directly from the API
              </p>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live Widget Preview */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-lg font-semibold text-[#00ff88]">🔴 Live Widget Preview</Label>
            <Button
              data-testid="open-widget-btn"
              onClick={() => window.open(widgetUrl, '_blank')}
              variant="ghost"
              size="sm"
              className="text-[#00ff88] hover:text-[#00d4ff]"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open in New Tab
            </Button>
          </div>
          <div className="border border-gray-700 rounded-lg overflow-hidden bg-black/30">
            <iframe
              data-testid="widget-preview-iframe"
              src={widgetUrl}
              width="100%"
              height="400"
              frameBorder="0"
              title="CS Server Widget Preview"
              className="w-full"
            />
          </div>
        </div>

        {/* Configuration Info */}
        <div className="glass-card p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4 text-[#00ff88]">⚙️ Configuration Details</h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Server:</span>
              <span className="ml-2 font-semibold">{config.server_ip}:{config.server_port}</span>
            </div>
            <div>
              <span className="text-gray-400">Theme:</span>
              <span className="ml-2 font-semibold capitalize">{config.theme}</span>
            </div>
            <div>
              <span className="text-gray-400">Accent Color:</span>
              <span className="ml-2 font-semibold">{config.accent_color}</span>
            </div>
            <div>
              <span className="text-gray-400">Refresh Interval:</span>
              <span className="ml-2 font-semibold">{config.refresh_interval}s</span>
            </div>
            <div>
              <span className="text-gray-400">Mode:</span>
              <span className="ml-2 font-semibold">{config.dark_mode ? "Dark" : "Light"}</span>
            </div>
            <div>
              <span className="text-gray-400">Config ID:</span>
              <span className="ml-2 font-mono text-xs">{config.config_id}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Button
            data-testid="create-another-btn"
            onClick={() => navigate("/")}
            className="flex-1 btn-primary h-12"
          >
            ➕ Create Another Widget
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PreviewPage;
