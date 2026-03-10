import { Package, Plus, Search, Calendar, User, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

export default function Equipment() {
  const equipment = [
    {
      id: 1,
      name: "Oscilloscope (Rigol DS1054Z)",
      category: "Test Equipment",
      status: "available",
      location: "Lab 201 - Shelf A3",
      quantity: 3,
      available: 2,
      nextAvailable: null,
    },
    {
      id: 2,
      name: "Arduino Mega 2560",
      category: "Microcontroller",
      status: "available",
      location: "Lab 201 - Drawer B1",
      quantity: 10,
      available: 7,
      nextAvailable: null,
    },
    {
      id: 3,
      name: "Raspberry Pi 4 (8GB)",
      category: "Computer",
      status: "borrowed",
      location: "Lab 201 - Shelf C2",
      quantity: 5,
      available: 0,
      nextAvailable: "2026-02-18",
      borrower: "John Doe",
    },
    {
      id: 4,
      name: "3D Printer (Ender 3 Pro)",
      category: "Fabrication",
      status: "available",
      location: "Workshop Area",
      quantity: 2,
      available: 1,
      nextAvailable: null,
    },
    {
      id: 5,
      name: "LiDAR Sensor (RPLidar A1)",
      category: "Sensor",
      status: "borrowed",
      location: "Lab 201 - Shelf D1",
      quantity: 2,
      available: 0,
      nextAvailable: "2026-02-20",
      borrower: "Sarah Kim",
    },
    {
      id: 6,
      name: "Soldering Station",
      category: "Tool",
      status: "maintenance",
      location: "Workshop Area",
      quantity: 4,
      available: 3,
      nextAvailable: "2026-02-17",
    },
  ];

  const myBorrowings = [
    {
      id: 1,
      equipment: "Raspberry Pi 4 (8GB)",
      borrowedDate: "2026-02-10",
      dueDate: "2026-02-18",
      status: "active",
    },
    {
      id: 2,
      equipment: "Arduino Uno R3",
      borrowedDate: "2026-02-05",
      dueDate: "2026-02-12",
      status: "overdue",
    },
  ];

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Equipment Management</h1>
          <p className="text-gray-600">Borrow and manage lab equipment</p>
        </div>
        <Button className="bg-[#103078] hover:bg-[#2048A0]">
          <Plus className="h-4 w-4 mr-2" />
          Request Equipment
        </Button>
      </div>

      {/* My Borrowings */}
      {myBorrowings.length > 0 && (
        <Card className="mb-6 border-[#2048A0]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-[#2048A0]" />
              My Current Borrowings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myBorrowings.map((borrowing) => (
                <div
                  key={borrowing.id}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    borrowing.status === "overdue"
                      ? "bg-red-50 border border-red-200"
                      : "bg-blue-50 border border-blue-200"
                  }`}
                >
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{borrowing.equipment}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Borrowed: {borrowing.borrowedDate}</span>
                      <span>Due: {borrowing.dueDate}</span>
                      <Badge
                        className={
                          borrowing.status === "overdue"
                            ? "bg-red-100 text-red-700 hover:bg-red-100"
                            : "bg-green-100 text-green-700 hover:bg-green-100"
                        }
                      >
                        {borrowing.status === "overdue" ? "Overdue" : "Active"}
                      </Badge>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Return
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Search equipment..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Equipment List */}
      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Equipment</TabsTrigger>
          <TabsTrigger value="available">Available</TabsTrigger>
          <TabsTrigger value="borrowed">Borrowed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipment.map((item) => (
              <Card
                key={item.id}
                className={`hover:shadow-md transition-shadow ${
                  item.status === "maintenance" ? "opacity-75" : ""
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-12 h-12 rounded-lg bg-[#103078]/10 flex items-center justify-center">
                      <Package className="h-6 w-6 text-[#103078]" />
                    </div>
                    <Badge
                      className={
                        item.status === "available"
                          ? "bg-green-100 text-green-700 hover:bg-green-100"
                          : item.status === "borrowed"
                          ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                      }
                    >
                      {item.status === "available" ? (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      ) : (
                        <AlertCircle className="h-3 w-3 mr-1" />
                      )}
                      {item.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-base">{item.name}</CardTitle>
                  <p className="text-sm text-gray-600">{item.category}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Available:</span>
                      <span className="font-semibold">
                        {item.available}/{item.quantity}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{item.location}</span>
                    </div>
                    {item.nextAvailable && (
                      <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                        Next available: {item.nextAvailable}
                        {item.borrower && (
                          <span className="block">Borrowed by: {item.borrower}</span>
                        )}
                      </div>
                    )}
                    <Button
                      size="sm"
                      className="w-full"
                      disabled={
                        item.status === "maintenance" || item.available === 0
                      }
                      variant={item.available > 0 ? "default" : "outline"}
                    >
                      {item.status === "maintenance"
                        ? "Under Maintenance"
                        : item.available > 0
                        ? "Borrow"
                        : "Not Available"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="available" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipment
              .filter((item) => item.status === "available" && item.available > 0)
              .map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow border-green-200">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-12 h-12 rounded-lg bg-[#103078]/10 flex items-center justify-center">
                        <Package className="h-6 w-6 text-[#103078]" />
                      </div>
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Available
                      </Badge>
                    </div>
                    <CardTitle className="text-base">{item.name}</CardTitle>
                    <p className="text-sm text-gray-600">{item.category}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Available:</span>
                        <span className="font-semibold">
                          {item.available}/{item.quantity}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{item.location}</span>
                      </div>
                      <Button size="sm" className="w-full">
                        Borrow
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="borrowed" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipment
              .filter((item) => item.status === "borrowed")
              .map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow border-yellow-200">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-12 h-12 rounded-lg bg-[#103078]/10 flex items-center justify-center">
                        <Package className="h-6 w-6 text-[#103078]" />
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Borrowed
                      </Badge>
                    </div>
                    <CardTitle className="text-base">{item.name}</CardTitle>
                    <p className="text-sm text-gray-600">{item.category}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Available:</span>
                        <span className="font-semibold">
                          {item.available}/{item.quantity}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{item.location}</span>
                      </div>
                      {item.nextAvailable && (
                        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          Next available: {item.nextAvailable}
                          {item.borrower && (
                            <span className="block">Borrowed by: {item.borrower}</span>
                          )}
                        </div>
                      )}
                      <Button size="sm" className="w-full" variant="outline">
                        Reserve
                      </Button>
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
            <Package className="h-5 w-5 text-[#103078]" />
            Borrowing Policy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>📋 Maximum borrowing period: 14 days</li>
            <li>🔄 Equipment can be renewed if not reserved</li>
            <li>⚠️ Late returns may result in borrowing restrictions</li>
            <li>🛠️ Report any damage immediately</li>
            <li>📍 Return equipment to the designated location</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
