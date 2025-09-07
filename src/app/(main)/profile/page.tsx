'use client';
import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Mail, 
  Shield, 
  Clock, 
  Key,
  Edit,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  return <ProfileContent />;
}

function ProfileContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = React.useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const [profileForm, setProfileForm] = React.useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [passwordForm, setPasswordForm] = React.useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'مدير النظام';
      case 'hr_manager':
        return 'مدير الموارد البشرية';
      case 'employee':
        return 'موظف';
      case 'viewer':
        return 'مشاهد';
      default:
        return role;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleProfileUpdate = async () => {
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileForm),
      });

      const data = await response.json();

      if (data.success) {
        setIsEditing(false);
        toast({
          title: 'تم تحديث الملف الشخصي',
          description: 'تم حفظ التغييرات بنجاح.',
        });
      } else {
        toast({
          title: 'خطأ في التحديث',
          description: data.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'خطأ في الاتصال',
        description: 'حدث خطأ أثناء تحديث الملف الشخصي.',
        variant: 'destructive',
      });
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: 'خطأ في كلمة المرور',
        description: 'كلمة المرور الجديدة وتأكيدها غير متطابقين.',
        variant: 'destructive',
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: 'كلمة مرور ضعيفة',
        description: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        toast({
          title: 'تم تغيير كلمة المرور',
          description: 'تم تغيير كلمة المرور بنجاح.',
        });
      } else {
        toast({
          title: 'خطأ في تغيير كلمة المرور',
          description: data.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'خطأ في الاتصال',
        description: 'حدث خطأ أثناء تغيير كلمة المرور.',
        variant: 'destructive',
      });
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">جاري تحميل الملف الشخصي...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="font-headline text-4xl font-bold text-foreground">
          الملف الشخصي
        </h1>
        <p className="mt-2 text-muted-foreground">
          إدارة معلوماتك الشخصية وإعدادات الحساب.
        </p>
      </header>

      <div className="max-w-4xl space-y-8">
        {/* Profile Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary text-white text-lg">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <p className="text-muted-foreground">{user.email}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {getRoleLabel(user.role)}
                  </Badge>
                  <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                    {user.status === 'active' ? 'نشط' : 'غير نشط'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Profile Tabs */}
        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">المعلومات الشخصية</TabsTrigger>
            <TabsTrigger value="security">الأمان</TabsTrigger>
            <TabsTrigger value="permissions">الصلاحيات</TabsTrigger>
          </TabsList>

          {/* Personal Information */}
          <TabsContent value="info">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>المعلومات الشخصية</CardTitle>
                    <CardDescription>تحديث معلوماتك الأساسية.</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? (
                      <>
                        <Save className="ml-2 h-4 w-4" />
                        حفظ
                      </>
                    ) : (
                      <>
                        <Edit className="ml-2 h-4 w-4" />
                        تعديل
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">الاسم الكامل</Label>
                    <Input
                      id="name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleProfileUpdate}>
                      <Save className="ml-2 h-4 w-4" />
                      حفظ التغييرات
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsEditing(false);
                        setProfileForm({
                          name: user?.name || '',
                          email: user?.email || '',
                        });
                      }}
                    >
                      إلغاء
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات الأمان</CardTitle>
                <CardDescription>تغيير كلمة المرور وإعدادات الأمان.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Change Password */}
                <div className="space-y-4">
                  <h4 className="font-semibold">تغيير كلمة المرور</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">كلمة المرور الحالية</Label>
                      <div className="relative">
                        <Input
                          id="current-password"
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                          placeholder="أدخل كلمة المرور الحالية"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute left-3 top-3 text-muted-foreground hover:text-foreground"
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          placeholder="أدخل كلمة المرور الجديدة"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute left-3 top-3 text-muted-foreground hover:text-foreground"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
                      <div className="relative">
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          placeholder="أعد إدخال كلمة المرور الجديدة"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute left-3 top-3 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button onClick={handlePasswordChange}>
                      <Key className="ml-2 h-4 w-4" />
                      تغيير كلمة المرور
                    </Button>
                  </div>
                </div>

                {/* Login History */}
                <div className="space-y-4">
                  <h4 className="font-semibold">معلومات تسجيل الدخول</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">آخر تسجيل دخول</p>
                        <p className="text-sm text-muted-foreground">
                          {user?.lastLogin ? new Date(user.lastLogin).toLocaleString('ar-SA') : 'غير متوفر'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Shield className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">حالة الأمان</p>
                        <p className="text-sm text-muted-foreground">آمن</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions */}
          <TabsContent value="permissions">
            <Card>
              <CardHeader>
                <CardTitle>الصلاحيات والأدوار</CardTitle>
                <CardDescription>عرض الصلاحيات المخصصة لحسابك.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">الدور الحالي</h4>
                    <Badge variant="outline" className="text-lg px-4 py-2">
                      {getRoleLabel(user?.role || '')}
                    </Badge>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-4">الصلاحيات المتاحة</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {user?.permissions.map((permission) => (
                        <div key={permission} className="flex items-center gap-2 p-3 border rounded-lg">
                          <Shield className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{permission}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
