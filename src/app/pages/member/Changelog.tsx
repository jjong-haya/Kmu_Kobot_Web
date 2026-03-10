import { GitBranch, Plus, Tag, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";

export default function Changelog() {
  const changes = [
    {
      version: "2.3.0",
      date: "2026-02-15",
      type: "feature",
      changes: [
        "Added Peer Review system for code and presentations",
        "Introduced Study Playlist for structured learning paths",
        "New Office Hours booking system",
      ],
    },
    {
      version: "2.2.1",
      date: "2026-02-10",
      type: "improvement",
      changes: [
        "Improved equipment search functionality",
        "Enhanced member directory with skill filtering",
        "Updated notification preferences",
      ],
    },
    {
      version: "2.2.0",
      date: "2026-02-05",
      type: "feature",
      changes: [
        "Launched Showcase page for public project display",
        "Added Q&A help desk for member support",
        "Implemented template library",
      ],
    },
    {
      version: "2.1.2",
      date: "2026-01-30",
      type: "fix",
      changes: [
        "Fixed equipment booking conflict issues",
        "Resolved notification timing bugs",
        "Improved mobile responsiveness",
      ],
    },
    {
      version: "2.1.0",
      date: "2026-01-25",
      type: "feature",
      changes: [
        "Added Roadmap & OKR tracking",
        "Introduced Retrospective templates",
        "New event registration with capacity management",
      ],
    },
    {
      version: "2.0.0",
      date: "2026-01-15",
      type: "major",
      changes: [
        "Complete UI redesign with modern SaaS dashboard",
        "Migrated to React Router for better navigation",
        "Implemented comprehensive member dashboard",
        "Added role-based permissions system",
      ],
    },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case "major":
        return "bg-purple-100 text-purple-700 hover:bg-purple-100";
      case "feature":
        return "bg-blue-100 text-blue-700 hover:bg-blue-100";
      case "improvement":
        return "bg-green-100 text-green-700 hover:bg-green-100";
      case "fix":
        return "bg-orange-100 text-orange-700 hover:bg-orange-100";
      default:
        return "bg-gray-100 text-gray-700 hover:bg-gray-100";
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Changelog</h1>
          <p className="text-gray-600">Track platform updates and improvements</p>
        </div>
        <Badge className="bg-[#103078]">v{changes[0].version}</Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Current Version</p>
            <p className="text-2xl font-bold text-[#103078]">{changes[0].version}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Total Releases</p>
            <p className="text-2xl font-bold text-[#2048A0]">{changes.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Last Update</p>
            <p className="text-2xl font-bold text-green-600">{changes[0].date}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">This Month</p>
            <p className="text-2xl font-bold text-gray-600">3</p>
          </CardContent>
        </Card>
      </div>

      {/* Changelog Timeline */}
      <div className="space-y-6">
        {changes.map((release, index) => (
          <div key={release.version} className="relative">
            {/* Timeline Line */}
            {index !== changes.length - 1 && (
              <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-gray-200" />
            )}

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#103078] flex items-center justify-center flex-shrink-0">
                    <GitBranch className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">v{release.version}</CardTitle>
                      <Badge className={getTypeColor(release.type)}>
                        {release.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{release.date}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 ml-16">
                  {release.changes.map((change, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-[#2048A0] mt-1">•</span>
                      <span className="text-gray-700">{change}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Info */}
      <Card className="mt-6 border-[#103078]/20 bg-gradient-to-br from-white to-blue-50/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="h-5 w-5 text-[#103078]" />
            Version Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                Major
              </Badge>
              <span className="text-gray-600">Breaking changes or major features</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                Feature
              </Badge>
              <span className="text-gray-600">New features and capabilities</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                Improvement
              </Badge>
              <span className="text-gray-600">Enhancements to existing features</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                Fix
              </Badge>
              <span className="text-gray-600">Bug fixes and patches</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
