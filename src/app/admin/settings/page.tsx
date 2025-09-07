'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Plus, 
  Trash2, 
  Globe, 
  Lock, 
  Settings,
  AlertTriangle,
  CheckCircle,
  Monitor
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface AllowedDevice {
  id: string;
  ipAddress: string;
  description: string;
  addedAt: string;
  lastUsed?: string;
  isActive: boolean;
}

interface SecuritySettings {
  ipWhitelistEnabled: boolean;
  allowedDevices: AllowedDevice[];
  maxLoginAttempts: number;
  sessionTimeoutMinutes: number;
  requireStrongPasswords: boolean;
}

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [settings, setSettings] = React.useState<SecuritySettings>({
    ipWhitelistEnabled: false,
    allowedDevices: [],
    maxLoginAttempts: 5,
    sessionTimeoutMinutes: 60,
    requireStrongPasswords: true
  });
  
  const [newDevice, setNewDevice] = React.useState({
    ipAddress: '',
    description: ''
  });
  const [showAddDevice, setShowAddDevice] = React.useState(false);

  // تحميل الإعدادات الحالية
  React.useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/security-settings');
      const result = await response.json();
      
      if (result.success) {
        setSettings(result.data);
      } else {
        toast({
          variant: "destructive",
          title: "خطأ في تحميل الإعدادات",
          description: result.error || "حدث خطأ أثناء تحميل إعدادات الأمان",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ في الاتصال",
        description: "تعذر الاتصال بالخادم",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/security-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "تم حفظ الإعدادات",
          description: "تم حفظ إعدادات الأمان بنجاح",
        });
      } else {
        toast({
          variant: "destructive",
          title: "خطأ في الحفظ",
          description: result.error || "حدث خطأ أثناء حفظ الإعدادات",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ في الحفظ",
        description: "تعذر حفظ الإعدادات",
      });
    } finally {
      setSaving(false);
    }
  };

  const addDevice = () => {
    if (!newDevice.ipAddress || !newDevice.description) {
      toast({
        variant: "destructive",
        title: "بيانات ناقصة",
        description: "يرجى إدخال عنوان IP ووصف الجهاز",
      });
      return;
    }

    // التحقق من صحة عنوان IP
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(newDevice.ipAddress)) {
      toast({
        variant: "destructive",
        title: "عنوان IP غير صحيح",
        description: "يرجى إدخال عنوان IP صحيح (مثال: 192.168.1.100)",
      });
      return;
    }

    // التحقق من عدم تكرار عنوان IP
    if (settings.allowedDevices.some(device => device.ipAddress === newDevice.ipAddress)) {
      toast({
        variant: "destructive",
        title: "عنوان IP موجود",
        description: "هذا العنوان مضاف بالفعل إلى القائمة",
      });
      return;
    }

    const device: AllowedDevice = {
      id: `device-${Date.now()}`,
      ipAddress: newDevice.ipAddress,
      description: newDevice.description,
      addedAt: new Date().toISOString(),
      isActive: true
    };

    setSettings(prev => ({
      ...prev,
      allowedDevices: [...prev.allowedDevices, device]
    }));

    setNewDevice({ ipAddress: '', description: '' });
    setShowAddDevice(false);

    toast({
      title: "تم إضافة الجهاز",
      description: `تم إضافة الجهاز ${device.ipAddress} بنجاح`,
    });
  };

  const removeDevice = (deviceId: string) => {
    setSettings(prev => ({
      ...prev,
      allowedDevices: prev.allowedDevices.filter(device => device.id !== deviceId)
    }));

    toast({
      title: "تم حذف الجهاز",
      description: "تم حذف الجهاز من القائمة",
    });
  };

  const toggleDevice = (deviceId: string) => {
    setSettings(prev => ({
      ...prev,
      allowedDevices: prev.allowedDevices.map(device =>
        device.id === deviceId ? { ...device, isActive: !device.isActive } : device
      )
    }));
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Settings className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>جاري تحميل الإعدادات...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إعدادات مدير النظام</h1>
          <p className="text-muted-foreground">إدارة إعدادات الأمان والأجهزة المصرح لها</p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
        </Button>
      </div>

      <Tabs defaultValue="devices" className="space-y-6">
        <TabsList>
          <TabsTrigger value="devices">الأجهزة المصرح لها</TabsTrigger>
          <TabsTrigger value="security">إعدادات الأمان</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    الأجهزة المصرح لها بالدخول
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    إدارة عناوين IP المسموح لها بالوصول إلى النظام
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={settings.ipWhitelistEnabled}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, ipWhitelistEnabled: checked }))
                      }
                    />
                    <Label>تفعيل قائمة الأجهزة المصرح لها</Label>
                  </div>
                  <Button onClick={() => setShowAddDevice(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    إضافة جهاز
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!settings.ipWhitelistEnabled && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <p className="text-yellow-800">
                      قائمة الأجهزة المصرح لها غير مفعلة. جميع عناوين IP يمكنها الوصول للنظام.
                    </p>
                  </div>
                </div>
              )}

              {showAddDevice && (
                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle className="text-lg">إضافة جهاز جديد</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ip">عنوان IP</Label>
                        <Input
                          id="ip"
                          placeholder="192.168.1.100"
                          value={newDevice.ipAddress}
                          onChange={(e) => setNewDevice(prev => ({ ...prev, ipAddress: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">وصف الجهاز</Label>
                        <Input
                          id="description"
                          placeholder="جهاز مدير النظام"
                          value={newDevice.description}
                          onChange={(e) => setNewDevice(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={addDevice}>إضافة</Button>
                      <Button variant="outline" onClick={() => setShowAddDevice(false)}>
                        إلغاء
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                {settings.allowedDevices.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد أجهزة مضافة</p>
                    <p className="text-sm">اضغط "إضافة جهاز" لإضافة أول جهاز</p>
                  </div>
                ) : (
                  settings.allowedDevices.map((device) => (
                    <div
                      key={device.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {device.isActive ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          )}
                          <div>
                            <p className="font-medium">{device.ipAddress}</p>
                            <p className="text-sm text-muted-foreground">{device.description}</p>
                          </div>
                        </div>
                        <Badge variant={device.isActive ? "default" : "secondary"}>
                          {device.isActive ? "نشط" : "معطل"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={device.isActive}
                          onCheckedChange={() => toggleDevice(device.id)}
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>حذف الجهاز</AlertDialogTitle>
                              <AlertDialogDescription>
                                هل أنت متأكد من حذف الجهاز {device.ipAddress}؟
                                هذا الإجراء لا يمكن التراجع عنه.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction onClick={() => removeDevice(device.id)}>
                                حذف
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                إعدادات الأمان العامة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="maxAttempts">الحد الأقصى لمحاولات تسجيل الدخول</Label>
                  <Input
                    id="maxAttempts"
                    type="number"
                    min="1"
                    max="10"
                    value={settings.maxLoginAttempts}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      maxLoginAttempts: parseInt(e.target.value) || 5 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="sessionTimeout">مهلة انتهاء الجلسة (بالدقائق)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min="15"
                    max="480"
                    value={settings.sessionTimeoutMinutes}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      sessionTimeoutMinutes: parseInt(e.target.value) || 60 
                    }))}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.requireStrongPasswords}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, requireStrongPasswords: checked }))
                  }
                />
                <Label>إجبار استخدام كلمات مرور قوية</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
