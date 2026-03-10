import { ClipboardList, Plus, Eye, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

export default function Forms() {
  const forms = [
    {
      id: 1,
      title: "Equipment Request Form",
      description: "Request new equipment or tools for the lab",
      responses: 12,
      status: "active",
      createdDate: "2026-01-15",
      category: "Equipment",
    },
    {
      id: 2,
      title: "Project Feedback Survey",
      description: "Mid-semester feedback on ongoing projects",
      responses: 28,
      status: "active",
      createdDate: "2026-02-01",
      category: "Feedback",
    },
    {
      id: 3,
      title: "Workshop Interest Survey",
      description: "Gauge interest in upcoming workshop topics",
      responses: 45,
      status: "closed",
      createdDate: "2026-01-20",
      category: "Event",
    },
    {
      id: 4,
      title: "Mentor Matching Form",
      description: "Match new members with experienced mentors",
      responses: 8,
      status: "active",
      createdDate: "2026-02-10",
      category: "Onboarding",
    },
  ];

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Forms & Surveys</h1>
          <p className="text-gray-600">Create and manage internal forms</p>
        </div>
        <Button className="bg-[#103078] hover:bg-[#2048A0]">
          <Plus className="h-4 w-4 mr-2" />
          Create Form
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Total Forms</p>
            <p className="text-2xl font-bold text-[#103078]">{forms.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Active</p>
            <p className="text-2xl font-bold text-green-600">
              {forms.filter(f => f.status === "active").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Total Responses</p>
            <p className="text-2xl font-bold text-[#2048A0]">
              {forms.reduce((sum, f) => sum + f.responses, 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">This Month</p>
            <p className="text-2xl font-bold text-gray-600">2</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Forms</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {forms.map((form) => (
              <Card key={form.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-12 h-12 rounded-lg bg-[#103078]/10 flex items-center justify-center">
                      <ClipboardList className="h-6 w-6 text-[#103078]" />
                    </div>
                    <Badge
                      className={
                        form.status === "active"
                          ? "bg-green-100 text-green-700 hover:bg-green-100"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                      }
                    >
                      {form.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-base">{form.title}</CardTitle>
                  <p className="text-sm text-gray-600">{form.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <Badge variant="outline">{form.category}</Badge>
                      <span className="text-gray-600">
                        {form.responses} responses
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Created: {form.createdDate}
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {forms
              .filter((f) => f.status === "active")
              .map((form) => (
                <Card key={form.id} className="hover:shadow-md transition-shadow border-green-200">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-12 h-12 rounded-lg bg-[#103078]/10 flex items-center justify-center">
                        <ClipboardList className="h-6 w-6 text-[#103078]" />
                      </div>
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        Active
                      </Badge>
                    </div>
                    <CardTitle className="text-base">{form.title}</CardTitle>
                    <p className="text-sm text-gray-600">{form.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <Badge variant="outline">{form.category}</Badge>
                        <span className="text-gray-600">
                          {form.responses} responses
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Created: {form.createdDate}
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="closed" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {forms
              .filter((f) => f.status === "closed")
              .map((form) => (
                <Card key={form.id} className="hover:shadow-md transition-shadow opacity-75">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-12 h-12 rounded-lg bg-[#103078]/10 flex items-center justify-center">
                        <ClipboardList className="h-6 w-6 text-[#103078]" />
                      </div>
                      <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
                        Closed
                      </Badge>
                    </div>
                    <CardTitle className="text-base">{form.title}</CardTitle>
                    <p className="text-sm text-gray-600">{form.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <Badge variant="outline">{form.category}</Badge>
                        <span className="text-gray-600">
                          {form.responses} responses
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Created: {form.createdDate}
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View Results
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Info */}
      <Card className="border-[#103078]/20 bg-gradient-to-br from-white to-blue-50/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-[#103078]" />
            Form Builder Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>📝 Keep forms short and focused</li>
            <li>❓ Use clear, simple questions</li>
            <li>✅ Include validation for required fields</li>
            <li>📊 Enable response analysis</li>
            <li>🔒 Set appropriate access permissions</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
