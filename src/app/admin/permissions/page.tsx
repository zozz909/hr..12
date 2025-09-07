import { Metadata } from 'next';
import SimplePermissionManager from '@/components/admin/SimplePermissionManager';

export const metadata: Metadata = {
  title: 'إدارة الصلاحيات - نظام الموارد البشرية',
  description: 'إدارة صلاحيات المستخدمين - نظام مبسط وآمن',
};

export default function PermissionsPage() {
  return (
    <div className="container mx-auto py-6">
      <SimplePermissionManager />
    </div>
  );
}
