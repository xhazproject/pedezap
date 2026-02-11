// 'use server'; // Commented out for browser preview
import { z } from 'zod';

const formSchema = z.object({
  responsibleName: z.string().min(2, "Nome muito curto"),
  restaurantName: z.string().min(2, "Nome do restaurante muito curto"),
  whatsapp: z.string().min(10, "WhatsApp inválido"),
  cityState: z.string().min(3, "Cidade/Estado inválido"),
  plan: z.enum(["Local", "Local + Online"]),
  message: z.string().optional(),
});

export type FormState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export async function submitLead(prevState: FormState, formData: FormData): Promise<FormState> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const rawData = {
    responsibleName: formData.get('responsibleName'),
    restaurantName: formData.get('restaurantName'),
    whatsapp: formData.get('whatsapp'),
    cityState: formData.get('cityState'),
    plan: formData.get('plan'),
    message: formData.get('message'),
  };

  const validatedFields = formSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Por favor, corrija os erros no formulário.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // Mock success response since we don't have a DB connection in the browser preview
  console.log("Lead captured:", validatedFields.data);
  return {
    success: true,
    message: "Solicitação enviada com sucesso! Em breve entraremos em contato.",
  };
}