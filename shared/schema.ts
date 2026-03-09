import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
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
  createdAt: z.string(),
});

export const invoiceStatusSchema = z.enum(["paid", "unpaid"]);

export const invoiceSchema = z.object({
  id: z.string(),
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
  createdAt: true,
});

export const updateInvoiceStatusSchema = z.object({
  status: invoiceStatusSchema,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InvoiceTemplateData = z.infer<typeof invoiceTemplateDataSchema>;
export type InsertInvoiceTemplate = z.infer<typeof insertInvoiceTemplateSchema>;
export type InvoiceTemplate = z.infer<typeof invoiceTemplateSchema>;
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;
export type Invoice = z.infer<typeof invoiceSchema>;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
