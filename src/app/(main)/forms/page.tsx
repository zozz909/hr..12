'use client';
import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { getAllForms } from '@/lib/data';

export default function FormsPage() {
  const forms = getAllForms();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="font-headline text-4xl font-bold text-foreground">
          نماذج إدارية
        </h1>
        <p className="mt-2 text-muted-foreground">
          تحميل النماذج الإدارية والمستندات الرسمية.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {forms.map((form) => (
          <Card key={form.id}>
            <CardHeader>
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle>{form.title}</CardTitle>
                        <CardDescription>{form.description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Download className="ml-2 h-4 w-4" />
                تحميل النموذج
              </Button>
            </CardContent>
          </Card>
        ))}
         {forms.length === 0 && (
            <p className="text-muted-foreground md:col-span-2 lg:col-span-3 text-center">
                لم يتم العثور على أي نماذج.
            </p>
         )}
      </div>
    </div>
  );
}
