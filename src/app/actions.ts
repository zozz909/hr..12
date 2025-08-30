
'use server';

import { z } from 'zod';
import { executeQuery } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const institutionSchema = z.object({
    name: z.string().min(2, { message: "يجب أن يكون اسم المؤسسة حرفين على الأقل." }),
    crNumber: z.string().length(10, { message: "يجب أن يحتوي رقم السجل على 10 أرقام." }),
    crExpiry: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "التاريخ غير صالح."}),
});

export async function createInstitution(prevState: any, formData: FormData) {
    const validatedFields = institutionSchema.safeParse({
        name: formData.get('name'),
        crNumber: formData.get('crNumber'),
        crExpiry: formData.get('crExpiry'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'خطأ في الإدخال. يرجى مراجعة البيانات.',
        };
    }

    const { name, crNumber, crExpiry } = validatedFields.data;
    const newId = `inst-${Date.now()}`; 

    try {
        await executeQuery(
            'INSERT INTO institutions (id, name, crNumber, crExpiryDate) VALUES (?, ?, ?, ?)',
            [newId, name, crNumber, crExpiry]
        );
        
        revalidatePath('/');
        return { message: `تمت إضافة المؤسسة ${name} بنجاح.`, success: true };

    } catch (error) {
        console.error(error);
        return { message: 'فشل في إنشاء المؤسسة.', success: false };
    }
}
