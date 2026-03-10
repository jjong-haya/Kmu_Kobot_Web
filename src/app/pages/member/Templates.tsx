import { FolderOpen, Plus, Search, Download, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

export default function Templates() {
  const templates = [
    {
      id: 1,
      name: "Project Proposal Template",
      category: "Project",
      description: "Standard template for proposing new robotics projects",
      downloads: 45,
      lastUpdated: "2026-02-10",
      format: "DOCX",
      tags: ["Project", "Proposal"],
    },
    {
      id: 2,
      name: "Meeting Minutes Template",
      category: "Meeting",
      description: "Structured format for recording meeting discussions",
      downloads: 78,
      lastUpdated: "2026-02-08",
      format: "DOCX",
      tags: ["Meeting", "Documentation"],
    },
    {
      id: 3,
      name: "Technical Review Checklist",
      category: "Review",
      description: "Comprehensive checklist for peer code reviews",
      downloads: 34,
      lastUpdated: "2026-02-05",
      format: "PDF",
      tags: ["Review", "Code Quality"],
    },
    {
      id: 4,
      name: "Project Retrospective Template",
      category: "Retrospective",
      description: "Guide for conducting effective project retrospectives",
      downloads: 28,
      lastUpdated: "2026-01-30",
      format: "PPTX",
      tags: ["Retrospective", "Team"],
    },
    {
      id: 5,
      name: "Equipment Checkout Form",
      category: "Equipment",
      description: "Standard form for borrowing lab equipment",
      downloads: 92,
      lastUpdated: "2026-02-12",
      format: "PDF",
      tags: ["Equipment", "Form"],
    },
    {
      id: 6,
      name: "Event Planning Template",
      category: "Event",
      description: "Complete checklist for planning club events",
      downloads: 23,
      lastUpdated: "2026-02-01",
      format: "XLSX",
      tags: ["Event", "Planning"],
    },
  ];

  const categories = ["All", "Project", "Meeting", "Review", "Equipment", "Event"];

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Template Library</h1>
          <p className="text-gray-600">Reusable templates and documents</p>
        </div>
        <Button className="bg-[#103078] hover:bg-[#2048A0]">
          <Plus className="h-4 w-4 mr-2" />
          Upload Template
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Search templates..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Categories */}
      <Tabs defaultValue="All" className="mb-6">
        <TabsList>
          {categories.map((cat) => (
            <TabsTrigger key={cat} value={cat}>
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category} value={category} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates
                .filter((t) => category === "All" || t.category === category)
                .map((template) => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div className="w-12 h-12 rounded-lg bg-[#103078]/10 flex items-center justify-center">
                          <FolderOpen className="h-6 w-6 text-[#103078]" />
                        </div>
                        <Badge variant="outline">{template.format}</Badge>
                      </div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">
                        {template.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {template.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                        <span>{template.downloads} downloads</span>
                        <span>Updated {template.lastUpdated}</span>
                      </div>
                      <Button size="sm" className="w-full" variant="outline">
                        <Download className="h-3.5 w-3.5 mr-2" />
                        Download
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Popular Templates */}
      <Card className="border-[#103078]/20 bg-gradient-to-br from-white to-blue-50/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="h-5 w-5 text-[#103078]" />
            Most Downloaded
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {templates
              .sort((a, b) => b.downloads - a.downloads)
              .slice(0, 3)
              .map((template, index) => (
                <div
                  key={template.id}
                  className="flex items-center gap-3 p-2 hover:bg-white rounded-lg transition-colors"
                >
                  <span className="text-lg font-bold text-[#103078] w-6">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{template.name}</p>
                    <p className="text-xs text-gray-500">
                      {template.downloads} downloads
                    </p>
                  </div>
                  <Button size="sm" variant="ghost">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
