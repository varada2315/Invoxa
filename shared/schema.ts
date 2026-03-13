import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required").transform((value) => value.trim().toLowerCase()),
  password: z.string().min(4, "Password must be at least 4 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Valid email is required").transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1, "Password is required"),
});

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  passwordHash: z.string(),
  createdAt: z.string(),
});

export const publicUserSchema = userSchema.omit({
  passwordHash: true,
});

const bankDetailsSchema = z.object({
  accountName: z.string(),
  accountNumber: z.string(),
  ifscOrSwift: z.string(),
  bankName: z.string(),
});

const paymentPartySchema = z.object({
  upiId: z.string(),
  bankDetails: bankDetailsSchema,
});

const nestedPaymentDetailsSchema = z.object({
  sender: paymentPartySchema,
  receiver: paymentPartySchema,
});

const paymentDetailsSchema = z
  .union([nestedPaymentDetailsSchema, z.string()])
  .transform((value) => {
    if (typeof value !== "string") {
      return value;
    }

    return {
      sender: {
        upiId: value,
        bankDetails: {
          accountName: "",
          accountNumber: "",
          ifscOrSwift: "",
          bankName: "",
        },
      },
      receiver: {
        upiId: "",
        bankDetails: {
          accountName: "",
          accountNumber: "",
          ifscOrSwift: "",
          bankName: "",
        },
      },
    };
  });

export const invoiceTemplateDataSchema = z.object({
  sender: z.object({
    businessName: z.string(),
    address: z.string(),
    phone: z.string(),
    email: z.string(),
    logoDataUrl: z.string(),
  }),
  items: z.array(
    z.object({
      description: z.string(),
      qty: z.number(),
      unitPrice: z.number(),
    }),
  ),
  taxMode: z.enum(["none", "gst", "vat"]),
  taxRate: z.number(),
  discount: z.number(),
  paymentType: z.enum(["upi", "cash", "bank"]),
  paymentDetails: paymentDetailsSchema,
  themeId: z.string(),
  fontId: z.string(),
});

export const insertInvoiceTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  data: invoiceTemplateDataSchema,
});

export const invoiceTemplateSchema = insertInvoiceTemplateSchema.extend({
  id: z.string(),
  userId: z.string(),
  createdAt: z.string(),
});

export const invoiceStatusSchema = z.enum(["paid", "unpaid"]);

export const invoiceSchema = z.object({
  id: z.string(),
  userId: z.string(),
  createdAt: z.string(),
  status: invoiceStatusSchema,
  sender: z.object({
    businessName: z.string(),
    address: z.string(),
    phone: z.string(),
    email: z.string(),
    logoDataUrl: z.string(),
  }),
  client: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    address: z.string(),
    contact: z.string().default(""),
  }),
  items: z.array(
    z.object({
      description: z.string(),
      qty: z.number(),
      unitPrice: z.number(),
    }),
  ),
  taxMode: z.enum(["none", "gst", "vat"]),
  taxRate: z.number(),
  discount: z.number(),
  paymentType: z.enum(["upi", "cash", "bank"]),
  paymentDetails: paymentDetailsSchema,
  transactionId: z.string(),
  total: z.number(),
  themeId: z.string(),
  fontId: z.string(),
});

export const insertInvoiceSchema = invoiceSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const updateInvoiceStatusSchema = z.object({
  status: invoiceStatusSchema,
});

export const updateInvoiceSchema = insertInvoiceSchema;

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type User = z.infer<typeof userSchema>;
export type PublicUser = z.infer<typeof publicUserSchema>;
export type InvoiceTemplateData = z.infer<typeof invoiceTemplateDataSchema>;
export type InsertInvoiceTemplate = z.infer<typeof insertInvoiceTemplateSchema>;
export type InvoiceTemplate = z.infer<typeof invoiceTemplateSchema>;
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;
export type Invoice = z.infer<typeof invoiceSchema>;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type UpdateInvoice = z.infer<typeof updateInvoiceSchema>;
