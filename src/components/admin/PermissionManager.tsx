'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, Building, DollarSign, Calendar, CreditCard, 
  Award, FileText, BarChart, Settings, Shield,
  CheckCircle, XCircle, AlertTriangle, Info
} from 'lucide-react';

interface Permission {
  id: string;
  label: string;
  description: string;
  category: string;
  level: 'basic' | 'advanced' | 'admin';
  dependencies?: string[];
  conflicts?: string[];
  isSystemCritical?: boolean;
}

interface PermissionCategory {
  id: string;
  label: string;
  description: string;
  icon: string;
  order: number;
}

const CATEGORY_ICONS = {
  employees: Users,
  institutions: Building,
  payroll: DollarSign,
  leaves: Calendar,
  advances: CreditCard,
  compensations: Award,
  documents: FileText,
  reports: BarChart,
  system: Settings
};

const LEVEL_COLORS = {
  basic: 'bg-green-100 text-green-800',
  advanced: 'bg-yellow-100 text-yellow-800',
  admin: 'bg-red-100 text-red-800'
};

const LEVEL_LABELS = {
  basic: 'أساسي',
  advanced: 'متقدم',
  admin: 'إداري'
};

export default function PermissionManager() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [categories, setCategories] = useState<PermissionCategory[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [validation, setValidation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/permissions');
      const data = await response.json();
      
      if (data.success) {
        setPermissions(data.permissions);
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('خطأ في جلب الصلاحيات:', error);
    } finally {
      setLoading(false);
    }
  };

  const validatePermissions = async (permissionIds: string[]) => {
    try {
      const response = await fetch('/api/permissions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: permissionIds })
      });
      
      const data = await response.json();
      if (data.success) {
        setValidation(data.validation);
      }
    } catch (error) {
      console.error('خطأ في التحقق من الصلاحيات:', error);
    }
  };

  const togglePermission = (permissionId: string) => {
    const newSelected = selectedPermissions.includes(permissionId)
      ? selectedPermissions.filter(id => id !== permissionId)
      : [...selectedPermissions, permissionId];
    
    setSelectedPermissions(newSelected);
    validatePermissions(newSelected);
  };

  const getPermissionsByCategory = (categoryId: string) => {
    return permissions.filter(p => p.category === categoryId);
  };

  const renderPermissionCard = (permission: Permission) => {
    const isSelected = selectedPermissions.includes(permission.id);
    const IconComponent = CATEGORY_ICONS[permission.category as keyof typeof CATEGORY_ICONS] || Shield;
    
    return (
      <Card 
        key={permission.id}
        className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'}`}
        onClick={() => togglePermission(permission.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <IconComponent className="h-5 w-5 text-gray-600" />
              <div>
                <h4 className="font-medium text-sm">{permission.label}</h4>
                <p className="text-xs text-gray-500 mt-1">{permission.description}</p>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-1">
              <Badge className={`text-xs ${LEVEL_COLORS[permission.level]}`}>
                {LEVEL_LABELS[permission.level]}
              </Badge>
              {permission.isSystemCritical && (
                <Badge variant="destructive" className="text-xs">
                  حساس
                </Badge>
              )}
            </div>
          </div>
          
          {permission.dependencies && permission.dependencies.length > 0 && (
            <div className="mt-2 pt-2 border-t">
              <p className="text-xs text-gray-500">
                يتطلب: {permission.dependencies.map(dep => 
                  permissions.find(p => p.id === dep)?.label || dep
                ).join(', ')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderValidationResults = () => {
    if (!validation) return null;

    return (
      <div className="space-y-3">
        {validation.errors.length > 0 && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>أخطاء:</strong>
              <ul className="mt-1 list-disc list-inside">
                {validation.errors.map((error: string, index: number) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {validation.warnings.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>تحذيرات:</strong>
              <ul className="mt-1 list-disc list-inside">
                {validation.warnings.map((warning: string, index: number) => (
                  <li key={index} className="text-sm">{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {validation.isValid && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              مجموعة الصلاحيات صحيحة ومتوافقة!
            </AlertDescription>
          </Alert>
        )}

        {validation.addedDependencies && validation.addedDependencies.length > 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>تم إضافة تبعيات تلقائياً:</strong>
              <div className="mt-1">
                {validation.addedDependencies.map((dep: string) => (
                  <Badge key={dep} variant="outline" className="mr-1 mb-1">
                    {permissions.find(p => p.id === dep)?.label || dep}
                  </Badge>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">جاري تحميل الصلاحيات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة الصلاحيات المتقدمة</h2>
          <p className="text-gray-600">نظام صلاحيات هرمي ومنطقي مع التحقق من التبعيات</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            {selectedPermissions.length} صلاحية محددة
          </Badge>
          <Button 
            onClick={() => setSelectedPermissions([])}
            variant="outline"
            size="sm"
          >
            مسح الكل
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="categories">حسب الفئة</TabsTrigger>
          <TabsTrigger value="validation">التحقق</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(category => {
              const categoryPermissions = getPermissionsByCategory(category.id);
              const selectedInCategory = categoryPermissions.filter(p => 
                selectedPermissions.includes(p.id)
              ).length;
              
              return (
                <Card key={category.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <span>{category.label}</span>
                      <Badge variant="outline">
                        {selectedInCategory}/{categoryPermissions.length}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {categoryPermissions.slice(0, 3).map(permission => (
                        <div 
                          key={permission.id}
                          className={`p-2 rounded text-sm cursor-pointer transition-colors ${
                            selectedPermissions.includes(permission.id)
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                          onClick={() => togglePermission(permission.id)}
                        >
                          {permission.label}
                        </div>
                      ))}
                      {categoryPermissions.length > 3 && (
                        <p className="text-xs text-gray-500 text-center">
                          +{categoryPermissions.length - 3} صلاحية أخرى
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          {categories.map(category => {
            const categoryPermissions = getPermissionsByCategory(category.id);
            
            return (
              <Card key={category.id}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>{category.label}</span>
                    <Badge variant="outline">
                      {categoryPermissions.length} صلاحية
                    </Badge>
                  </CardTitle>
                  <p className="text-gray-600">{category.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categoryPermissions.map(renderPermissionCard)}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>التحقق من صحة الصلاحيات</CardTitle>
              <p className="text-gray-600">
                تحقق من صحة مجموعة الصلاحيات المحددة والتبعيات المطلوبة
              </p>
            </CardHeader>
            <CardContent>
              {selectedPermissions.length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    اختر صلاحيات من التبويبات الأخرى لرؤية نتائج التحقق
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">الصلاحيات المحددة:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedPermissions.map(permId => {
                        const permission = permissions.find(p => p.id === permId);
                        return (
                          <Badge key={permId} variant="outline">
                            {permission?.label || permId}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                  
                  {renderValidationResults()}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
