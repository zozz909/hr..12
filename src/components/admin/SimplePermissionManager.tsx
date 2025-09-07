'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Users, Building, DollarSign, Calendar, CreditCard,
  Award, BarChart, Settings, Shield, AlertTriangle, Save, MapPin, UserPlus, Trash2
} from 'lucide-react';

interface SimplePermission {
  id: string;
  name: string;
  description: string;
  category: string;
  isHigh: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  permissions: string[];
}

const CATEGORY_ICONS = {
  employees: Users,
  institutions: Building,
  branches: MapPin,
  payroll: DollarSign,
  leaves: Calendar,
  advances: CreditCard,
  compensations: Award,
  reports: BarChart,
  system: Settings
};

export default function SimplePermissionManager() {
  const [permissions, setPermissions] = useState<SimplePermission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [deletingUser, setDeletingUser] = useState<string>('');
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee' as 'admin' | 'employee'
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      const user = users.find(u => u.id === selectedUser);
      setUserPermissions(user?.permissions || []);
    }
  }, [selectedUser, users]);

  const fetchData = async () => {
    try {
      // جلب الصلاحيات
      const permResponse = await fetch('/api/permissions');
      const permData = await permResponse.json();
      
      // جلب المستخدمين
      const usersResponse = await fetch('/api/users');
      const usersData = await usersResponse.json();
      
      if (permData.success) {
        setPermissions(permData.permissions);
      }
      
      if (usersData.success) {
        setUsers(usersData.users);
      }
    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permissionId: string) => {
    setUserPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const savePermissions = async () => {
    if (!selectedUser) return;

    setSaving(true);
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUser,
          permissions: userPermissions
        })
      });

      const data = await response.json();
      if (data.success) {
        // تحديث البيانات المحلية
        setUsers(prev => prev.map(user =>
          user.id === selectedUser
            ? { ...user, permissions: userPermissions }
            : user
        ));
        alert('تم حفظ الصلاحيات بنجاح');
      } else {
        alert('خطأ في حفظ الصلاحيات: ' + data.error);
      }
    } catch (error) {
      alert('خطأ في الاتصال');
    } finally {
      setSaving(false);
    }
  };

  const addNewUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert('جميع الحقول مطلوبة');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          password: newUser.password,
          role: newUser.role,
          permissions: newUser.role === 'admin' ? [] : [
            'employees_view', 'institutions_view', 'branches_view',
            'leaves_view', 'leaves_request', 'advances_view',
            'advances_request', 'compensations_view', 'reports_view'
          ]
        })
      });

      const data = await response.json();
      if (data.success) {
        // إضافة المستخدم للقائمة المحلية
        setUsers(prev => [...prev, data.user]);
        // إعادة تعيين النموذج
        setNewUser({ name: '', email: '', password: '', role: 'employee' });
        setShowAddUser(false);
        alert('تم إضافة المستخدم بنجاح');
      } else {
        alert('خطأ في إضافة المستخدم: ' + data.error);
      }
    } catch (error) {
      alert('خطأ في الاتصال');
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;

    // منع حذف المدير الوحيد
    const adminCount = users.filter(u => u.role === 'admin').length;
    if (userToDelete.role === 'admin' && adminCount === 1) {
      alert('لا يمكن حذف المدير الوحيد في النظام');
      return;
    }

    const confirmDelete = confirm(
      `هل أنت متأكد من حذف المستخدم "${userToDelete.name}"؟\n` +
      `البريد الإلكتروني: ${userToDelete.email}\n` +
      `الدور: ${userToDelete.role === 'admin' ? 'مدير النظام' : 'موظف'}\n\n` +
      'هذا الإجراء لا يمكن التراجع عنه!'
    );

    if (!confirmDelete) return;

    setDeletingUser(userId);
    try {
      const response = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId })
      });

      const data = await response.json();
      if (data.success) {
        // إزالة المستخدم من القائمة المحلية
        setUsers(prev => prev.filter(user => user.id !== userId));

        // إذا كان المستخدم المحذوف هو المختار، إلغاء الاختيار
        if (selectedUser === userId) {
          setSelectedUser('');
          setUserPermissions([]);
        }

        alert('تم حذف المستخدم بنجاح');
      } else {
        alert('خطأ في حذف المستخدم: ' + data.error);
      }
    } catch (error) {
      alert('خطأ في الاتصال');
    } finally {
      setDeletingUser('');
    }
  };

  const getPermissionsByCategory = (category: string) => {
    return permissions.filter(p => p.category === category);
  };

  const selectedUserData = users.find(u => u.id === selectedUser);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة الصلاحيات المبسطة</h2>
          <p className="text-gray-600">نظام مبسط وآمن - دورين فقط مع تحكم كامل في الصلاحيات</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowAddUser(true)}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            إضافة مستخدم
          </Button>
          <Badge variant="outline" className="text-lg px-3 py-1">
            {permissions.length} صلاحية متاحة
          </Badge>
        </div>
      </div>

      {/* اختيار المستخدم */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>اختيار المستخدم</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Label htmlFor="user-select">المستخدم</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر مستخدماً لتعديل صلاحياته" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-2">
                          <span>{user.name}</span>
                          <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                            {user.role === 'admin' ? 'مدير' : 'موظف'}
                          </Badge>
                          <span className="text-sm text-gray-500">({user.permissions.length} صلاحية)</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedUser && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={savePermissions}
                  disabled={saving}
                  className="flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? 'جاري الحفظ...' : 'حفظ الصلاحيات'}</span>
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => deleteUser(selectedUser)}
                  disabled={deletingUser === selectedUser}
                  className="flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>{deletingUser === selectedUser ? 'جاري الحذف...' : 'حذف المستخدم'}</span>
                </Button>
              </div>
            )}
          </div>

          {selectedUserData && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{selectedUserData.name}</h4>
                  <p className="text-sm text-gray-600">{selectedUserData.email}</p>
                </div>
                <div className="text-right">
                  <Badge variant={selectedUserData.role === 'admin' ? 'destructive' : 'secondary'}>
                    {selectedUserData.role === 'admin' ? 'مدير النظام' : 'موظف'}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedUserData.role === 'admin' ? 'جميع الصلاحيات' : `${userPermissions.length} صلاحية`}
                  </p>
                </div>
              </div>

              {/* تحذير للمدير الوحيد */}
              {selectedUserData.role === 'admin' && users.filter(u => u.role === 'admin').length === 1 && (
                <Alert className="mt-3">
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>هذا هو المدير الوحيد في النظام</strong> - لا يمكن حذفه لأسباب أمنية
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* نموذج إضافة مستخدم */}
      {showAddUser && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserPlus className="h-5 w-5" />
              <span>إضافة مستخدم جديد</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new-name">الاسم</Label>
                <Input
                  id="new-name"
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="اسم المستخدم"
                />
              </div>

              <div>
                <Label htmlFor="new-email">البريد الإلكتروني</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="user@company.com"
                />
              </div>

              <div>
                <Label htmlFor="new-password">كلمة المرور</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="كلمة مرور قوية"
                />
              </div>

              <div>
                <Label htmlFor="new-role">الدور</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value: 'admin' | 'employee') => setNewUser(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">موظف</SelectItem>
                    <SelectItem value="admin">مدير النظام</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddUser(false);
                  setNewUser({ name: '', email: '', password: '', role: 'employee' });
                }}
              >
                إلغاء
              </Button>
              <Button
                onClick={addNewUser}
                disabled={saving}
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                {saving ? 'جاري الإضافة...' : 'إضافة المستخدم'}
              </Button>
            </div>

            {newUser.role === 'employee' && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  سيحصل الموظف على الصلاحيات الأساسية تلقائياً. يمكنك تعديل صلاحياته لاحقاً.
                </AlertDescription>
              </Alert>
            )}

            {newUser.role === 'admin' && (
              <Alert className="mt-4">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>مدير النظام سيحصل على جميع الصلاحيات تلقائياً.</strong>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* إدارة الصلاحيات */}
      {selectedUser && selectedUserData?.role === 'employee' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries({
            employees: 'الموظفين',
            institutions: 'المؤسسات',
            branches: 'الفروع',
            payroll: 'الرواتب',
            leaves: 'الإجازات',
            advances: 'السلف',
            compensations: 'المكافآت والخصومات',
            reports: 'التقارير',
            system: 'إدارة النظام'
          }).map(([categoryId, categoryName]) => {
            const categoryPermissions = getPermissionsByCategory(categoryId);
            const IconComponent = CATEGORY_ICONS[categoryId as keyof typeof CATEGORY_ICONS] || Shield;
            
            return (
              <Card key={categoryId}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <IconComponent className="h-5 w-5" />
                    <span>{categoryName}</span>
                    <Badge variant="outline">
                      {categoryPermissions.filter(p => userPermissions.includes(p.id)).length}/{categoryPermissions.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categoryPermissions.map(permission => (
                      <div key={permission.id} className="flex items-start space-x-3">
                        <Checkbox
                          id={permission.id}
                          checked={userPermissions.includes(permission.id)}
                          onCheckedChange={() => togglePermission(permission.id)}
                          disabled={categoryId === 'system'} // منع صلاحيات النظام للموظفين
                        />
                        <div className="flex-1">
                          <Label 
                            htmlFor={permission.id} 
                            className={`cursor-pointer ${categoryId === 'system' ? 'text-gray-400' : ''}`}
                          >
                            <div className="flex items-center space-x-2">
                              <span>{permission.name}</span>
                              {permission.isHigh && (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  حساس
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{permission.description}</p>
                          </Label>
                        </div>
                      </div>
                    ))}
                    
                    {categoryId === 'system' && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          صلاحيات النظام متاحة للمديرين فقط
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selectedUser && selectedUserData?.role === 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>مدير النظام</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>مدير النظام لديه جميع الصلاحيات تلقائياً</strong>
                <br />
                لا يمكن تعديل صلاحيات المدير لأسباب أمنية.
                <br />
                إذا كنت تريد تقييد المستخدم، غير دوره إلى "موظف" أولاً.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {!selectedUser && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">اختر مستخدماً</h3>
            <p className="text-gray-600">اختر مستخدماً من القائمة أعلاه لتعديل صلاحياته</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
