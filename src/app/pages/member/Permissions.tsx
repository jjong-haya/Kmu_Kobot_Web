import { Shield, Users, Lock, Key, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";

export default function Permissions() {
  const roles = [
    {
      name: "Admin",
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      description: "Full system access and management",
      permissions: [
        "Manage all content",
        "User management",
        "System settings",
        "Financial data",
        "Integration management",
        "Role assignment",
      ],
      memberCount: 3,
    },
    {
      name: "Leadership",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      description: "Club officers and team leads",
      permissions: [
        "Create announcements",
        "Manage events",
        "Approve projects",
        "View analytics",
        "Mentor members",
      ],
      memberCount: 8,
    },
    {
      name: "Member",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      description: "Active club members",
      permissions: [
        "View content",
        "Create posts",
        "Join projects",
        "Book equipment",
        "Attend events",
      ],
      memberCount: 25,
    },
    {
      name: "Guest",
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
      description: "Limited access for visitors",
      permissions: [
        "View public content",
        "Read announcements",
        "View projects",
      ],
      memberCount: 5,
    },
  ];

  const features = [
    {
      category: "Content Management",
      items: [
        { feature: "Create Announcements", admin: true, leadership: true, member: false, guest: false },
        { feature: "Create Posts", admin: true, leadership: true, member: true, guest: false },
        { feature: "Edit Own Content", admin: true, leadership: true, member: true, guest: false },
        { feature: "Delete Any Content", admin: true, leadership: false, member: false, guest: false },
      ],
    },
    {
      category: "Projects",
      items: [
        { feature: "Create Projects", admin: true, leadership: true, member: true, guest: false },
        { feature: "Approve Projects", admin: true, leadership: true, member: false, guest: false },
        { feature: "Join Projects", admin: true, leadership: true, member: true, guest: false },
        { feature: "View Projects", admin: true, leadership: true, member: true, guest: true },
      ],
    },
    {
      category: "Events",
      items: [
        { feature: "Create Events", admin: true, leadership: true, member: false, guest: false },
        { feature: "Register for Events", admin: true, leadership: true, member: true, guest: false },
        { feature: "Cancel Events", admin: true, leadership: true, member: false, guest: false },
        { feature: "View Events", admin: true, leadership: true, member: true, guest: true },
      ],
    },
    {
      category: "Equipment",
      items: [
        { feature: "Borrow Equipment", admin: true, leadership: true, member: true, guest: false },
        { feature: "Approve Requests", admin: true, leadership: true, member: false, guest: false },
        { feature: "Add Equipment", admin: true, leadership: false, member: false, guest: false },
        { feature: "View Equipment", admin: true, leadership: true, member: true, guest: true },
      ],
    },
    {
      category: "Administration",
      items: [
        { feature: "User Management", admin: true, leadership: false, member: false, guest: false },
        { feature: "Role Assignment", admin: true, leadership: false, member: false, guest: false },
        { feature: "System Settings", admin: true, leadership: false, member: false, guest: false },
        { feature: "View Analytics", admin: true, leadership: true, member: false, guest: false },
      ],
    },
  ];

  return (
    <div className="max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Permissions & Roles</h1>
        <p className="text-gray-600">Understand access levels and capabilities</p>
      </div>

      {/* Roles Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {roles.map((role) => (
          <Card
            key={role.name}
            className={`hover:shadow-md transition-shadow ${role.borderColor}`}
          >
            <CardHeader>
              <div className={`w-12 h-12 rounded-lg ${role.bgColor} flex items-center justify-center mb-3`}>
                <Shield className={`h-6 w-6 ${role.color}`} />
              </div>
              <CardTitle className="text-lg">{role.name}</CardTitle>
              <p className="text-sm text-gray-600">{role.description}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Members</span>
                  <Badge variant="outline">{role.memberCount}</Badge>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    Key Permissions
                  </p>
                  <ul className="space-y-1">
                    {role.permissions.slice(0, 3).map((permission) => (
                      <li
                        key={permission}
                        className="flex items-start gap-2 text-xs text-gray-600"
                      >
                        <Check className={`h-3 w-3 ${role.color} mt-0.5`} />
                        <span>{permission}</span>
                      </li>
                    ))}
                  </ul>
                  {role.permissions.length > 3 && (
                    <p className="text-xs text-gray-500 mt-2">
                      +{role.permissions.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Permissions Matrix */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-[#103078]" />
            Permission Matrix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {features.map((category) => (
              <div key={category.category}>
                <h3 className="font-semibold mb-4 text-[#103078]">
                  {category.category}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">
                          Feature
                        </th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">
                          Admin
                        </th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">
                          Leadership
                        </th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">
                          Member
                        </th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">
                          Guest
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {category.items.map((item) => (
                        <tr key={item.feature} className="border-b last:border-0">
                          <td className="py-3 px-4 text-gray-700">
                            {item.feature}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {item.admin ? (
                              <Check className="h-5 w-5 text-green-600 mx-auto" />
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {item.leadership ? (
                              <Check className="h-5 w-5 text-green-600 mx-auto" />
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {item.member ? (
                              <Check className="h-5 w-5 text-green-600 mx-auto" />
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {item.guest ? (
                              <Check className="h-5 w-5 text-green-600 mx-auto" />
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-[#103078]/20 bg-gradient-to-br from-white to-blue-50/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-[#103078]" />
              Role Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>👤 New members start as "Member" role</li>
              <li>🎖️ Leadership roles assigned by admins</li>
              <li>🔄 Roles can be changed based on contributions</li>
              <li>📧 Changes are notified via email</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-[#103078]/20 bg-gradient-to-br from-white to-blue-50/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-5 w-5 text-[#103078]" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>🔐 Role-based access control (RBAC)</li>
              <li>🛡️ Secure authentication required</li>
              <li>📋 All actions are logged</li>
              <li>⚠️ Suspicious activity monitored</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
