import {
  type User,
  type InsertUser,
  type InsertInvoiceTemplate,
  type InvoiceTemplate,
  type InsertInvoice,
  type Invoice,
  type InvoiceStatus,
  invoiceTemplateSchema,
  invoiceSchema,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  listInvoiceTemplates(): Promise<InvoiceTemplate[]>;
  createInvoiceTemplate(template: InsertInvoiceTemplate): Promise<InvoiceTemplate>;
  listInvoices(): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<Invoice | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private invoiceTemplates: Map<string, InvoiceTemplate>;
  private invoices: Map<string, Invoice>;
  private templatesLoaded: boolean;
  private invoicesLoaded: boolean;
  private readonly templatesFilePath: string;
  private readonly invoicesFilePath: string;
  private templateWriteQueue: Promise<void>;
  private invoiceWriteQueue: Promise<void>;

  constructor() {
    this.users = new Map();
    this.invoiceTemplates = new Map();
    this.invoices = new Map();
    this.templatesLoaded = false;
    this.invoicesLoaded = false;
    this.templatesFilePath = path.join(
      process.cwd(),
      "server",
      "data",
      "invoice-templates.json",
    );
    this.invoicesFilePath = path.join(
      process.cwd(),
      "server",
      "data",
      "invoices.json",
    );
    this.templateWriteQueue = Promise.resolve();
    this.invoiceWriteQueue = Promise.resolve();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  private async ensureTemplatesLoaded(): Promise<void> {
    if (this.templatesLoaded) {
      return;
    }

    try {
      const fileContent = await readFile(this.templatesFilePath, "utf8");
      const parsed = JSON.parse(fileContent);
      const templates = Array.isArray(parsed) ? parsed : [];

      for (const template of templates) {
        const validated = invoiceTemplateSchema.safeParse(template);
        if (validated.success) {
          this.invoiceTemplates.set(validated.data.id, validated.data);
        }
      }
    } catch (error) {
      // Ignore missing file and fallback to an empty template store.
    } finally {
      this.templatesLoaded = true;
    }
  }

  private async persistTemplates(): Promise<void> {
    const templates = Array.from(this.invoiceTemplates.values());
    const data = JSON.stringify(templates, null, 2);

    this.templateWriteQueue = this.templateWriteQueue.then(async () => {
      await mkdir(path.dirname(this.templatesFilePath), { recursive: true });
      await writeFile(this.templatesFilePath, data, "utf8");
    });

    await this.templateWriteQueue;
  }

  async listInvoiceTemplates(): Promise<InvoiceTemplate[]> {
    await this.ensureTemplatesLoaded();

    return Array.from(this.invoiceTemplates.values()).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  async createInvoiceTemplate(
    insertTemplate: InsertInvoiceTemplate,
  ): Promise<InvoiceTemplate> {
    await this.ensureTemplatesLoaded();

    const template: InvoiceTemplate = {
      id: randomUUID(),
      name: insertTemplate.name,
      data: insertTemplate.data,
      createdAt: new Date().toISOString(),
    };

    this.invoiceTemplates.set(template.id, template);
    await this.persistTemplates();

    return template;
  }

  private async ensureInvoicesLoaded(): Promise<void> {
    if (this.invoicesLoaded) {
      return;
    }

    try {
      const fileContent = await readFile(this.invoicesFilePath, "utf8");
      const parsed = JSON.parse(fileContent);
      const invoices = Array.isArray(parsed) ? parsed : [];

      for (const invoice of invoices) {
        const validated = invoiceSchema.safeParse(invoice);
        if (validated.success) {
          this.invoices.set(validated.data.id, validated.data);
        }
      }
    } catch (error) {
      // Ignore missing file and fallback to an empty invoice store.
    } finally {
      this.invoicesLoaded = true;
    }
  }

  private async persistInvoices(): Promise<void> {
    const invoices = Array.from(this.invoices.values());
    const data = JSON.stringify(invoices, null, 2);

    this.invoiceWriteQueue = this.invoiceWriteQueue.then(async () => {
      await mkdir(path.dirname(this.invoicesFilePath), { recursive: true });
      await writeFile(this.invoicesFilePath, data, "utf8");
    });

    await this.invoiceWriteQueue;
  }

  async listInvoices(): Promise<Invoice[]> {
    await this.ensureInvoicesLoaded();

    return Array.from(this.invoices.values()).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    await this.ensureInvoicesLoaded();

    const invoice: Invoice = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      ...insertInvoice,
    };

    this.invoices.set(invoice.id, invoice);
    await this.persistInvoices();

    return invoice;
  }

  async updateInvoiceStatus(
    id: string,
    status: InvoiceStatus,
  ): Promise<Invoice | undefined> {
    await this.ensureInvoicesLoaded();

    const existing = this.invoices.get(id);
    if (!existing) {
      return undefined;
    }

    const updated: Invoice = {
      ...existing,
      status,
    };

    this.invoices.set(id, updated);
    await this.persistInvoices();

    return updated;
  }
}

export const storage = new MemStorage();
