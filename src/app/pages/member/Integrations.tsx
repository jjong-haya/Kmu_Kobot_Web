import { Link2, Plus, CheckCircle2, Settings, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";

export default function Integrations() {
  const integrations = [
    {
      id: 1,
      name: "GitHub",
      description: "Connect repositories for project collaboration",
      icon: "🔗",
      status: "connected",
      connectedDate: "2026-01-15",
      features: ["Repository sync", "Issue tracking", "Pull requests"],
    },
    {
      id: 2,
      name: "Discord",
      description: "Link Discord server for notifications",
      icon: "💬",
      status: "connected",
      connectedDate: "2026-01-10",
      features: ["Event notifications", "Announcements", "Member sync"],
    },
    {
      id: 3,
      name: "Google Drive",
      description: "Access shared files and documents",
      icon: "📁",
      status: "connected",
      connectedDate: "2026-01-20",
      features: ["File storage", "Document sharing", "Backup"],
    },
    {
      id: 4,
      name: "Slack",
      description: "Alternative communication platform",
      icon: "💼",
      status: "available",
      connectedDate: null,
      features: ["Team chat", "Channels", "Notifications"],
    },
    {
      id: 5,
      name: "Notion",
      description: "Advanced documentation and wiki",
      icon: "📝",
      status: "available",
      connectedDate: null,
      features: ["Documentation", "Wiki", "Knowledge base"],
    },
    {
      id: 6,
      name: "Jira",
      description: "Project management and issue tracking",
      icon: "📊",
      status: "available",
      connectedDate: null,
      features: ["Task management", "Sprints", "Roadmaps"],
    },
  ];

  const webhooks = [
    {
      id: 1,
      name: "GitHub Push Events",
      url: "https://api.example.com/webhooks/github",
      status: "active",
      lastTriggered: "2 hours ago",
    },
    {
      id: 2,
      name: "Discord Announcements",
      url: "https://api.example.com/webhooks/discord",
      status: "active",
      lastTriggered: "1 day ago",
    },
  ];

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Integrations</h1>
          <p className="text-gray-600">Connect external tools and services</p>
        </div>
        <Button className="bg-[#103078] hover:bg-[#2048A0]">
          <Plus className="h-4 w-4 mr-2" />
          Add Integration
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Connected</p>
            <p className="text-2xl font-bold text-green-600">
              {integrations.filter(i => i.status === "connected").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Available</p>
            <p className="text-2xl font-bold text-[#2048A0]">
              {integrations.filter(i => i.status === "available").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Webhooks</p>
            <p className="text-2xl font-bold text-[#103078]">{webhooks.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Connected Integrations */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Connected Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations
            .filter((integration) => integration.status === "connected")
            .map((integration) => (
              <Card
                key={integration.id}
                className="hover:shadow-md transition-shadow border-green-200"
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#103078] to-[#2048A0] flex items-center justify-center text-3xl">
                      {integration.icon}
                    </div>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  </div>
                  <CardTitle className="text-base">{integration.name}</CardTitle>
                  <p className="text-sm text-gray-600">
                    {integration.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">
                        Features
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {integration.features.map((feature) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {integration.connectedDate && (
                      <p className="text-xs text-gray-500">
                        Connected: {integration.connectedDate}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Settings className="h-3.5 w-3.5 mr-1" />
                        Configure
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600"
                      >
                        Disconnect
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {/* Available Integrations */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Available Integrations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations
            .filter((integration) => integration.status === "available")
            .map((integration) => (
              <Card key={integration.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-3xl">
                      {integration.icon}
                    </div>
                    <Badge variant="outline">Available</Badge>
                  </div>
                  <CardTitle className="text-base">{integration.name}</CardTitle>
                  <p className="text-sm text-gray-600">
                    {integration.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">
                        Features
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {integration.features.map((feature) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="w-full bg-[#103078] hover:bg-[#2048A0]"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Connect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {/* Webhooks */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Webhooks</h2>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Webhook
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{webhook.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{webhook.url}</p>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          webhook.status === "active"
                            ? "bg-green-100 text-green-700 hover:bg-green-100"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                        }
                      >
                        {webhook.status}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Last triggered: {webhook.lastTriggered}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info */}
      <Card className="border-[#103078]/20 bg-gradient-to-br from-white to-blue-50/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-5 w-5 text-[#103078]" />
            Integration Benefits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>🔗 Centralize your workflow in one place</li>
            <li>🔔 Get real-time notifications across platforms</li>
            <li>📊 Sync data automatically</li>
            <li>🛡️ Secure OAuth authentication</li>
            <li>⚡ Improve team productivity</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
