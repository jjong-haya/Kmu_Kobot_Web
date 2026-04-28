import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Mail, MapPin, Phone, Instagram, Github } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("문의가 전송되었습니다. 빠른 시일 내에 답변드리겠습니다.");
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  const contacts = [
    {
      icon: Mail,
      label: "Email",
      value: "kobot@kookmin.ac.kr",
      link: "mailto:kobot@kookmin.ac.kr",
    },
    {
      icon: Phone,
      label: "Phone",
      value: "02-910-XXXX",
      link: "tel:029100000",
    },
    {
      icon: MapPin,
      label: "Location",
      value: "국민대학교 학생회관 3층 동아리방",
      link: null,
    },
  ];

  const social = [
    {
      icon: Instagram,
      label: "Instagram",
      value: "@kmubot",
      link: "https://instagram.com/kmubot",
    },
    {
      icon: Github,
      label: "GitHub",
      value: "github.com/Kmu-Kobot",
      link: "https://github.com/Kmu-Kobot",
    },
  ];

  return (
    <div className="py-12">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Contact</h1>
          <p className="text-lg text-gray-600">
            궁금한 점이 있으신가요? 언제든 문의해주세요
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div>
            <h2 className="text-2xl font-bold mb-6">연락처</h2>

            <div className="space-y-4 mb-8">
              {contacts.map((contact, index) => {
                const Icon = contact.icon;
                return (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-[#103078]/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-6 w-6 text-[#103078]" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            {contact.label}
                          </p>
                          {contact.link ? (
                            <a
                              href={contact.link}
                              className="font-semibold text-[#2048A0] hover:underline"
                            >
                              {contact.value}
                            </a>
                          ) : (
                            <p className="font-semibold">{contact.value}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <h3 className="text-xl font-bold mb-4">소셜 미디어</h3>
            <div className="space-y-4">
              {social.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-[#103078]/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-6 w-6 text-[#103078]" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">{item.label}</p>
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-[#2048A0] hover:underline"
                          >
                            {item.value}
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Map placeholder */}
            <div className="mt-8">
              <Card>
                <CardContent className="p-0">
                  <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <MapPin className="h-12 w-12 mx-auto mb-2" />
                      <p>지도</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-bold mb-6">문의하기</h2>
            <Card>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="name">이름 *</Label>
                    <Input
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">이메일 *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="subject">제목 *</Label>
                    <Input
                      id="subject"
                      required
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">메시지 *</Label>
                    <Textarea
                      id="message"
                      required
                      rows={6}
                      placeholder="문의 내용을 입력해주세요"
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-[#103078] hover:bg-[#2048A0]"
                  >
                    전송
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* FAQ */}
            <div className="mt-8">
              <h3 className="text-xl font-bold mb-4">자주 묻는 질문</h3>
              <div className="space-y-3">
                <Card>
                  <CardContent className="p-4">
                    <p className="font-semibold text-sm mb-1">
                      동아리 방문이 가능한가요?
                    </p>
                    <p className="text-sm text-gray-600">
                      네, 평일 오후 시간에 방문 가능합니다. 사전에 연락주시면
                      더 좋습니다.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="font-semibold text-sm mb-1">
                      멤버십 문의는 어디로 하나요?
                    </p>
                    <p className="text-sm text-gray-600">
                      이메일(kobot@kookmin.ac.kr)로 문의해주시면 빠르게
                      답변드리겠습니다.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
